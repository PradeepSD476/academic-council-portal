// One adapter per ATS. Each exports: kind, boardUrl(token), jobsFrom(body), mapJob(job) -> RawPosting,
// fixtureFrom(body, jobs). fetchPostings(source) is shared.
//
// RawPosting = { externalId, title, companyName, locationText, url, descriptionText, workplaceText,
//                employmentTypeText, compensationText, postedAt, deadline }  (unknown fields are null)
import { fetchJson } from '../http.js';
import * as greenhouse from './greenhouse.js';
import * as lever from './lever.js';
import * as ashby from './ashby.js';

export const ADAPTERS = {
    GREENHOUSE: greenhouse,
    LEVER: lever,
    ASHBY: ashby,
};

export function adapterFor(kind) {
    const adapter = ADAPTERS[kind];
    if (!adapter) throw new Error(`No ATS adapter for source kind ${kind}`);
    return adapter;
}

// Fetches and maps every job on a source's board. Throws on network/HTTP errors (the caller
// records a FAILED run); jobs that can't be mapped are skipped and counted.
export async function fetchPostings(source) {
    const adapter = adapterFor(source.kind);
    const body = await fetchJson(adapter.boardUrl(source.boardToken));
    const jobs = adapter.jobsFrom(body);
    const postings = [];
    let skipped = 0;
    for (const job of jobs) {
        const raw = adapter.mapJob(job, { boardToken: source.boardToken });
        if (!raw.externalId || !raw.title || !raw.url) {
            skipped++;
            continue;
        }
        postings.push(raw);
    }
    return { postings, fetchedCount: jobs.length, skipped };
}
