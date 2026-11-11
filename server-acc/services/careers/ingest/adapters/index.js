// One adapter per ATS. Each exports: kind, boardUrl(token), jobsFrom(body), mapJob(job) -> RawPosting,
// fixtureFrom(body, jobs). fetchPostings(source) is shared. Boards whose list has no descriptions
// (SmartRecruiters, Workable; P7-T7) export fetchAll(source, { getJson }) -> { jobs: RawPosting[],
// fetchedCount } instead, which pages through the list and opens the jobs it needs.
//
// RawPosting = { externalId, title, companyName, locationText, url, descriptionText, workplaceText,
//                employmentTypeText, compensationText, postedAt, deadline }  (unknown fields are null)
import { fetchJson } from '../http.js';
import * as greenhouse from './greenhouse.js';
import * as lever from './lever.js';
import * as ashby from './ashby.js';
import * as smartrecruiters from './smartrecruiters.js';
import * as workable from './workable.js';

export const ADAPTERS = {
    GREENHOUSE: greenhouse,
    LEVER: lever,
    ASHBY: ashby,
    SMARTRECRUITERS: smartrecruiters,
    WORKABLE: workable,
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
    let jobs;
    let fetchedCount;
    let mapped = false;
    if (adapter.fetchAll) {
        ({ jobs, fetchedCount } = await adapter.fetchAll(source, { getJson: fetchJson }));
        mapped = true;
    } else {
        jobs = adapter.jobsFrom(await fetchJson(adapter.boardUrl(source.boardToken)));
        fetchedCount = jobs.length;
    }
    const postings = [];
    let skipped = 0;
    for (const job of jobs) {
        const raw = mapped ? job : adapter.mapJob(job, { boardToken: source.boardToken });
        if (!raw.externalId || !raw.title || !raw.url) {
            skipped++;
            continue;
        }
        postings.push(raw);
    }
    return { postings, fetchedCount, skipped };
}
