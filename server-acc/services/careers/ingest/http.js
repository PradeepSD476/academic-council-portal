// JSON fetch for allowlisted ATS APIs (fixed, known hosts; user-supplied URLs go through
// links/safeFetch.js instead). Identifies itself, times out, retries once on 5xx/network errors.

export const USER_AGENT = 'ACC-IITP-CareerVault/1.0 (+https://acc.iitp.ac.in)';
const TIMEOUT_MS = 15_000;

export class HttpError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

async function once(url) {
    const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: 'follow',
    });
    if (!res.ok) throw new HttpError(`HTTP ${res.status} from ${new URL(url).host}`, res.status);
    try {
        return await res.json();
    } catch {
        throw new HttpError(`Invalid JSON from ${new URL(url).host}`, res.status);
    }
}

export async function fetchJson(url) {
    try {
        return await once(url);
    } catch (err) {
        const retryable = !(err instanceof HttpError) || err.status >= 500;
        if (!retryable) throw err;
        await new Promise((r) => setTimeout(r, 1500));
        return once(url);
    }
}
