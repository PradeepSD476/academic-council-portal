// Student browsing: the LIVE posting list with filters, and one posting's detail (Architecture 9.1).
// The where-clauses are built in services/careers/postings/query.js; eligibility per posting comes
// from postings/eligibility.js. The student's CPI is read here for filtering only and never returned.
import prisma from '../../config/db.js';
import { sendError, CareersError, parseId } from '../../services/careers/errors.js';
import { isCareerAdmin } from '../../middlewares/careers/requireCareerAdmin.js';
import { cardFields, loadProfile, toCard } from '../../services/careers/postings/cards.js';
import { withTracking, TRACKABLE_STATUSES } from '../../services/careers/postings/tracking.js';
import { adminInfo } from '../../services/careers/postings/adminInfo.js';
import { newCountQuery, newSinceWhere } from '../../services/careers/postings/newCount.js';
import { reportBody, fileReport } from '../../services/careers/postings/reports.js';
import { hiddenWhere } from '../../services/careers/postings/hidden.js';
import { recordVisit, recordApplyClick } from '../../services/careers/usage/usage.js';
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

// GET /careers/postings/new-count?since=<ms> (P6-T2, F-21): the sidebar's "New for you" count.
export const newPostingsCount = async (req, res) => {
    try {
        const { since } = newCountQuery(req.query);
        const profile = await loadProfile(req.user.id);
        const eligibility = eligibilityWhere(profile);
        const count = await prisma.posting.count({ where: newSinceWhere(since, eligibility, req.user.id) });
        return res.json({ success: true, data: { count, eligibilityApplied: Boolean(eligibility) } });
    } catch (err) {
        return sendError(res, err, 'newPostingsCount');
    }
};

// POST /careers/postings/:id/report (P6-T7, F-05): once per student, LIVE postings only.
export const reportPosting = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        const body = reportBody.parse(req.body ?? {});
        await fileReport(prisma, id, req.user.id, body);
        return res.status(201).json({ success: true, message: 'Thanks. ACC will check this opening.', data: { reportedByMe: true } });
    } catch (err) {
        return sendError(res, err, 'reportPosting');
    }
};

// POST /careers/postings/:id/apply-click (P7-T4, F-30): +1 on the posting's daily counter. Who
// clicked is not stored.
export const applyClick = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        const posting = await prisma.posting.findUnique({ where: { id }, select: { status: true } });
        if (posting?.status !== 'LIVE') throw new CareersError(404, 'NOT_FOUND', 'This posting is not available.');
        await recordApplyClick(prisma, id);
        return res.json({ success: true });
    } catch (err) {
        return sendError(res, err, 'applyClick');
    }
};

export const listPostings = async (req, res) => {
    try {
        const params = postingsQuery.parse(req.query);
        const profile = await loadProfile(req.user.id);
        // P7-T4: weekly unique visitors (a keyed hash, never the user id); not awaited by the page.
        recordVisit(prisma, req.user, { isAdmin: isCareerAdmin(req.user) })
            .catch((err) => console.error('[careers] usage: could not count the visit', err));

        let eligibility = null;
        let eligibilityMeta = { applied: false };
        if (params.eligibleOnly) {
            eligibility = eligibilityWhere(profile);
            eligibilityMeta = eligibility ? { applied: true } : { applied: false, reason: 'NO_ROLL_NUMBER' };
        }
        // P6-T9: the student's own "Not for me" postings are left out, or listed alone with showHidden.
        const base = { AND: [...baseWhere(params).AND, hiddenWhere(req.user.id, params.showHidden)] };
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
            const disclosedOnly = await prisma.posting.count({ where: withEligibility({ AND: [...baseWhere(params, { includeUndisclosed: false }).AND, hiddenWhere(req.user.id, params.showHidden)] }, eligibility) });
            undisclosedIncluded = total - disclosedOnly;
        }
        const hiddenByEligibility = eligibility ? (await prisma.posting.count({ where: base })) - total : 0;
        // How many of the openings matching these filters the student hid ("Show hidden (n)").
        const hiddenByYou = params.showHidden ? total
            : await prisma.posting.count({ where: withEligibility({ AND: [...baseWhere(params).AND, hiddenWhere(req.user.id, true)] }, eligibility) });

        return res.status(200).json({
            success: true,
            data: await withTracking(items.map((p) => toCard(p, profile)), req.user.id),
            pagination: { total, page: params.page, limit: params.limit, totalPages: Math.ceil(total / params.limit) },
            meta: { undisclosedIncluded, hiddenByEligibility, hiddenByYou, showHidden: params.showHidden, eligibility: eligibilityMeta },
        });
    } catch (err) {
        return sendError(res, err, 'listPostings');
    }
};

async function loadAdminInfo(posting) {
    const reviews = await prisma.postingReview.findMany({
        where: { postingId: posting.id }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 50,
        select: { action: true, byUserId: true, createdAt: true, note: true },
    });
    const users = await prisma.user.findMany({ where: { id: { in: [...new Set(reviews.map((r) => r.byUserId))] } }, select: { id: true, displayName: true, email: true } });
    return adminInfo(posting, reviews, new Map(users.map((u) => [u.id, u.displayName || u.email])));
}

// LIVE postings for everyone; career admins can open any status (to preview before approving), and a
// student can still open an expired posting they saved or track (P4-lite).
export const getPosting = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        const posting = await prisma.posting.findUnique({ where: { id }, select: detailFields });
        const [tracked] = posting ? await withTracking([{ id }], req.user.id) : [];
        const ownTracked = tracked && (tracked.saved || tracked.applicationStatus) && TRACKABLE_STATUSES.includes(posting.status);
        if (!posting || (posting.status !== 'LIVE' && !isCareerAdmin(req.user) && !ownTracked)) {
            throw new CareersError(404, 'NOT_FOUND', 'This posting is not available. It may have closed.');
        }
        const published = { companyId: posting.company.id, status: 'PUBLISHED' };
        const [profile, companyExperienceCount, companyExperiences, myReport] = await Promise.all([
            loadProfile(req.user.id),
            prisma.experience.count({ where: published }),
            // The most recent few, for the "past experiences at X" panel (P3-T3).
            prisma.experience.findMany({ where: published, orderBy: { createdAt: 'desc' }, take: 3, select: { id: true, title: true, experienceType: true, createdAt: true } }),
            prisma.postingReport.findUnique({ where: { userId_postingId: { userId: req.user.id, postingId: id } }, select: { id: true } }),
        ]);
        const { observations, ...rest } = posting;
        // Career admins also get status and who approved it, for the bar on the job page (P5-T3).
        const admin = isCareerAdmin(req.user) ? await loadAdminInfo(posting) : undefined;
        return res.status(200).json({
            success: true,
            data: {
                ...toCard(rest, profile),
                saved: tracked.saved,
                applicationStatus: tracked.applicationStatus,
                applicationNote: tracked.applicationNote,
                appliedAt: tracked.appliedAt,
                observations: observations.map(({ source, ...o }) => ({ ...o, sourceName: source.name, sourceKind: source.kind })),
                companyExperienceCount,
                companyExperiences,
                reportedByMe: Boolean(myReport), // only the caller's own report, never anyone else's
                ...(admin ? { adminInfo: admin } : {}),
            },
        });
    } catch (err) {
        return sendError(res, err, 'getPosting');
    }
};
