// Students share job links; the worker processes them (links/processSubmission.js). Nothing is
// fetched in the request itself, so a slow or hostile URL can't tie up the API.
import { z } from 'zod';
import prisma from '../../config/db.js';
import { sendError, CareersError } from '../../services/careers/errors.js';
import { canonicalUrl, MAX_URL_LENGTH } from '../../services/careers/links/canonicalUrl.js';
import { getSetting } from '../../services/careers/settings.js';
import { isCareerAdmin } from '../../middlewares/careers/requireCareerAdmin.js';
import { limitMessage, recentSubmissionCount } from '../../middlewares/careers/submissionRateLimit.js';
import { withdrawSubmission } from '../../services/careers/links/submissionActions.js';
import { aiTierUsable, waitingForAdmin } from '../../services/careers/links/waiting.js';
import { parseId } from '../../services/careers/errors.js';

// Advisory lock namespace (first key) for "one student's submissions"; the second key is the user id.
// Job locks use single bigint keys 81001-81004, a different key space.
const SUBMISSION_LOCK = 81010;

const submitBody = z.object({
    url: z.string().trim().min(1).max(MAX_URL_LENGTH),
    note: z.string().trim().max(500).optional(),
});

const publicFields = { id: true, url: true, status: true, postingId: true, createdAt: true, updatedAt: true, dismissedAt: true, dismissReason: true };

// A store-only link (LinkedIn, ...) shared again after this many days is queued again for the admins.
export const STORED_ONLY_RESHARE_DAYS = 7;
// A link an admin dismissed (e.g. "Not a job page") isn't processed again for this long (P5, D-01).
export const DISMISSED_RESHARE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

// Pure (B-08). What sharing a link means, given the latest earlier submission of the same link:
//   NEW   = create a submission and process it (none yet, the last one failed, or an old store-only one)
//   SHARE = don't process it twice; record that this student shared it too
//   A link its own student withdrew can be shared again; one an admin dismissed waits 30 days.
export function reshareDecision(existing, now = new Date()) {
    if (!existing) return 'NEW';
    if (existing.dismissedAt) {
        if (existing.dismissedById === existing.submittedById) return 'NEW';
        return now - new Date(existing.dismissedAt) > DISMISSED_RESHARE_DAYS * DAY_MS ? 'NEW' : 'SHARE';
    }
    if (existing.status === 'FAILED') return 'NEW';
    if (existing.status === 'STORED_ONLY' && now - new Date(existing.createdAt) > STORED_ONLY_RESHARE_DAYS * DAY_MS) return 'NEW';
    return 'SHARE';
}

export const submitLink = async (req, res) => {
    try {
        const { url, note } = submitBody.parse(req.body);
        const canonical = canonicalUrl(url);
        if (!canonical) throw new CareersError(400, 'VALIDATION_ERROR', 'Enter a full http(s) link to the job posting.');

        // The same job link shared before (by anyone) is not processed twice, unless that attempt failed.
        const existing = await prisma.linkSubmission.findFirst({ where: { canonicalUrl: canonical }, orderBy: { createdAt: 'desc' }, select: { ...publicFields, submittedById: true, dismissedById: true } });
        if (reshareDecision(existing) === 'SHARE') {
            const { submittedById, dismissedById, ...data } = existing; // eslint-disable-line no-unused-vars
            if (submittedById !== req.user.id) {
                await prisma.linkShare.upsert({
                    where: { submissionId_userId: { submissionId: existing.id, userId: req.user.id } },
                    create: { submissionId: existing.id, userId: req.user.id },
                    update: {},
                });
            }
            return res.status(200).json({ success: true, message: 'This link was already shared. Thanks! It is in your list below.', data });
        }

        // Count and insert under one per-student lock, so parallel requests can't all pass the count (B-11).
        const created = await prisma.$transaction(async (tx) => {
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(${SUBMISSION_LOCK}::int, ${req.user.id}::int)`;
            if (!isCareerAdmin(req.user)) {
                const limit = await getSetting('careers.submissionDailyLimit');
                const used = await recentSubmissionCount(tx, req.user.id);
                if (used >= limit) throw new CareersError(429, 'RATE_LIMITED', limitMessage(limit), { limit, used });
            }
            return tx.linkSubmission.create({
                data: { url, canonicalUrl: canonical, note: note || null, submittedById: req.user.id },
                select: publicFields,
            });
        });
        return res.status(201).json({ success: true, message: 'Thanks! An admin reviews shared links before they appear.', data: created });
    } catch (err) {
        return sendError(res, err, 'submitLink');
    }
};

// A student withdraws their own link while it is still waiting (P5-T4, F-09). Nothing is deleted.
export const withdrawLink = async (req, res) => {
    try {
        const row = await withdrawSubmission(parseId(req.params.id), req.user.id);
        const { note, submittedById, dismissedById, error, canonicalUrl: _c, ...data } = row; // eslint-disable-line no-unused-vars
        return res.json({ success: true, message: 'Link withdrawn. It will not be processed.', data });
    } catch (err) {
        return sendError(res, err, 'withdrawLink');
    }
};

// The student's own submissions plus links they re-shared (sharedEarlier: true). Another student's
// note is private and never returned.
export const mySubmissions = async (req, res) => {
    try {
        const [own, shares] = await Promise.all([
            prisma.linkSubmission.findMany({
                where: { submittedById: req.user.id },
                orderBy: { createdAt: 'desc' },
                take: 50,
                select: { ...publicFields, note: true, error: true },
            }),
            prisma.linkShare.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 50, select: { submissionId: true, createdAt: true } }),
        ]);
        const shared = shares.length
            ? await prisma.linkSubmission.findMany({ where: { id: { in: shares.map((x) => x.submissionId) } }, select: { ...publicFields, error: true } })
            : [];
        const sharedAt = new Map(shares.map((x) => [x.submissionId, x.createdAt]));
        const items = [
            ...own.map((s) => ({ ...s, sharedEarlier: false, at: s.createdAt })),
            ...shared.map((s) => ({ ...s, sharedEarlier: true, at: sharedAt.get(s.id) })),
        ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 50).map(({ at, ...s }) => s);
        // Only "is it live on the portal" is shared about the resulting posting, nothing about review.
        const postingIds = [...new Set(items.map((s) => s.postingId).filter(Boolean))];
        const live = new Set((await prisma.posting.findMany({ where: { id: { in: postingIds }, status: 'LIVE' }, select: { id: true } })).map((p) => p.id));
        // F-18: a link nothing will read automatically right now says so, instead of "Being processed".
        const aiUsable = await aiTierUsable();
        return res.json({ success: true, data: items.map((s) => ({ ...s, postingLive: live.has(s.postingId), waitingForAdmin: waitingForAdmin(s, aiUsable) })) });
    } catch (err) {
        return sendError(res, err, 'mySubmissions');
    }
};
