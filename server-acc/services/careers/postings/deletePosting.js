// Delete a posting permanently (P8-T2, F-02 level 2; user OK 11 Oct). Career admin only, for spam and
// test data. A LIVE posting must be taken down first, the admin types the posting number back, and
// the preview shows what goes with it. The posting's observations, reviews, saves, statuses, reports,
// "Not for me" marks and daily counters go (their foreign keys cascade); one PostingDeletion row keeps
// the title, company, reason, counts, admin and time. A student link that made it is kept and marked
// dismissed with a reason, so "My submissions" stays truthful.
import { z } from 'zod';
import { CareersError } from '../errors.js';

export const LINK_REMOVED_REASON = 'The posting made from this link was removed by ACC.';
const BOARD_KINDS = new Set(['GREENHOUSE', 'LEVER', 'ASHBY', 'SMARTRECRUITERS', 'WORKABLE']);

export const deleteBody = z.object({
    reason: z.string().trim().min(1).max(300),
    confirmId: z.number().int().positive(),
}).strict();

// Pure. confirmId undefined = preview (nothing typed yet).
export function deleteProblem(posting, confirmId) {
    if (!posting) return { status: 404, code: 'NOT_FOUND', message: 'This posting was not found.' };
    if (posting.status === 'LIVE') return { status: 409, code: 'CONFLICT', message: 'Take the posting down first. A LIVE posting cannot be deleted.' };
    if (confirmId !== undefined && confirmId !== posting.id) return { status: 400, code: 'CONFIRM_MISMATCH', message: `Type ${posting.id} to confirm.` };
    return null;
}

// Pure. A job board that still lists the job adds it again (for review) on its next fetch.
export const comesBack = (observations) => observations.some((o) => o.isLive && BOARD_KINDS.has(o.source?.kind));

async function loadPosting(db, id) {
    return db.posting.findUnique({
        where: { id },
        select: {
            id: true, roleTitle: true, status: true, company: { select: { name: true } },
            observations: { select: { isLive: true, url: true, source: { select: { kind: true, name: true } } } },
            _count: { select: { saves: true, applications: true, reports: true, hiddenBy: true, observations: true, reviews: true } },
        },
    });
}

async function counts(db, posting) {
    const [clicks, links, duplicates] = await Promise.all([
        db.postingDailyStat.aggregate({ where: { postingId: posting.id }, _sum: { applyClicks: true } }),
        db.linkSubmission.count({ where: { postingId: posting.id } }),
        db.posting.count({ where: { rejectReason: `Duplicate of #${posting.id}` } }),
    ]);
    const c = posting._count;
    return {
        saves: c.saves, applications: c.applications, reports: c.reports, hidden: c.hiddenBy,
        observations: c.observations, reviews: c.reviews, applyClicks: clicks._sum.applyClicks ?? 0,
        links, duplicates,
    };
}

function fail(problem) {
    throw new CareersError(problem.status, problem.code, problem.message);
}

export async function deletePreview(db, id) {
    const posting = await loadPosting(db, id);
    const problem = deleteProblem(posting);
    if (problem) fail(problem);
    return {
        posting: { id: posting.id, roleTitle: posting.roleTitle, company: posting.company.name, status: posting.status },
        removed: await counts(db, posting),
        comesBack: comesBack(posting.observations),
    };
}

export async function deletePosting(db, id, { reason, confirmId }, adminId) {
    return db.$transaction(async (tx) => {
        const posting = await loadPosting(tx, id);
        const problem = deleteProblem(posting, confirmId);
        if (problem) fail(problem);
        const removed = await counts(tx, posting);
        const now = new Date();
        // Kept: the student's link (dismissed with a reason) and any extraction row (unlinked).
        await tx.linkSubmission.updateMany({
            where: { postingId: id },
            data: { postingId: null, dismissedAt: now, dismissReason: LINK_REMOVED_REASON, dismissedById: adminId },
        });
        await tx.extraction.updateMany({ where: { postingId: id }, data: { postingId: null } });
        const log = await tx.postingDeletion.create({
            data: {
                postingId: id, roleTitle: posting.roleTitle, companyName: posting.company.name, status: posting.status,
                reason, removed, byUserId: adminId,
            },
        });
        await tx.posting.delete({ where: { id } });
        return { deletionId: log.id, posting: { id, roleTitle: posting.roleTitle, company: posting.company.name }, removed, comesBack: comesBack(posting.observations) };
    });
}
