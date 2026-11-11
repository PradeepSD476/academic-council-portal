// Safer bulk actions in the review queue (P6-T8, F-04): Undo for a bulk approve, and bulk reject /
// bulk expire. Each posting goes through the single-posting action, so each gets its own
// PostingReview row and its own status checks.
import { z } from 'zod';
import prisma from '../../../config/db.js';
import { rejectPosting, expirePosting, approveTrail } from './reviewService.js';

export { approveTrail };

// The toast offers Undo for 30 s; the server allows a little longer for a slow click.
export const UNDO_WINDOW_MS = 60 * 1000;

const ids = z.array(z.number().int().positive()).min(1).max(200);
export const bulkBodies = {
    ids: z.object({ ids }),
    reject: z.object({ ids, reason: z.string().trim().min(1).max(500) }),
};

// Pure. latest = the posting's newest PostingReview row. Returns { data } or { skip: reason }.
export function undoPlan(posting, latest, userId, now = new Date()) {
    if (posting.status !== 'LIVE') return { skip: `status is ${posting.status}` };
    if (!latest || latest.action !== 'APPROVE') return { skip: 'it was changed since it was approved' };
    if (latest.byUserId !== userId) return { skip: 'it was approved by another admin' };
    if (now.getTime() - new Date(latest.createdAt).getTime() > UNDO_WINDOW_MS) return { skip: 'too late to undo; take it down instead' };
    const c = latest.changes ?? {};
    if (!c.publishedAt || !c.reviewedById) return { skip: 'it was approved individually; take it down instead' };
    const date = (v) => (v ? new Date(v) : null);
    return { data: { status: 'PENDING_REVIEW', publishedAt: date(c.publishedAt.from), reviewedById: c.reviewedById.from, reviewedAt: date(c.reviewedAt?.from) } };
}

export async function undoBulkApprove(postingIds, userId) {
    const undone = [];
    const skipped = [];
    for (const id of postingIds) {
        const result = await prisma.$transaction(async (tx) => {
            const posting = await tx.posting.findUnique({ where: { id }, select: { id: true, status: true, publishedAt: true } });
            if (!posting) return { skip: 'not found' };
            const latest = await tx.postingReview.findFirst({ where: { postingId: id }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
            const plan = undoPlan(posting, latest, userId);
            if (plan.skip) return plan;
            await tx.posting.update({ where: { id }, data: plan.data });
            await tx.postingReview.create({ data: { postingId: id, action: 'EDIT', byUserId: userId, note: 'Bulk approve undone', changes: { status: { from: 'LIVE', to: 'PENDING_REVIEW' } } } });
            return plan;
        });
        if (result.skip) skipped.push({ id, reason: result.skip });
        else undone.push(id);
    }
    return { undone, skipped };
}

async function eachPosting(postingIds, fn) {
    const done = [];
    const skipped = [];
    for (const id of postingIds) {
        try {
            await fn(id);
            done.push(id);
        } catch (err) {
            skipped.push({ id, reason: err.message });
        }
    }
    return { done, skipped };
}

export const bulkReject = (postingIds, reason, userId) => eachPosting(postingIds, (id) => rejectPosting(id, reason, userId));
export const bulkExpire = (postingIds, userId) => eachPosting(postingIds, (id) => expirePosting(id, userId, 'Bulk expire'));
