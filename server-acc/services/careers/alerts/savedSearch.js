// Job alerts (P7-T1, F-19): a student saves the jobs-page filters and gets a digest of the LIVE
// postings published since the last digest. Pure: body validation, due check, the time window and the
// where clause, so every rule is unit-tested.
import { z } from 'zod';
import { CareersError } from '../errors.js';
import { postingsQuery, baseWhere } from '../postings/query.js';
import { hiddenWhere } from '../postings/hidden.js';

export const MAX_ALERTS = 3;
export const DIGEST_LIMIT = 10; // postings listed in one email; the rest are "and N more"

// The jobs-page params an alert keeps (paging, sort, "new this week" and "show hidden" make no sense
// for a digest). companyName only labels the company filter on the page.
export const ALERT_FILTER_KEYS = [
    'q', 'type', 'workMode', 'location', 'skills', 'companyId', 'minStipend', 'minCtc', 'includeUndisclosed', 'eligibleOnly',
];
const LABEL_KEYS = ['companyName'];

// Raw query values (strings, as in the URL) -> the kept subset; throws a 400 when the jobs page
// itself would reject them.
export function cleanFilters(raw) {
    const out = {};
    for (const key of [...ALERT_FILTER_KEYS, ...LABEL_KEYS]) {
        const value = raw?.[key];
        if (value === undefined || value === null || value === '') continue;
        out[key] = String(value).slice(0, 300);
    }
    const parsed = postingsQuery.safeParse(stripLabels(out));
    if (!parsed.success) {
        throw new CareersError(400, 'VALIDATION_ERROR', 'These filters are not valid.', parsed.error.issues.map((i) => i.message));
    }
    return out;
}

const stripLabels = (filters) => Object.fromEntries(Object.entries(filters ?? {}).filter(([k]) => !LABEL_KEYS.includes(k)));

// Stored filters -> postingsQuery params (defaults filled in).
export const alertParams = (filters) => postingsQuery.parse(stripLabels(filters));

export const alertBody = z.object({
    name: z.string().trim().min(1, 'Give the alert a name').max(60, 'Keep the name under 60 characters'),
    frequency: z.enum(['DAILY', 'WEEKLY']).default('WEEKLY'),
    filters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
}).strict();

export const alertUpdateBody = z.object({
    name: z.string().trim().min(1).max(60).optional(),
    frequency: z.enum(['DAILY', 'WEEKLY']).optional(),
    paused: z.boolean().optional(),
}).strict().refine((b) => Object.keys(b).length > 0, 'Nothing to change');

// A digest goes out at most once per period. The job runs once a day, so the gaps leave room for a
// run that started a little early or late.
const MIN_GAP_MS = { DAILY: 20 * 60 * 60 * 1000, WEEKLY: 6.5 * 24 * 60 * 60 * 1000 };

export function isDue(alert, now = new Date()) {
    if (alert.unsubscribedAt) return false;
    if (!alert.lastRunAt) return true;
    return now.getTime() - new Date(alert.lastRunAt).getTime() >= MIN_GAP_MS[alert.frequency];
}

// New since the last run (or since the alert was made); until = this run's start, so a posting
// published while the run is going is counted next time, never twice.
export const alertWindow = (alert, now = new Date()) => ({ since: new Date(alert.lastRunAt ?? alert.createdAt), until: now });

// eligibility: eligibilityWhere(profile) when the alert has "Eligible for me" and the student has a
// roll number, else null.
export function alertPostingsWhere(params, { since, until }, eligibility, userId) {
    return {
        AND: [
            ...baseWhere(params, { now: until }).AND,
            { OR: [{ publishedAt: { gt: since, lte: until } }, { publishedAt: null, firstSeenAt: { gt: since, lte: until } }] },
            hiddenWhere(userId, false),
            ...(eligibility ? [eligibility] : []),
        ],
    };
}

const TYPE_LABEL = { INTERNSHIP: 'Internships', FULL_TIME: 'Full-time' };
const MODE_LABEL = { ONSITE: 'On-site', HYBRID: 'Hybrid', REMOTE: 'Remote' };

// "Internships · Remote · “react” · Eligible for me", or "All new openings".
export function filterSummary(filters = {}) {
    const parts = [];
    if (filters.q) parts.push(`“${filters.q}”`);
    if (filters.type) parts.push(TYPE_LABEL[filters.type] ?? filters.type);
    if (filters.workMode) parts.push(MODE_LABEL[filters.workMode] ?? filters.workMode);
    if (filters.location) parts.push(filters.location);
    if (filters.companyId) parts.push(filters.companyName || `Company #${filters.companyId}`);
    if (filters.skills) parts.push(`Skills: ${filters.skills}`);
    if (filters.minStipend) parts.push(`Stipend ≥ ₹${filters.minStipend}/month`);
    if (filters.minCtc) parts.push(`CTC ≥ ₹${filters.minCtc}/year`);
    if (String(filters.eligibleOnly) === 'true') parts.push('Eligible for me');
    return parts.length ? parts.join(' · ') : 'All new openings';
}
