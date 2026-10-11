// Counts shown on the review queue tabs and on the admin sidebar badge (P5-T6, F-16).
// `waiting` = postings an admin still has to look at (pending + flagged).
import prisma from '../../../config/db.js';
import { reviewWhere } from './reviewService.js';

export const OPEN_LINK_STATUSES = ['RECEIVED', 'PROCESSING', 'EXTRACTING', 'FAILED'];

export async function reviewCounts(threshold, db = prisma) {
    const [pending, flagged, candidates, links] = await Promise.all([
        db.posting.count({ where: reviewWhere('pending', threshold) }),
        db.posting.count({ where: reviewWhere('flagged', threshold) }),
        db.company.count({ where: { status: 'CANDIDATE', rejectedAt: null } }),
        db.linkSubmission.count({ where: { status: { in: OPEN_LINK_STATUSES }, dismissedAt: null } }),
    ]);
    return { pending, flagged, candidates, links, waiting: pending + flagged };
}
