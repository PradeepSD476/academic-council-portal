// At most careers.submissionDailyLimit link submissions per student per rolling 24 hours.
// Career admins are not limited (they add postings by hand anyway).
import prisma from '../../config/db.js';
import { getSetting } from '../../services/careers/settings.js';
import { isCareerAdmin } from './requireCareerAdmin.js';

export const submissionRateLimit = async (req, res, next) => {
    if (isCareerAdmin(req.user)) return next();
    try {
        const limit = await getSetting('careers.submissionDailyLimit');
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const used = await prisma.linkSubmission.count({ where: { submittedById: req.user.id, createdAt: { gte: since } } });
        if (used >= limit) {
            return res.status(429).json({
                success: false,
                error: 'RATE_LIMITED',
                message: `You can share up to ${limit} links a day. Please try again tomorrow.`,
                details: { limit, used },
            });
        }
        return next();
    } catch (err) {
        console.error('[careers] submissionRateLimit', err);
        return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Something went wrong. Please try again.' });
    }
};
