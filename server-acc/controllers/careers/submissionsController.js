// Students share job links; the worker processes them (links/processSubmission.js). Nothing is
// fetched in the request itself, so a slow or hostile URL can't tie up the API.
import { z } from 'zod';
import prisma from '../../config/db.js';
import { sendError, CareersError } from '../../services/careers/errors.js';
import { canonicalUrl, MAX_URL_LENGTH } from '../../services/careers/links/canonicalUrl.js';

const submitBody = z.object({
    url: z.string().trim().min(1).max(MAX_URL_LENGTH),
    note: z.string().trim().max(500).optional(),
});

const publicFields = { id: true, url: true, status: true, postingId: true, createdAt: true, updatedAt: true };

export const submitLink = async (req, res) => {
    try {
        const { url, note } = submitBody.parse(req.body);
        const canonical = canonicalUrl(url);
        if (!canonical) throw new CareersError(400, 'VALIDATION_ERROR', 'Enter a full http(s) link to the job posting.');

        // The same job link shared before (by anyone) is not processed twice.
        const existing = await prisma.linkSubmission.findFirst({ where: { canonicalUrl: canonical }, orderBy: { createdAt: 'asc' }, select: publicFields });
        if (existing) {
            return res.status(200).json({ success: true, message: 'This link was already shared. Thanks!', data: existing });
        }

        const created = await prisma.linkSubmission.create({
            data: { url, canonicalUrl: canonical, note: note || null, submittedById: req.user.id },
            select: publicFields,
        });
        return res.status(201).json({ success: true, message: 'Thanks! An admin reviews shared links before they appear.', data: created });
    } catch (err) {
        return sendError(res, err, 'submitLink');
    }
};

export const mySubmissions = async (req, res) => {
    try {
        const items = await prisma.linkSubmission.findMany({
            where: { submittedById: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: { ...publicFields, note: true, error: true },
        });
        // Only "is it live on the portal" is shared about the resulting posting, nothing about review.
        const postingIds = [...new Set(items.map((s) => s.postingId).filter(Boolean))];
        const live = new Set((await prisma.posting.findMany({ where: { id: { in: postingIds }, status: 'LIVE' }, select: { id: true } })).map((p) => p.id));
        return res.json({ success: true, data: items.map((s) => ({ ...s, postingLive: live.has(s.postingId) })) });
    } catch (err) {
        return sendError(res, err, 'mySubmissions');
    }
};
