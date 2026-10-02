// Student browsing: the LIVE posting list with filters, and one posting's detail (Architecture 9.1).
// The where-clauses are built in services/careers/postings/query.js; eligibility per posting comes
// from postings/eligibility.js. The student's CPI is read here for filtering only and never returned.
import prisma from '../../config/db.js';
import { sendError, CareersError, parseId } from '../../services/careers/errors.js';
import { isCareerAdmin } from '../../middlewares/careers/requireCareerAdmin.js';
import { eligibilityProfile, postingEligibility, toCpi } from '../../services/careers/postings/eligibility.js';
import {
    postingsQuery, baseWhere, eligibilityWhere, withEligibility, orderByFor, hasPayFilter,
} from '../../services/careers/postings/query.js';

const cardFields = {
    id: true, roleTitle: true, type: true, workMode: true, location: true, skills: true,
    compCurrency: true, stipendMin: true, stipendMax: true, stipendDisclosure: true,
    ctcMin: true, ctcMax: true, ctcDisclosure: true,
    eligibleBranches: true, eligibleYears: true, minCpi: true,
    firstSeenAt: true, lastSeenLiveAt: true, publishedAt: true,
    company: { select: { id: true, name: true, slug: true } },
};

const detailFields = {
    ...cardFields,
    status: true, descriptionText: true, applyUrl: true, deadlineStated: true, ppoMentioned: true, compensationRaw: true,
    observations: {
        orderBy: { firstSeenAt: 'asc' },
        select: { url: true, firstSeenAt: true, lastSeenAt: true, isLive: true, source: { select: { name: true, kind: true } } },
    },
};

async function profileFor(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { branchName: true, admissionYear: true, cpi: true } });
    return eligibilityProfile(user ?? {});
}

const toCard = (posting, profile) => ({
    ...posting,
    minCpi: toCpi(posting.minCpi),
    eligibility: postingEligibility(posting, profile),
});

export const listPostings = async (req, res) => {
    try {
        const params = postingsQuery.parse(req.query);
        const profile = await profileFor(req.user.id);

        let eligibility = null;
        let eligibilityMeta = { applied: false };
        if (params.eligibleOnly) {
            eligibility = eligibilityWhere(profile);
            eligibilityMeta = eligibility ? { applied: true } : { applied: false, reason: 'NO_ROLL_NUMBER' };
        }
        const base = baseWhere(params);
        const where = withEligibility(base, eligibility);

        const [total, items] = await Promise.all([
            prisma.posting.count({ where }),
            prisma.posting.findMany({
                where, select: cardFields, orderBy: orderByFor(params.sort),
                skip: (params.page - 1) * params.limit, take: params.limit,
            }),
        ]);

        // Results that matched only because their pay is undisclosed (or not in INR).
        let undisclosedIncluded = 0;
        if (params.includeUndisclosed && hasPayFilter(params)) {
            const disclosedOnly = await prisma.posting.count({ where: withEligibility(baseWhere(params, { includeUndisclosed: false }), eligibility) });
            undisclosedIncluded = total - disclosedOnly;
        }
        const hiddenByEligibility = eligibility ? (await prisma.posting.count({ where: base })) - total : 0;

        return res.status(200).json({
            success: true,
            data: items.map((p) => toCard(p, profile)),
            pagination: { total, page: params.page, limit: params.limit, totalPages: Math.ceil(total / params.limit) },
            meta: { undisclosedIncluded, hiddenByEligibility, eligibility: eligibilityMeta },
        });
    } catch (err) {
        return sendError(res, err, 'listPostings');
    }
};

// LIVE postings for everyone; career admins can open any status (to preview before approving).
export const getPosting = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        const posting = await prisma.posting.findUnique({ where: { id }, select: detailFields });
        if (!posting || (posting.status !== 'LIVE' && !isCareerAdmin(req.user))) {
            throw new CareersError(404, 'NOT_FOUND', 'This posting is not available. It may have closed.');
        }
        const [profile, companyExperienceCount] = await Promise.all([
            profileFor(req.user.id),
            prisma.experience.count({ where: { companyId: posting.company.id, status: 'PUBLISHED' } }),
        ]);
        const { observations, ...rest } = posting;
        return res.status(200).json({
            success: true,
            data: {
                ...toCard(rest, profile),
                observations: observations.map(({ source, ...o }) => ({ ...o, sourceName: source.name, sourceKind: source.kind })),
                companyExperienceCount,
            },
        });
    } catch (err) {
        return sendError(res, err, 'getPosting');
    }
};
