// "Report a problem" (P6-T7, F-05). A student reports a LIVE posting once; REPORT_FLAG_AT open
// reports add "reported" to its uncertainFields so admins see it (never removed or hidden
// automatically). An admin marks the reports as handled, which clears the flag; the reports stay.
// Who reported is never returned by any endpoint.
import { z } from 'zod';
import { CareersError } from '../errors.js';

export const REPORT_REASONS = ['CLOSED', 'WRONG_PAY', 'WRONG_ELIGIBILITY', 'NOT_A_JOB', 'OTHER'];
export const REPORT_FLAG_AT = 3;
export const REPORTED_FLAG = 'reported';

export const reportBody = z.object({
    reason: z.enum(REPORT_REASONS),
    note: z.string().trim().max(500).nullish().transform((v) => v || null),
}).strict().refine((b) => b.reason !== 'OTHER' || b.note, { message: 'Say what is wrong with this posting.', path: ['note'] });

// Pure. The new uncertainFields when this report crosses the threshold, else null.
export function flagAfterReport(openCount, uncertainFields) {
    const fields = uncertainFields ?? [];
    if (openCount < REPORT_FLAG_AT || fields.includes(REPORTED_FLAG)) return null;
    return [...fields, REPORTED_FLAG];
}

// Pure. uncertainFields without "reported", or null when it wasn't there.
export function flagsAfterHandled(uncertainFields) {
    if (!uncertainFields?.includes(REPORTED_FLAG)) return null;
    return uncertainFields.filter((f) => f !== REPORTED_FLAG);
}

// Student: one report per posting, LIVE postings only. Returns { flagged }.
export async function fileReport(prisma, postingId, userId, body) {
    return prisma.$transaction(async (tx) => {
        const posting = await tx.posting.findUnique({ where: { id: postingId }, select: { status: true, uncertainFields: true } });
        if (!posting || posting.status !== 'LIVE') throw new CareersError(404, 'NOT_FOUND', 'This opening is not available.');
        const existing = await tx.postingReport.findUnique({ where: { userId_postingId: { userId, postingId } }, select: { id: true } });
        if (existing) throw new CareersError(409, 'ALREADY_REPORTED', 'You have already reported this opening. ACC will look at it.');
        await tx.postingReport.create({ data: { postingId, userId, reason: body.reason, note: body.note } });
        const open = await tx.postingReport.count({ where: { postingId, handledAt: null } });
        const flags = flagAfterReport(open, posting.uncertainFields);
        if (flags) await tx.posting.update({ where: { id: postingId }, data: { uncertainFields: flags } });
        return { flagged: Boolean(flags) };
    });
}

// Admin: what students reported, without who.
export async function reportsForAdmin(prisma, postingId) {
    const items = await prisma.postingReport.findMany({
        where: { postingId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, reason: true, note: true, createdAt: true, handledAt: true },
    });
    return { open: items.filter((r) => !r.handledAt).length, total: items.length, items };
}

// Admin: marks every open report as handled and clears the flag. Returns the number handled.
export async function handleReports(prisma, postingId, adminId) {
    return prisma.$transaction(async (tx) => {
        const posting = await tx.posting.findUnique({ where: { id: postingId }, select: { uncertainFields: true } });
        if (!posting) throw new CareersError(404, 'NOT_FOUND', `Posting #${postingId} was not found.`);
        const now = new Date();
        const { count } = await tx.postingReport.updateMany({ where: { postingId, handledAt: null }, data: { handledAt: now } });
        if (!count) throw new CareersError(409, 'NOTHING_TO_HANDLE', 'There are no open reports on this posting.');
        const flags = flagsAfterHandled(posting.uncertainFields);
        if (flags) await tx.posting.update({ where: { id: postingId }, data: { uncertainFields: flags } });
        await tx.postingReview.create({
            data: { postingId, action: 'EDIT', byUserId: adminId, note: `Student reports handled (${count})`, ...(flags ? { changes: { uncertainFields: { from: posting.uncertainFields, to: flags } } } : {}) },
        });
        return count;
    });
}

// Open report counts for a page of postings: Map postingId -> count.
export async function openReportCounts(prisma, postingIds) {
    if (!postingIds.length) return new Map();
    const rows = await prisma.postingReport.groupBy({ by: ['postingId'], where: { postingId: { in: postingIds }, handledAt: null }, _count: { _all: true } });
    return new Map(rows.map((r) => [r.postingId, r._count._all]));
}
