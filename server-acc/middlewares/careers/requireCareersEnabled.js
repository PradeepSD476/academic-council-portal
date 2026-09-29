// Feature flag gate for student-facing careers routes. Career admins always pass, so the feature
// can be validated on real data before students see it ("read-only first" rollout).
import { getSetting } from '../../services/careers/settings.js';
import { isCareerAdmin } from './requireCareerAdmin.js';

export const requireCareersEnabled = async (req, res, next) => {
    if (isCareerAdmin(req.user)) return next();
    try {
        if (await getSetting('careers.visibleToStudents')) return next();
        return res.status(404).json({
            success: false,
            error: 'CAREERS_DISABLED',
            message: 'Jobs & Internships is not available yet.',
        });
    } catch (err) {
        console.error('[careers] requireCareersEnabled', err);
        return res.status(500).json({
            success: false,
            error: 'SERVER_ERROR',
            message: 'Unable to check feature availability. Please try again.',
        });
    }
};
