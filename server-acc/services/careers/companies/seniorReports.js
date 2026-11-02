// Seniors' reported stipend, CTC and rounds (P8-T1, F-29; user OK 11 Oct, D-15). Optional numbers on
// an experience. They are private per experience (omitted from every query in config/db.js) and
// appear only as company aggregates: a rounded typical value (median) from MIN_REPORTS published
// experiences, and a middle-half range only from RANGE_REPORTS. No min / max is ever shown.
import { z } from 'zod';

export const MIN_REPORTS = 3;
export const RANGE_REPORTS = 5; // a range only from this many reports
const STIPEND_STEP = 5000;

const blankToNull = (v) => (v === '' || v === undefined ? null : v);
const num = (schema) => z.preprocess(blankToNull, z.coerce.number().pipe(schema).nullable());

const reportSchema = (now) => z.object({
    stipend: num(z.number().int().min(1000).max(1_000_000)).optional(), // ₹ per month
    ctcLpa: num(z.number().min(1).max(200)).optional(), // ₹ lakh per year
    rounds: num(z.number().int().min(1).max(15)).optional(),
    year: num(z.number().int().min(2000).max(now.getUTCFullYear() + 1)).optional(),
}).strict();

// For addpost / editPost. No "report" key → {} (columns untouched, so an admin edit keeps them).
export function reportData(body, now = new Date()) {
    if (!body || !('report' in body)) return {};
    const r = body.report === null ? {} : reportSchema(now).parse(body.report);
    return {
        reportedStipend: r.stipend ?? null,
        reportedCtcLpa: r.ctcLpa ?? null,
        reportedRounds: r.rounds ?? null,
        reportedYear: r.year ?? null,
    };
}

const yearOf = (row) => row.reportedYear ?? new Date(row.createdAt).getUTCFullYear();
function years(rows) {
    const ys = rows.map(yearOf);
    return { fromYear: Math.min(...ys), toYear: Math.max(...ys) };
}
function median(sorted) {
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

// Pure. One figure: nothing below MIN_REPORTS; a typical value (median, rounded to `step`) from
// MIN_REPORTS; the middle half (25th – 75th percentile, widened to `step`) only from RANGE_REPORTS.
// Never min / max: with few reports those are single seniors' figures (security review, 11 Oct).
function summary(values, step) {
    if (values.length < MIN_REPORTS) return null;
    const v = [...values].sort((a, b) => a - b);
    const out = { count: v.length, typical: Math.max(step, Math.round(median(v) / step) * step), low: null, high: null };
    if (v.length >= RANGE_REPORTS) {
        out.low = Math.floor(v[Math.floor(0.25 * (v.length - 1))] / step) * step;
        out.high = Math.ceil(v[Math.ceil(0.75 * (v.length - 1))] / step) * step;
    }
    return out;
}

// Pure. rows: published experiences of one company with the reported* columns and createdAt.
export function aggregateReports(rows) {
    const figure = (key, step, toNumber = Number) => {
        const withIt = rows.filter((r) => r[key] != null);
        const s = summary(withIt.map((r) => toNumber(r[key])), step);
        return s && { ...s, ...years(withIt) };
    };
    return {
        stipend: figure('reportedStipend', STIPEND_STEP),
        ctc: figure('reportedCtcLpa', 1),
        rounds: figure('reportedRounds', 1),
    };
}

// The reported* columns are omitted globally; selecting them here is the only place they are read.
export async function companyReports(db, companyId) {
    const rows = await db.experience.findMany({
        where: { companyId, status: 'PUBLISHED', OR: [{ reportedStipend: { not: null } }, { reportedCtcLpa: { not: null } }, { reportedRounds: { not: null } }] },
        select: { reportedStipend: true, reportedCtcLpa: true, reportedRounds: true, reportedYear: true, createdAt: true },
    });
    return aggregateReports(rows);
}
