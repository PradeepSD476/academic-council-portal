// SmartRecruiters public Posting API (P7-T7, F-24). Verified live on 10 Oct 2026 (Swiggy, Bosch,
// ServiceNow, Experian): GET /v1/companies/{id}/postings?limit=100&offset=N&country=in lists jobs
// without a description; GET /v1/companies/{id}/postings/{postingId} has jobAd.sections.*.text (HTML).
// Fixtures: tests/careers/fixtures/smartrecruiters*.json.
//
// A board can list hundreds of India jobs (Bosch: 588), and the description costs one request per
// job, so only the jobs whose title already passes the relevance rules are opened (MAX_DETAILS per
// run). A role that is junior only by its description is therefore not found on these boards.
import { htmlToText } from '../../text/html.js';
import { evaluateRelevance } from '../../text/relevance.js';

export const kind = 'SMARTRECRUITERS';
const API = 'https://api.smartrecruiters.com/v1/companies';
const PAGE = 100;
export const MAX_JOBS = 1000;
export const MAX_DETAILS = 40;

export const listUrl = (token, offset) => `${API}/${encodeURIComponent(token)}/postings?limit=${PAGE}&offset=${offset}&country=in`;
export const detailUrl = (token, id) => `${API}/${encodeURIComponent(token)}/postings/${encodeURIComponent(id)}`;
// For scripts/careers/verifyBoard.js: the first page.
export const boardUrl = (token) => listUrl(token, 0);
export const jobsFrom = (body) => (Array.isArray(body?.content) ? body.content : []);

// "bangalore, , India" -> "bangalore, India"
const cleanLocation = (loc) => (loc?.fullLocation ?? '').split(',').map((s) => s.trim()).filter(Boolean).join(', ') || null;

const SECTIONS = ['jobDescription', 'qualifications', 'additionalInformation'];
function description(detail) {
    const sections = detail?.jobAd?.sections ?? {};
    return SECTIONS.map((k) => sections[k]).filter((s) => s?.text)
        .map((s) => [s.title, htmlToText(s.text)].filter(Boolean).join('\n')).join('\n\n').trim();
}

// job: a list item; detail: the posting detail, or null when it was not fetched.
export function mapJob(job, detail = null) {
    const loc = job.location ?? {};
    return {
        externalId: String(job.id),
        title: (job.name ?? '').trim(),
        companyName: null, // a SmartRecruiters company id belongs to one company: the source's company
        locationText: cleanLocation(loc),
        url: detail?.postingUrl ?? (job.company?.identifier ? `https://jobs.smartrecruiters.com/${encodeURIComponent(job.company.identifier)}/${encodeURIComponent(job.id)}` : null),
        descriptionText: detail ? description(detail) : null,
        workplaceText: loc.remote ? 'remote' : loc.hybrid ? 'hybrid' : null,
        employmentTypeText: job.typeOfEmployment?.label ?? null,
        compensationText: null,
        postedAt: job.releasedDate ?? null,
        deadline: null,
    };
}

// getJson: fetchJson (injected for tests).
export async function fetchAll(source, { getJson }) {
    const token = source.boardToken;
    const jobs = [];
    for (let offset = 0; offset < MAX_JOBS; offset += PAGE) {
        const page = await getJson(listUrl(token, offset));
        const content = jobsFrom(page);
        jobs.push(...content);
        if (content.length < PAGE || jobs.length >= (page.totalFound ?? 0)) break;
    }
    let details = 0;
    let detailsSkipped = 0;
    const postings = [];
    for (const job of jobs) {
        let raw = mapJob(job);
        if (evaluateRelevance(raw).keep) {
            if (details < MAX_DETAILS) {
                raw = mapJob(job, await getJson(detailUrl(token, job.id)));
                details += 1;
            } else {
                detailsSkipped += 1;
            }
        }
        postings.push(raw);
    }
    if (detailsSkipped) console.warn(`[careers] smartrecruiters ${token}: ${detailsSkipped} matching jobs not opened this run (limit ${MAX_DETAILS})`);
    return { jobs: postings, fetchedCount: jobs.length };
}

export function fixtureFrom(body, jobs) {
    return { ...body, content: jobs };
}
