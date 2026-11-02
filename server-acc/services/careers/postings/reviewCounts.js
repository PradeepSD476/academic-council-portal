// Counts shown on the review queue tabs and on the admin sidebar badge (P5-T6, F-16).
// `waiting` = postings an admin still has to look at (pending + flagged).
import prisma from '../../../config/db.js';
import { reviewWhere } from './reviewService.js';
import { aiTierUsable, needsAttentionWhere } from '../links/waiting.js';

// links = student links an admin has to act on (B-26: failed + needs a person); linksTotal = all of them.
export async function reviewCounts(threshold, db = prisma, aiUsable = undefined) {
    const usable = aiUsable ?? await aiTierUsable();
    const [pending, flagged, candidates, links, linksTotal] = await Promise.all([
        db.posting.count({ where: reviewWhere('pending', threshold) }),
        db.posting.count({ where: reviewWhere('flagged', threshold) }),
        db.company.count({ where: { status: 'CANDIDATE', rejectedAt: null } }),
        db.linkSubmission.count({ where: needsAttentionWhere(usable) }),
        db.linkSubmission.count(),
    ]);
    return { pending, flagged, candidates, links, linksTotal, waiting: pending + flagged };
}
