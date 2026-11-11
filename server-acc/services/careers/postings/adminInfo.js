// What the career-admin bar on the student job page shows (P5-T3, F-03): status, who approved the
// posting and when, and the latest review action. Only ever added to responses for career admins.
// `reviews` are PostingReview rows newest first; `names` maps user id -> display name. Pure.
export function adminInfo(posting, reviews, names) {
    const name = (id) => names.get(id) ?? `User #${id}`;
    const approval = reviews.find((r) => r.action === 'APPROVE');
    const last = reviews[0];
    return {
        postingId: posting.id,
        status: posting.status,
        approvedBy: approval ? name(approval.byUserId) : null,
        approvedAt: approval?.createdAt ?? null,
        lastAction: last ? { action: last.action, by: name(last.byUserId), at: last.createdAt, note: last.note ?? null } : null,
    };
}
