// Fetches a student-submitted URL without letting it reach internal machines (SSRF guard,
// Architecture 7a). Every rule is mandatory:
//   - http/https only, ports 80/443 only, URL <= 2048 chars, no credentials in the URL
//   - DNS is checked at connect time (undici Agent with a guarded lookup), so a hostname that
//     re-resolves to a private address after a first check (DNS rebinding) is still refused
//   - redirects are followed by hand, max 3, and every hop is checked again
//   - 10 s timeout, 2 MB body cap, content-type text/html or application/json only
import dns from 'node:dns';
import net from 'node:net';
import { Agent, request } from 'undici';
import { isBlockedAddress } from './ipGuard.js';
import { USER_AGENT } from '../ingest/http.js';
import { MAX_URL_LENGTH } from './canonicalUrl.js';

export const MAX_BYTES = 2 * 1024 * 1024;
export const TIMEOUT_MS = 10_000;
export const MAX_REDIRECTS = 3;
const ALLOWED_TYPES = /^(text\/html|application\/xhtml\+xml|application\/json)\b/i;

export class SafeFetchError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code; // BLOCKED_URL | BLOCKED_ADDRESS | TOO_LARGE | BAD_TYPE | HTTP_STATUS | TOO_MANY_REDIRECTS | NETWORK
    }
}

// lookup(hostname, options, callback) as net.connect expects it, refusing blocked addresses.
// resolver is injectable for tests.
export function makeGuardedLookup(resolver = dns.lookup) {
    return (hostname, options, callback) => {
        const opts = typeof options === 'object' && options !== null ? options : { family: options };
        resolver(hostname, { ...opts, all: true }, (err, addresses) => {
            if (err) return callback(err);
            const list = Array.isArray(addresses) ? addresses : [{ address: addresses, family: opts.family }];
            const blocked = list.find((a) => isBlockedAddress(a.address));
            if (blocked || !list.length) {
                const e = new SafeFetchError(`${hostname} resolves to a blocked address (${blocked?.address ?? 'none'})`, 'BLOCKED_ADDRESS');
                return callback(e);
            }
            if (opts.all) return callback(null, list);
            return callback(null, list[0].address, list[0].family);
        });
    };
}

const agent = new Agent({ connect: { lookup: makeGuardedLookup(), timeout: TIMEOUT_MS }, headersTimeout: TIMEOUT_MS, bodyTimeout: TIMEOUT_MS });

// Throws SafeFetchError if the URL itself is not allowed (before any network activity).
export function checkUrl(input) {
    if (typeof input !== 'string' || input.length > MAX_URL_LENGTH) throw new SafeFetchError('URL is missing or too long', 'BLOCKED_URL');
    let url;
    try {
        url = new URL(input);
    } catch {
        throw new SafeFetchError('Not a valid URL', 'BLOCKED_URL');
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new SafeFetchError(`Scheme ${url.protocol} is not allowed`, 'BLOCKED_URL');
    if (url.username || url.password) throw new SafeFetchError('URLs with credentials are not allowed', 'BLOCKED_URL');
    if (url.port && !['80', '443'].includes(url.port)) throw new SafeFetchError(`Port ${url.port} is not allowed`, 'BLOCKED_URL');
    // An IP literal never goes through DNS lookup, so it is checked here.
    const host = url.hostname.replace(/^\[|\]$/g, '');
    if (net.isIP(host) && isBlockedAddress(host)) throw new SafeFetchError(`Address ${host} is not allowed`, 'BLOCKED_ADDRESS');
    return url;
}

async function readCapped(body) {
    const chunks = [];
    let size = 0;
    for await (const chunk of body) {
        size += chunk.length;
        if (size > MAX_BYTES) {
            body.destroy();
            throw new SafeFetchError(`Page is larger than ${MAX_BYTES / 1024 / 1024} MB`, 'TOO_LARGE');
        }
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
}

// Returns { url (final), status, contentType, body }. Throws SafeFetchError.
export async function safeFetch(input, { dispatcher = agent } = {}) {
    let url = checkUrl(input);
    const signal = AbortSignal.timeout(TIMEOUT_MS);
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        console.info(`[careers] safeFetch GET ${url.host}${url.pathname.slice(0, 80)}`);
        let res;
        try {
            res = await request(url, {
                method: 'GET',
                dispatcher,
                signal,
                headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml,application/json;q=0.9' },
            });
        } catch (err) {
            if (err instanceof SafeFetchError) throw err;
            if (err?.cause instanceof SafeFetchError) throw err.cause;
            throw new SafeFetchError(`Could not fetch ${url.host}: ${err.message}`, 'NETWORK');
        }

        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            await res.body.dump();
            if (hop === MAX_REDIRECTS) throw new SafeFetchError(`More than ${MAX_REDIRECTS} redirects`, 'TOO_MANY_REDIRECTS');
            url = checkUrl(new URL(String(res.headers.location), url).toString());
            continue;
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
            await res.body.dump();
            const e = new SafeFetchError(`HTTP ${res.statusCode} from ${url.host}`, 'HTTP_STATUS');
            e.status = res.statusCode;
            throw e;
        }
        const contentType = String(res.headers['content-type'] ?? '');
        if (!ALLOWED_TYPES.test(contentType)) {
            await res.body.dump();
            throw new SafeFetchError(`Unsupported content type "${contentType || 'none'}"`, 'BAD_TYPE');
        }
        return { url: url.toString(), status: res.statusCode, contentType, body: await readCapped(res.body) };
    }
    throw new SafeFetchError(`More than ${MAX_REDIRECTS} redirects`, 'TOO_MANY_REDIRECTS');
}
