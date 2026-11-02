// Workable public careers API (P7-T7, F-24). Verified live on 10 Oct 2026 (leena-ai, skroutz,
// blueground): POST https://apply.workable.com/api/v3/accounts/{account}/jobs with a filter body lists
// the published jobs (no description); GET /api/v2/accounts/{account}/jobs/{shortcode} has
// description / requirements / benefits (HTML) and optional salary fields. Public job page:
// https://apply.workable.com/{account}/j/{shortcode}/. Fixtures: tests/careers/fixtures/workable*.json.
//
// The list comes 10 jobs a page; the next page is the same POST with { token: nextPage } (verified on
// leena-ai: 11 jobs = 10 + 1). As with SmartRecruiters, descriptions are fetched only for titles that
// pass the relevance rules.
import { htmlToText } from '../../text/html.js';
import { evaluateRelevance } from '../../text/relevance.js';

export const kind = 'WORKABLE';
const BASE = 'https://apply.workable.com';
export const MAX_DETAILS = 40;
export const MAX_PAGES = 50;
export const LIST_BODY = { query: '', location: [], department: [], worktype: [], remote: [] };

export const listUrl = (token) => `${BASE}/api/v3/accounts/${encodeURIComponent(token)}/jobs`;
export const detailUrl = (token, shortcode) => `${BASE}/api/v2/accounts/${encodeURIComponent(token)}/jobs/${encodeURIComponent(shortcode)}`;
export const jobUrl = (token, shortcode) => `${BASE}/${encodeURIComponent(token)}/j/${encodeURIComponent(shortcode)}/`;
export const jobsFrom = (body) => (Array.isArray(body?.results) ? body.results : []);

const WORKPLACE = { on_site: 'onsite', remote: 'remote', hybrid: 'hybrid' };
const TYPE = { full: 'Full-time', part: 'Part-time', contract: 'Contract', temporary: 'Temporary', internship: 'Internship', other: null };

function locationText(job) {
    const list = Array.isArray(job.locations) && job.locations.length ? job.locations.filter((l) => !l.hidden) : [job.location].filter(Boolean);
    const names = list.map((l) => [l.city, l.region, l.country].filter(Boolean).join(', ')).filter(Boolean);
    return names.length ? names.join('; ') : null;
}

function compensationText(detail) {
    const from = Number(detail?.salary_from);
    const to = Number(detail?.salary_to);
    if (!(from > 0 || to > 0)) return null;
    const amount = from > 0 && to > 0 && from !== to ? `${from} - ${to}` : String(from > 0 ? from : to);
    const period = { month: 'per month', year: 'per year', week: 'per week', day: 'per day', hour: 'per hour' }[detail.salary_frequency] ?? '';
    return [detail.salary_currency_iso_code, amount, period].filter(Boolean).join(' ');
}

const description = (detail) => ['description', 'requirements', 'benefits'].map((k) => htmlToText(detail?.[k] ?? '')).filter(Boolean).join('\n\n').trim();

export function mapJob(job, detail = null, { boardToken } = {}) {
    return {
        externalId: job.shortcode ? String(job.shortcode) : null,
        title: (job.title ?? '').trim(),
        companyName: null, // a Workable account belongs to one company: the source's company
        locationText: locationText(job),
        url: job.shortcode && boardToken ? jobUrl(boardToken, job.shortcode) : null,
        descriptionText: detail ? description(detail) : null,
        workplaceText: job.remote ? 'remote' : (WORKPLACE[job.workplace] ?? null),
        employmentTypeText: job.type in TYPE ? TYPE[job.type] : (job.type ?? null),
        compensationText: detail ? compensationText(detail) : null,
        postedAt: job.published ?? null,
        deadline: null,
    };
}

export async function fetchAll(source, { getJson }) {
    const token = source.boardToken;
    const jobs = [];
    let next;
    for (let page = 0; page < MAX_PAGES; page++) {
        const body = await getJson(listUrl(token), { body: next ? { ...LIST_BODY, token: next } : LIST_BODY });
        jobs.push(...jobsFrom(body));
        next = body?.nextPage;
        if (!next) break;
    }
    if (next) console.warn(`[careers] workable ${token}: stopped after ${MAX_PAGES} pages (${jobs.length} jobs)`);
    let details = 0;
    const postings = [];
    for (const job of jobs) {
        let raw = mapJob(job, null, { boardToken: token });
        if (evaluateRelevance(raw).keep && details < MAX_DETAILS) {
            raw = mapJob(job, await getJson(detailUrl(token, job.shortcode)), { boardToken: token });
            details += 1;
        }
        postings.push(raw);
    }
    return { jobs: postings, fetchedCount: jobs.length };
}

export function fixtureFrom(body, jobs) {
    return { ...body, results: jobs };
}
