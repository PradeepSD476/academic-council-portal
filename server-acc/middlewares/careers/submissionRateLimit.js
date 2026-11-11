// At most careers.submissionDailyLimit link submissions per student per rolling 24 hours.
// Career admins are not limited (they add postings by hand anyway). This middleware is the quick
// check; submitLink repeats it under a per-student lock in the insert transaction (B-11), so
// parallel requests can't all pass the count before any of them inserts.
import prisma from '../../config/db.js';
import { getSetting } from '../../services/careers/settings.js';
import { isCareerAdmin } from './requireCareerAdmin.js';

export const limitMessage = (limit) => `You can share up to ${limit} links a day. Please try again tomorrow.`;

// Links this student shared in the last 24 hours (db: the client or a transaction).
export const recentSubmissionCount = (db, userId, now = new Date()) =>
    db.linkSubmission.count({ where: { submittedById: userId, createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } });

export const submissionRateLimit = async (req, res, next) => {
    if (isCareerAdmin(req.user)) return next();
    try {
        const limit = await getSetting('careers.submissionDailyLimit');
        const used = await recentSubmissionCount(prisma, req.user.id);
        if (used >= limit) {
            return res.status(429).json({
                success: false,
                error: 'RATE_LIMITED',
                message: limitMessage(limit),
                details: { limit, used },
            });
        }
        return next();
    } catch (err) {
        console.error('[careers] submissionRateLimit', err);
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Something went wrong. Please try again.' });
    }
};
