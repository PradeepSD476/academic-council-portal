// JSON fetch for allowlisted ATS APIs (fixed, known hosts; user-supplied URLs go through
// links/safeFetch.js instead). Identifies itself, times out, retries once on 5xx/network errors.

export const USER_AGENT = 'ACC-IITP-CareerVault/1.0 (+https://acc.iitp.ac.in)';
const TIMEOUT_MS = 15_000;
// A broken board could send hundreds of MB (B-20). The largest real board seen is 9.6 MB (Databricks).
export const MAX_JSON_BYTES = 30 * 1024 * 1024;
const TOO_LARGE = 413; // not retried (fetchJson retries only network errors and 5xx)

export class HttpError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

// Reads the body, stopping (and cancelling the download) as soon as it passes maxBytes.
async function readCapped(res, url, maxBytes) {
    const chunks = [];
    let size = 0;
    for await (const chunk of res.body ?? []) {
        size += chunk.length;
        if (size > maxBytes) {
            await res.body.cancel().catch((err) => console.warn(`[careers] could not cancel the download from ${new URL(url).host}: ${err.message}`));
            throw new HttpError(`Response from ${new URL(url).host} is larger than ${Math.round(maxBytes / 1024 / 1024)} MB`, TOO_LARGE);
        }
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
}

async function once(url, maxBytes) {
    const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: 'follow',
    });
    if (!res.ok) throw new HttpError(`HTTP ${res.status} from ${new URL(url).host}`, res.status);
    const text = await readCapped(res, url, maxBytes);
    try {
        return JSON.parse(text);
    } catch {
        throw new HttpError(`Invalid JSON from ${new URL(url).host}`, res.status);
    }
}

export async function fetchJson(url, { maxBytes = MAX_JSON_BYTES } = {}) {
    try {
        return await once(url, maxBytes);
    } catch (err) {
        const retryable = !(err instanceof HttpError) || err.status >= 500;
        if (!retryable) throw err;
        await new Promise((r) => setTimeout(r, 1500));
        return once(url, maxBytes);
    }
}
