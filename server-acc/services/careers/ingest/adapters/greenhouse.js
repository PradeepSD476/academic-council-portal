// Greenhouse public job board API. Field names verified against a live response (29-30 Sep 2026);
// fixture: tests/careers/fixtures/greenhouse.json.
import { htmlToText } from '../../text/html.js';
import { withLazyField } from './lazyField.js';

export const kind = 'GREENHOUSE';

export function boardUrl(token) {
    return `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs?content=true`;
}

export function jobsFrom(body) {
    return Array.isArray(body?.jobs) ? body.jobs : [];
}

// Greenhouse custom fields ("metadata") sometimes carry pay or employment type.
function metadataValue(job, pattern) {
    const field = (job.metadata ?? []).find((m) => pattern.test(m?.name ?? '') && m.value != null && m.value !== '');
    if (!field) return null;
    if (typeof field.value === 'string') return field.value;
    if (Array.isArray(field.value)) return field.value.join(', ');
    if (typeof field.value === 'object') {
        const { min_value: min, max_value: max, unit } = field.value;
        if (min || max) return [unit, min, max ? `- ${max}` : ''].filter(Boolean).join(' ');
    }
    return String(field.value);
}

export function mapJob(job) {
    // Some boards put "Hybrid" / "In-Office" in location.name and the real cities in offices[].
    const places = [job.location?.name, ...(job.offices ?? []).map((o) => o.location || o.name)]
        .map((p) => p?.trim())
        .filter(Boolean);
    const locationText = places.length ? [...new Set(places)].join('; ') : null;
    const raw = {
        externalId: String(job.id),
        title: (job.title ?? '').trim(),
        companyName: job.company_name ?? null,
        locationText,
        url: job.absolute_url,
        descriptionText: null,
        workplaceText: locationText, // Greenhouse has no workplace field; "Remote - India" lives in the location
        employmentTypeText: metadataValue(job, /employment|job type|commitment/i),
        compensationText: metadataValue(job, /salary|compensation|stipend|pay/i),
        postedAt: job.first_published ?? job.updated_at ?? null,
        deadline: job.application_deadline ?? null,
    };
    return withLazyField(raw, 'descriptionText', () => htmlToText(job.content ?? '', { escaped: true }));
}

export function fixtureFrom(body, jobs) {
    return { jobs, meta: { total: jobs.length } };
}
