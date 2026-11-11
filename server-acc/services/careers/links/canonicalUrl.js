// One spelling per link, so the same job shared twice (with tracking tags, a #fragment, a trailing
// slash, upper-case host) is recognised as the same submission. Pure.
const TRACKING = /^(utm_\w+|gclid|fbclid|msclkid|mc_cid|mc_eid|igshid|ref|ref_src|referrer|source|src|trk|trackingid|lipi|gh_src|lever-source|lever-origin)$/i;

export const MAX_URL_LENGTH = 2048;

// Returns the canonical string, or null for anything that is not an http(s) URL we accept.
export function canonicalUrl(input) {
    if (typeof input !== 'string') return null;
    const raw = input.trim();
    if (!raw || raw.length > MAX_URL_LENGTH) return null;
    let url;
    try {
        url = new URL(raw);
    } catch {
        return null;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (url.username || url.password) return null;

    url.hash = '';
    url.hostname = url.hostname.toLowerCase().replace(/\.$/, '');
    const kept = [...url.searchParams.entries()].filter(([k]) => !TRACKING.test(k)).sort(([a], [b]) => a.localeCompare(b));
    url.search = '';
    for (const [k, v] of kept) url.searchParams.append(k, v);
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, '');
    return url.toString();
}
