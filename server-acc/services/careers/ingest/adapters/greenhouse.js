// Greenhouse public job board API. Field names verified against a live response (29-30 Sep 2026);
// fixture: tests/careers/fixtures/greenhouse.json.
import { htmlToText } from '../../text/html.js';
import { withLazyField } from './lazyField.js';
import { normalizeLocation } from '../../text/normalize.js';
import { classifyLocation } from '../../text/relevance.js';

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

const CONCRETE = ['india', 'foreign'];
const text = (p) => (typeof p === 'string' && p.trim()) || null;

// location.name, then offices[].location. An office *name* is often a department or a label
// ("Payments", "India Locations"), so names are used only when nothing before is a concrete place:
// some boards put "In-Office" in location.name and the place only in the office name, and "Remote"
// alone says nothing about the country ("Remote; US" must stay a US job). Places that normalise to
// the same city are kept once ("Bangalore" + "Bangalore East, Bengaluru, ...").
export function greenhousePlaces(job) {
    const offices = job.offices ?? [];
    const places = [text(job.location?.name), ...offices.map((o) => text(o.location))].filter(Boolean);
    if (!places.some((p) => CONCRETE.includes(classifyLocation(p)))) places.push(...offices.map((o) => text(o.name)).filter(Boolean));
    const seen = new Set();
    return places.filter((p) => {
        // The class too: every remote variant normalises to "remote", but "Remote India" and
        // "United States - Remote" are not the same place as "Remote".
        const key = `${normalizeLocation(p) ?? p.toLowerCase()}|${classifyLocation(p)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

export function mapJob(job) {
    const places = greenhousePlaces(job);
    const locationText = places.length ? places.join('; ') : null;
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
