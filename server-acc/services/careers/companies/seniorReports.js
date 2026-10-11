// Seniors' reported stipend, CTC and rounds (P8-T1, F-29; user OK 11 Oct, D-15). Optional numbers on
// an experience. They are private per experience (omitted from every query in config/db.js) and
// appear only as company aggregates, once at least MIN_REPORTS published experiences report the same
// number. Ranges are widened to ₹5k / 1 lakh steps so a single senior's figure is not shown exactly.
import { z } from 'zod';

export const MIN_REPORTS = 3;
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

// Pure. rows: published experiences of one company with the reported* columns and createdAt.
export function aggregateReports(rows) {
    const withStipend = rows.filter((r) => r.reportedStipend != null);
    const withCtc = rows.filter((r) => r.reportedCtcLpa != null);
    const withRounds = rows.filter((r) => r.reportedRounds != null);
    const stipends = withStipend.map((r) => r.reportedStipend);
    const ctcs = withCtc.map((r) => Number(r.reportedCtcLpa));
    const rounds = withRounds.map((r) => r.reportedRounds).sort((a, b) => a - b);
    return {
        stipend: withStipend.length >= MIN_REPORTS ? {
            count: withStipend.length,
            min: Math.floor(Math.min(...stipends) / STIPEND_STEP) * STIPEND_STEP,
            max: Math.ceil(Math.max(...stipends) / STIPEND_STEP) * STIPEND_STEP,
            ...years(withStipend),
        } : null,
        ctc: withCtc.length >= MIN_REPORTS ? {
            count: withCtc.length, min: Math.floor(Math.min(...ctcs)), max: Math.ceil(Math.max(...ctcs)), ...years(withCtc),
        } : null,
        rounds: withRounds.length >= MIN_REPORTS ? {
            count: withRounds.length, typical: median(rounds), min: rounds[0], max: rounds[rounds.length - 1], ...years(withRounds),
        } : null,
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
