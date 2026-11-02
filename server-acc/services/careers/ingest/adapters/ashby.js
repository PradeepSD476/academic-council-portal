// Ashby public job board API. Field names verified against a live response (29-30 Sep 2026);
// fixture: tests/careers/fixtures/ashby.json.
import { htmlToText } from '../../text/html.js';
import { withLazyField } from './lazyField.js';

export const kind = 'ASHBY';

export function boardUrl(token) {
    return `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(token)}?includeCompensation=true`;
}

// Unlisted jobs are hidden on the company's own board, so we skip them too.
export function jobsFrom(body) {
    return Array.isArray(body?.jobs) ? body.jobs.filter((j) => j.isListed !== false) : [];
}

function compensationText(job) {
    if (!job.shouldDisplayCompensationOnJobPostings) return null;
    const c = job.compensation ?? {};
    return c.compensationTierSummary || c.scrapeableCompensationSalarySummary || null;
}

export function mapJob(job) {
    const places = [job.location, ...(job.secondaryLocations ?? []).map((l) => l.location)].filter(Boolean);
    // isRemote marks the role as remote-eligible; adding "Remote" lets the relevance filter decide
    // whether that remote is open to India.
    if (job.isRemote && !places.some((p) => /remote/i.test(p))) places.push('Remote');
    const raw = {
        externalId: String(job.id),
        title: (job.title ?? '').trim(),
        companyName: null, // an Ashby board belongs to one company: the source's company
        locationText: places.length ? places.join('; ') : null,
        url: job.jobUrl ?? job.applyUrl,
        descriptionText: null,
        workplaceText: job.workplaceType ?? null,
        employmentTypeText: job.employmentType ?? null,
        compensationText: compensationText(job),
        postedAt: job.publishedAt ?? null,
        deadline: null,
    };
    return withLazyField(raw, 'descriptionText', () => job.descriptionPlain?.trim() || htmlToText(job.descriptionHtml ?? ''));
}

export function fixtureFrom(body, jobs) {
    return { jobs, apiVersion: body?.apiVersion ?? null };
}
