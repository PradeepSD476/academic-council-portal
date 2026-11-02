import { getSetting } from '../../services/careers/settings.js';
import { isCareerAdmin } from '../../middlewares/careers/requireCareerAdmin.js';

// Tells the client whether to show the Jobs & Internships UI. Not flag-gated itself.
export const getCareersStatus = async (req, res) => {
    try {
        const admin = isCareerAdmin(req.user);
        const visible = await getSetting('careers.visibleToStudents');
        return res.status(200).json({
            success: true,
            message: 'Careers status fetched.',
            data: { enabled: admin || Boolean(visible), visibleToStudents: Boolean(visible), isCareerAdmin: admin },
        });
    } catch (err) {
        console.error('[careers] getCareersStatus', err);
        return res.status(500).json({
            success: false,
            error: 'SERVER_ERROR',
            message: 'Unable to fetch careers status. Please try again.',
        });
    }
};
