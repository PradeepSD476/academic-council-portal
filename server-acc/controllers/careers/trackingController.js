// P4-lite: save a posting, set an application status, and the student's Saved list. Everything is
// scoped to req.user; nobody else (admins included) can read it through these routes.
import prisma from '../../config/db.js';
import { sendError, CareersError, parseId } from '../../services/careers/errors.js';
import { cardFields, loadProfile, toCard } from '../../services/careers/postings/cards.js';
import {
    applicationBody, trackedBy, TRACKABLE_STATUSES, withTracking, byTrackedAt, noteBody, appliedAtFor,
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

// "Not for me" (P6-T9, F-12): hides a LIVE posting from this student's jobs list only.
export const hidePosting = async (req, res) => {
    try {
        const postingId = parseId(req.params.id);
        const userId = req.user.id;
        const posting = await prisma.posting.findUnique({ where: { id: postingId }, select: { status: true } });
        if (posting?.status !== 'LIVE') throw new CareersError(404, 'NOT_FOUND', 'This posting is not available. It may have closed.');
        await prisma.hiddenPosting.upsert({
            where: { userId_postingId: { userId, postingId } },
            create: { userId, postingId },
            update: {},
        });
        return res.status(200).json({ success: true, data: { hidden: true } });
    } catch (err) {
        return sendError(res, err, 'hidePosting');
    }
};

export const unhidePosting = async (req, res) => {
    try {
        const postingId = parseId(req.params.id);
        await prisma.hiddenPosting.deleteMany({ where: { userId: req.user.id, postingId } });
        return res.status(200).json({ success: true, data: { hidden: false } });
    } catch (err) {
        return sendError(res, err, 'unhidePosting');
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
        // appliedAt (P6-T10) is set once, the first time the status reaches Applied or later.
        const current = await prisma.postingApplication.findUnique({ where: { userId_postingId: { userId, postingId } }, select: { appliedAt: true } });
        const appliedAt = appliedAtFor(current?.appliedAt ?? null, status);
        const saved = await prisma.postingApplication.upsert({
            where: { userId_postingId: { userId, postingId } },
            create: { userId, postingId, status, appliedAt },
            update: { status, appliedAt },
            select: { status: true, appliedAt: true, note: true },
        });
        return res.status(200).json({ success: true, data: { applicationStatus: saved.status, appliedAt: saved.appliedAt, applicationNote: saved.note } });
    } catch (err) {
        return sendError(res, err, 'setApplication');
    }
};

// PUT /careers/postings/:id/application/note (P6-T10, F-13): the student's own note on a tracked
// application. Needs a status first (the note lives on the application row).
export const setApplicationNote = async (req, res) => {
    try {
        const postingId = parseId(req.params.id);
        const { note } = noteBody.parse(req.body ?? {});
        const { count } = await prisma.postingApplication.updateMany({ where: { userId: req.user.id, postingId }, data: { note } });
        if (!count) throw new CareersError(409, 'NO_APPLICATION', 'Set your application status first; the note is kept with it.');
        return res.status(200).json({ success: true, data: { applicationNote: note } });
    } catch (err) {
        return sendError(res, err, 'setApplicationNote');
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
