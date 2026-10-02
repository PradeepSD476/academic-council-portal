// Student browsing: the LIVE posting list with filters, and one posting's detail (Architecture 9.1).
// The where-clauses are built in services/careers/postings/query.js; eligibility per posting comes
// from postings/eligibility.js. The student's CPI is read here for filtering only and never returned.
import prisma from '../../config/db.js';
import { sendError, CareersError, parseId } from '../../services/careers/errors.js';
import { isCareerAdmin } from '../../middlewares/careers/requireCareerAdmin.js';
import { cardFields, loadProfile, toCard } from '../../services/careers/postings/cards.js';
import {
    postingsQuery, baseWhere, eligibilityWhere, withEligibility, orderByFor, hasPayFilter,
} from '../../services/careers/postings/query.js';

const detailFields = {
    ...cardFields,
    status: true, descriptionText: true, applyUrl: true, deadlineStated: true, ppoMentioned: true, compensationRaw: true,
    extractionTier: true, // STRUCTURED / JSON_LD / LLM_* / MANUAL: the page says how the details were collected
    observations: {
        orderBy: { firstSeenAt: 'asc' },
        select: { url: true, firstSeenAt: true, lastSeenAt: true, isLive: true, source: { select: { name: true, kind: true } } },
    },
};

export const listPostings = async (req, res) => {
    try {
        const params = postingsQuery.parse(req.query);
        const profile = await loadProfile(req.user.id);

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
        const published = { companyId: posting.company.id, status: 'PUBLISHED' };
        const [profile, companyExperienceCount, companyExperiences] = await Promise.all([
            loadProfile(req.user.id),
            prisma.experience.count({ where: published }),
            // The most recent few, for the "past experiences at X" panel (P3-T3).
            prisma.experience.findMany({ where: published, orderBy: { createdAt: 'desc' }, take: 3, select: { id: true, title: true, experienceType: true, createdAt: true } }),
        ]);
        const { observations, ...rest } = posting;
        return res.status(200).json({
            success: true,
            data: {
                ...toCard(rest, profile),
                observations: observations.map(({ source, ...o }) => ({ ...o, sourceName: source.name, sourceKind: source.kind })),
                companyExperienceCount,
                companyExperiences,
            },
        });
    } catch (err) {
        return sendError(res, err, 'getPosting');
    }
};
