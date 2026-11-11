// What admins and students can do with a shared link after it was submitted (P5-T4, F-09; decisions
// D-01 / D-04): an admin retries a failed link or turns it into a manual posting; a student withdraws
// their own link while it is still waiting. Nothing is deleted: withdrawn / dismissed links keep their
// row with `dismissedAt` / `dismissReason` / `dismissedById` and are never processed again.
// The *Problem functions are pure: null = allowed, else why not.
import { z } from 'zod';
import prisma from '../../../config/db.js';
import { CareersError } from '../errors.js';

export const WITHDRAWN_REASON = 'Withdrawn by you';

export function retryProblem(s) {
    if (s.dismissedAt) return 'This link was dismissed; it is not processed again.';
    if (s.status !== 'FAILED') return `Only a link that failed can be retried (this one is ${s.status}).`;
    return null;
}

export function withdrawProblem(s, userId) {
    if (s.submittedById !== userId) return { status: 403, message: 'You can only withdraw a link you shared.' };
    if (s.dismissedAt) return { status: 409, message: 'This link was already withdrawn.' };
    if (s.status !== 'RECEIVED') return { status: 409, message: 'This link is already being processed, so it can no longer be withdrawn.' };
    return null;
}

export const dismissBody = z.object({ reason: z.string().trim().min(1).max(200) }).strict();

export function dismissProblem(s) {
    if (s.dismissedAt) return 'This link was already dismissed or withdrawn.';
    if (s.postingId) return `This link already has posting #${s.postingId}; take the posting down instead.`;
    return null;
}

export function linkProblem(s) {
    if (s.dismissedAt) return 'This link was dismissed.';
    if (s.postingId) return `This link already has posting #${s.postingId}.`;
    return null;
}

async function loadSubmission(db, id) {
    const s = await db.linkSubmission.findUnique({ where: { id } });
    if (!s) throw new CareersError(404, 'NOT_FOUND', `Link #${id} was not found.`);
    return s;
}

// Admin: FAILED -> RECEIVED; the next links run fetches it again through the same SSRF-guarded path.
export async function retrySubmission(id, db = prisma) {
    const s = await loadSubmission(db, id);
    const problem = retryProblem(s);
    if (problem) throw new CareersError(409, 'CONFLICT', problem);
    return db.linkSubmission.update({ where: { id }, data: { status: 'RECEIVED', error: null } });
}

// Student: withdraw their own link while it is still RECEIVED (kept, marked, never processed).
export async function withdrawSubmission(id, userId, db = prisma) {
    const s = await loadSubmission(db, id);
    const problem = withdrawProblem(s, userId);
    if (problem) throw new CareersError(problem.status, problem.status === 403 ? 'FORBIDDEN' : 'CONFLICT', problem.message);
    // Conditional update: a worker that picked the row up in the meantime wins.
    const { count } = await db.linkSubmission.updateMany({
        where: { id, status: 'RECEIVED', dismissedAt: null },
        data: { dismissedAt: new Date(), dismissReason: WITHDRAWN_REASON, dismissedById: userId },
    });
    if (!count) throw new CareersError(409, 'CONFLICT', 'This link is already being processed, so it can no longer be withdrawn.');
    return db.linkSubmission.findUnique({ where: { id } });
}

// Admin (P5-T5, F-18): the link is kept and marked, never processed again, and the reason is shown to
// the student. A queued AI extraction for it is cancelled (FAILED, so it never reaches the model).
export async function dismissSubmission(id, reason, adminId, db = prisma) {
    return db.$transaction(async (tx) => {
        const s = await loadSubmission(tx, id);
        const problem = dismissProblem(s);
        if (problem) throw new CareersError(409, 'CONFLICT', problem);
        await tx.extraction.updateMany({ where: { submissionId: id, state: 'QUEUED' }, data: { state: 'FAILED', error: 'Link dismissed by an admin' } });
        return tx.linkSubmission.update({ where: { id }, data: { dismissedAt: new Date(), dismissReason: reason, dismissedById: adminId } });
    });
}

// Inside the manual-posting transaction: point the link at its new posting so the student sees it.
export async function attachSubmission(tx, submissionId, postingId) {
    const s = await loadSubmission(tx, submissionId);
    const problem = linkProblem(s);
    if (problem) throw new CareersError(409, 'CONFLICT', problem);
    return tx.linkSubmission.update({ where: { id: submissionId }, data: { postingId, status: 'PENDING_REVIEW', error: null } });
}

// Checked before the posting is created, so a bad submissionId doesn't leave a posting behind.
export async function assertLinkable(submissionId, db = prisma) {
    const problem = linkProblem(await loadSubmission(db, submissionId));
    if (problem) throw new CareersError(409, 'CONFLICT', problem);
}
