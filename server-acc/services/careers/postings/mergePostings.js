// Merge two postings by hand (P7-T8, F-06): dedup misses some pairs. The dropped posting's
// observations, saves, application statuses and "Not for me" marks move to the kept one; the dropped
// one becomes REJECTED "Duplicate of #N" (kept, so its history and reports stay readable). A student
// who had the same thing on both keeps one row on the kept posting. One PostingReview row per posting.
import { z } from 'zod';
import { CareersError } from '../errors.js';

const id = z.number().int().positive();
export const mergeBody = z.object({ keepId: id, dropId: id }).strict()
    .refine((b) => b.keepId !== b.dropId, 'Pick two different postings.');
export const mergeQuery = z.object({ keepId: z.coerce.number().int().positive(), dropId: z.coerce.number().int().positive() });

// Pure. keep, drop: { id, status } | null. Returns null or the reason it can't be done.
export function mergeProblem(keep, drop) {
    if (!keep || !drop) return 'Posting not found.';
    if (keep.id === drop.id) return 'Pick two different postings.';
    if (keep.status === 'REJECTED') return `#${keep.id} is rejected; merge into a posting that is live, waiting for review or expired.`;
    if (drop.status === 'REJECTED') return `#${drop.id} is already rejected.`;
    if (drop.status === 'LIVE' && keep.status !== 'LIVE') return `#${drop.id} is live and #${keep.id} is not; merge #${keep.id} into #${drop.id} instead.`;
    return null;
}

// Furthest stage wins when a student tracked both. OFFER beats REJECTED (a later stage of the process).
const STAGE = { INTERESTED: 0, APPLIED: 1, IN_PROGRESS: 2, REJECTED: 3, OFFER: 4 };
const NOTE_MAX = 500;

// Pure. The kept posting's application after the merge, when the student tracked both.
export function mergedApplication(keep, drop) {
    const status = STAGE[drop.status] > STAGE[keep.status] ? drop.status : keep.status;
    const notes = [keep.note, drop.note].filter((n) => n && n.trim());
    const note = notes.length ? [...new Set(notes)].join('\n').slice(0, NOTE_MAX) : null;
    const dates = [keep.appliedAt, drop.appliedAt].filter(Boolean).map((d) => new Date(d));
    const appliedAt = dates.length ? new Date(Math.min(...dates)) : null;
    return { status, note, appliedAt };
}

// Moves the per-student rows of one model (unique per user and posting). Rows the student already has
// on the kept posting stay; the dropped posting's duplicate row is removed (its content was merged).
async function moveUserRows(tx, model, keepId, dropId, onBoth = null) {
    const keepRows = await tx[model].findMany({ where: { postingId: keepId } });
    const byUser = new Map(keepRows.map((r) => [r.userId, r]));
    const dropRows = await tx[model].findMany({ where: { postingId: dropId } });
    let moved = 0;
    let merged = 0;
    for (const row of dropRows) {
        const existing = byUser.get(row.userId);
        if (existing) {
            if (onBoth) await onBoth(existing, row);
            await tx[model].delete({ where: { id: row.id } });
            merged += 1;
        } else {
            await tx[model].update({ where: { id: row.id }, data: { postingId: keepId } });
            moved += 1;
        }
    }
    return { moved, merged };
}

async function load(db, keepId, dropId) {
    const select = { id: true, status: true, roleTitle: true, company: { select: { name: true } } };
    const [keep, drop] = await Promise.all([db.posting.findUnique({ where: { id: keepId }, select }), db.posting.findUnique({ where: { id: dropId }, select })]);
    const problem = mergeProblem(keep, drop);
    if (problem) throw new CareersError(problem === 'Posting not found.' ? 404 : 409, problem === 'Posting not found.' ? 'NOT_FOUND' : 'INVALID_STATE', problem);
    return { keep, drop };
}

// What a merge would move (for the confirm dialog).
export async function mergePreview(db, { keepId, dropId }) {
    const { keep, drop } = await load(db, keepId, dropId);
    const count = (model) => db[model].count({ where: { postingId: dropId } });
    const [observations, saves, applications, hidden] = await Promise.all([count('postingSource'), count('savedPosting'), count('postingApplication'), count('hiddenPosting')]);
    return { keep, drop, moves: { observations, saves, applications, hidden } };
}

export async function mergePostings(db, { keepId, dropId, adminId, now = new Date() }) {
    return db.$transaction(async (tx) => {
        const { keep, drop } = await load(tx, keepId, dropId);
        const observations = (await tx.postingSource.updateMany({ where: { postingId: dropId }, data: { postingId: keepId } })).count;
        const saves = await moveUserRows(tx, 'savedPosting', keepId, dropId);
        const applications = await moveUserRows(tx, 'postingApplication', keepId, dropId, (k, d) => tx.postingApplication.update({ where: { id: k.id }, data: mergedApplication(k, d) }));
        const hidden = await moveUserRows(tx, 'hiddenPosting', keepId, dropId);
        await tx.posting.update({
            where: { id: dropId },
            data: { status: 'REJECTED', rejectReason: `Duplicate of #${keepId}`, reviewedById: adminId, reviewedAt: now },
        });
        const summary = `${observations} observation(s), ${saves.moved + saves.merged} save(s), ${applications.moved + applications.merged} application status(es)`;
        await tx.postingReview.create({ data: { postingId: dropId, action: 'REJECT', byUserId: adminId, note: `Merged into #${keepId}: ${summary} moved.`, changes: { status: { from: drop.status, to: 'REJECTED' }, mergedInto: keepId } } });
        await tx.postingReview.create({ data: { postingId: keepId, action: 'EDIT', byUserId: adminId, note: `Merged #${dropId} into this posting: ${summary}.`, changes: { mergedFrom: dropId } } });
        return { keep, drop, observations, saves, applications, hidden };
    });
}
