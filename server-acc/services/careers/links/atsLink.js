// Recognises job links on the three supported ATS and fetches that one job from the ATS's public
// JSON API (cost cascade tier 1: no HTML scraping, no model). parseAtsLink is pure.
import { fetchJson, HttpError } from '../ingest/http.js';
import { ADAPTERS } from '../ingest/adapters/index.js';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const TOKEN = '[A-Za-z0-9][A-Za-z0-9_-]*';

// Returns { kind, boardToken, jobId } or null.
export function parseAtsLink(input) {
    let url;
    try {
        url = new URL(input);
    } catch {
        return null;
    }
    const host = url.hostname.toLowerCase();
    const path = url.pathname;
    let m;

    if (host === 'boards.greenhouse.io' || host === 'job-boards.greenhouse.io' || host === 'job-boards.eu.greenhouse.io') {
        // /{token}/jobs/{id}, or the embed form /embed/job_app?for={token}&token={id}
        if ((m = path.match(new RegExp(`^/(${TOKEN})/jobs/(\\d+)`)))) return { kind: 'GREENHOUSE', boardToken: m[1].toLowerCase(), jobId: m[2] };
        const forToken = url.searchParams.get('for');
        const jobToken = url.searchParams.get('token');
        if (path.startsWith('/embed/job_app') && forToken && /^\d+$/.test(jobToken ?? '')) return { kind: 'GREENHOUSE', boardToken: forToken.toLowerCase(), jobId: jobToken };
        return null;
    }
    if (host === 'jobs.lever.co' || host === 'jobs.eu.lever.co') {
        if ((m = path.match(new RegExp(`^/(${TOKEN})/(${UUID})`, 'i')))) return { kind: 'LEVER', boardToken: m[1].toLowerCase(), jobId: m[2].toLowerCase() };
        return null;
    }
    if (host === 'jobs.ashbyhq.com') {
        if ((m = path.match(new RegExp(`^/([^/]+)/(${UUID})`, 'i')))) return { kind: 'ASHBY', boardToken: decodeURIComponent(m[1]).toLowerCase(), jobId: m[2].toLowerCase() };
        return null;
    }
    return null;
}

// The single job as a RawPosting, or throws (404 = the job is closed or the link is wrong).
export async function fetchAtsJob({ kind, boardToken, jobId }) {
    const adapter = ADAPTERS[kind];
    let job;
    if (kind === 'GREENHOUSE') {
        job = await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs/${encodeURIComponent(jobId)}?content=true`);
    } else if (kind === 'LEVER') {
        job = await fetchJson(`https://api.lever.co/v0/postings/${encodeURIComponent(boardToken)}/${encodeURIComponent(jobId)}?mode=json`);
    } else {
        // Ashby has no public single-job endpoint; read the board and pick the job.
        const jobs = adapter.jobsFrom(await fetchJson(adapter.boardUrl(boardToken)));
        job = jobs.find((j) => String(j.id).toLowerCase() === jobId);
        if (!job) throw new HttpError(`Job ${jobId} is not on the ${boardToken} Ashby board (closed or unlisted)`, 404);
    }
    const raw = adapter.mapJob(job, { boardToken });
    if (!raw.externalId || !raw.title || !raw.url) throw new Error('The ATS returned a job without an id, title or URL');
    return raw;
}
