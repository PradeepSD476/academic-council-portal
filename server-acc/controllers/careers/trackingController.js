// P4-lite: save a posting, set an application status, and the student's Saved list. Everything is
// scoped to req.user; nobody else (admins included) can read it through these routes.
import prisma from '../../config/db.js';
import { sendError, CareersError, parseId } from '../../services/careers/errors.js';
import { cardFields, loadProfile, toCard } from '../../services/careers/postings/cards.js';
import {
    applicationBody, trackedBy, TRACKABLE_STATUSES, withTracking, byTrackedAt,
} from '../../services/careers/postings/tracking.js';

const SAVED_LIMIT = 200;

// A posting the student may start tracking: LIVE, or one they already track (so an expired role's
// status can still be updated from the Saved page).
async function trackablePosting(id, userId) {
    const posting = await prisma.posting.findUnique({
        where: { id },
        select: {
            status: true,
            saves: { where: { userId }, select: { id: true } },
            applications: { where: { userId }, select: { id: true } },
        },
    });
    const tracked = posting && (posting.saves.length || posting.applications.length);
    if (!posting || !(posting.status === 'LIVE' || (tracked && TRACKABLE_STATUSES.includes(posting.status)))) {
        throw new CareersError(404, 'NOT_FOUND', 'This posting is not available. It may have closed.');
    }
}

export const savePosting = async (req, res) => {
    try {
        const postingId = parseId(req.params.id);
        const userId = req.user.id;
        await trackablePosting(postingId, userId);
        await prisma.savedPosting.upsert({
            where: { userId_postingId: { userId, postingId } },
            create: { userId, postingId },
            update: {},
        });
        return res.status(200).json({ success: true, data: { saved: true } });
    } catch (err) {
        return sendError(res, err, 'savePosting');
    }
};

export const unsavePosting = async (req, res) => {
    try {
        const postingId = parseId(req.params.id);
        await prisma.savedPosting.deleteMany({ where: { userId: req.user.id, postingId } });
        return res.status(200).json({ success: true, data: { saved: false } });
    } catch (err) {
        return sendError(res, err, 'unsavePosting');
    }
};

export const setApplication = async (req, res) => {
    try {
        const postingId = parseId(req.params.id);
        const userId = req.user.id;
        const { status } = applicationBody.parse(req.body ?? {});
        if (status === null) {
            await prisma.postingApplication.deleteMany({ where: { userId, postingId } });
            return res.status(200).json({ success: true, data: { applicationStatus: null } });
        }
        await trackablePosting(postingId, userId);
        await prisma.postingApplication.upsert({
            where: { userId_postingId: { userId, postingId } },
            create: { userId, postingId, status },
            update: { status },
        });
        return res.status(200).json({ success: true, data: { applicationStatus: status } });
    } catch (err) {
        return sendError(res, err, 'setApplication');
    }
};

// Everything the student saved or tracks, most recently touched first.
export const listSaved = async (req, res) => {
    try {
        const userId = req.user.id;
        const [profile, postings] = await Promise.all([
            loadProfile(userId),
            prisma.posting.findMany({
                where: { ...trackedBy(userId), status: { in: TRACKABLE_STATUSES } },
                select: { ...cardFields, status: true },
                take: SAVED_LIMIT,
            }),
        ]);
        const cards = (await withTracking(postings.map((p) => toCard(p, profile)), userId)).sort(byTrackedAt);
        return res.status(200).json({ success: true, data: cards });
    } catch (err) {
        return sendError(res, err, 'listSaved');
    }
};
