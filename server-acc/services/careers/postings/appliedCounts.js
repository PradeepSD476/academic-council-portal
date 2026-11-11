// "How many students from campus applied here" (proposal §4.5): anonymous counts from the students'
// own application tracking. Applied means the student moved past Interested (Applied, In progress,
// Rejected or Offer). Only STUDENT accounts count (admins track postings while testing). A count
// below MIN_SHOWN is never sent, so one or two students can't be singled out; no names ever leave.
// The viewer's own row is never counted: otherwise a student could switch their status on and off and
// learn from the count appearing / disappearing that exactly MIN_SHOWN - 1 others applied (security review).
export const APPLIED_STATUSES = ['APPLIED', 'IN_PROGRESS', 'REJECTED', 'OFFER'];
export const MIN_SHOWN = 3;

// Pure. The number to send, or null below MIN_SHOWN.
export function shownCount(n) {
    return n >= MIN_SHOWN ? n : null;
}

// Pure. The filter for counted rows: everyone but the viewer; extra narrows it (one posting, or one company's postings).
export function appliedWhere(extra, viewerId) {
    return { ...extra, userId: { not: viewerId }, status: { in: APPLIED_STATUSES }, user: { role: 'STUDENT' } };
}

// Other students who applied to this posting.
export async function postingAppliedCount(db, postingId, viewerId) {
    return shownCount(await db.postingApplication.count({ where: appliedWhere({ postingId }, viewerId) }));
}

// Other students (each once) who applied to any of this company's postings, open or closed.
export async function companyAppliedCount(db, companyId, viewerId) {
    const rows = await db.postingApplication.groupBy({ by: ['userId'], where: appliedWhere({ posting: { companyId } }, viewerId) });
    return shownCount(rows.length);
}
