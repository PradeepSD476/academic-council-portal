// The student's own eligibility profile and self-reported CPI. These are the only careers endpoints
// that read User.cpi: config/db.js omits it everywhere, and an explicit `select` is the only way
// back in. They only ever return the caller's own row.
import prisma from '../../config/db.js';
import { sendError } from '../../services/careers/errors.js';
import { eligibilityProfile, cpiBody, programmeBody } from '../../services/careers/postings/eligibility.js';

const profileFields = { branchName: true, admissionYear: true, cpi: true, cpiUpdatedAt: true, programme: true, graduationYear: true };

export const getMyEligibility = async (req, res) => {
    try {
        const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user.id }, select: profileFields });
        return res.status(200).json({ success: true, data: eligibilityProfile(user) });
    } catch (err) {
        return sendError(res, err, 'getMyEligibility');
    }
};

export const updateMyCpi = async (req, res) => {
    try {
        const { cpi } = cpiBody.parse(req.body);
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { cpi, cpiUpdatedAt: cpi === null ? null : new Date() },
            select: profileFields,
        });
        const message = cpi === null ? 'CPI removed.' : 'CPI saved. It is only used to filter postings for you.';
        return res.status(200).json({ success: true, message, data: eligibilityProfile(user) });
    } catch (err) {
        return sendError(res, err, 'updateMyCpi');
    }
};

// P7-T2: the student corrects their programme and expected graduation year (both private).
export const updateMyProgramme = async (req, res) => {
    try {
        const body = programmeBody.parse(req.body ?? {});
        const user = await prisma.user.update({ where: { id: req.user.id }, data: body, select: profileFields });
        return res.status(200).json({ success: true, message: 'Saved. "Eligible for me" now uses it.', data: eligibilityProfile(user) });
    } catch (err) {
        return sendError(res, err, 'updateMyProgramme');
    }
};
