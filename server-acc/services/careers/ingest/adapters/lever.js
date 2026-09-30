// Lever public postings API. Field names verified against a live response (29-30 Sep 2026);
// fixture: tests/careers/fixtures/lever.json.
import { htmlToText } from '../../text/html.js';

export const kind = 'LEVER';

export function boardUrl(token) {
    return `https://api.lever.co/v0/postings/${encodeURIComponent(token)}?mode=json`;
}

export function jobsFrom(body) {
    return Array.isArray(body) ? body : [];
}

const INTERVAL = {
    'per-month-salary': 'per month',
    'per-year-salary': 'per year',
    'per-week-salary': 'per week',
    'per-day-salary': 'per day',
    'per-hour-salary': 'per hour',
    'one-time': 'one time',
};

// Lever's optional salaryRange -> text that parseCompensation understands; salaryDescription as fallback.
function compensationText(job) {
    const r = job.salaryRange;
    if (r && (r.min != null || r.max != null)) {
        const amount = r.min != null && r.max != null && r.min !== r.max ? `${r.min} - ${r.max}` : String(r.min ?? r.max);
        return [r.currency, amount, INTERVAL[r.interval] ?? ''].filter(Boolean).join(' ');
    }
    return job.salaryDescriptionPlain?.trim() || null;
}

function description(job) {
    const parts = [job.descriptionPlain || htmlToText(job.description ?? '')];
    for (const list of job.lists ?? []) {
        const items = htmlToText(list.content ?? '');
        if (list.text || items) parts.push([list.text, items].filter(Boolean).join('\n'));
    }
    if (job.additionalPlain) parts.push(job.additionalPlain);
    return parts.filter(Boolean).join('\n\n').trim();
}

export function mapJob(job) {
    const c = job.categories ?? {};
    const locations = Array.isArray(c.allLocations) && c.allLocations.length ? c.allLocations : [c.location].filter(Boolean);
    return {
        externalId: String(job.id),
        title: (job.text ?? '').trim(),
        companyName: null, // a Lever site belongs to one company: the source's company
        locationText: locations.length ? locations.join('; ') : null,
        url: job.hostedUrl ?? job.applyUrl,
        descriptionText: description(job),
        workplaceText: job.workplaceType && job.workplaceType !== 'unspecified' ? job.workplaceType : null,
        employmentTypeText: c.commitment ?? null,
        compensationText: compensationText(job),
        postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
        deadline: null,
    };
}

export function fixtureFrom(body, jobs) {
    return jobs;
}
