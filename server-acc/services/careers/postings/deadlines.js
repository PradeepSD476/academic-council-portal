// Daily: a posting whose stated application deadline has passed is expired (B-06). Before this, such
// a role stayed LIVE until it left its board, which some companies never do. Runs in the worker's
// daily liveness job; like the other automatic expiries it writes no PostingReview row (those record
// an admin's action), it logs the ids instead.
import prisma from '../../../config/db.js';
import { istDayStart } from '../istDate.js';

const EXPIRABLE = ['LIVE', 'PENDING_REVIEW'];

// Returns { expired, ids }.
export async function expirePastDeadlines({ db = prisma, now = new Date() } = {}) {
    const where = { status: { in: EXPIRABLE }, deadlineStated: { lt: istDayStart(now) } };
    const due = await db.posting.findMany({ where, select: { id: true, roleTitle: true } });
    if (!due.length) return { expired: 0, ids: [] };

    const ids = due.map((p) => p.id);
    // Same where again, so a posting an admin changed in between is left alone.
    const { count } = await db.posting.updateMany({ where: { ...where, id: { in: ids } }, data: { status: 'EXPIRED' } });
    console.info(`[careers] deadlines: expired ${count} posting(s) whose stated deadline passed: ${due.map((p) => `#${p.id} ${p.roleTitle}`).join('; ')}`);
    return { expired: count, ids };
}
