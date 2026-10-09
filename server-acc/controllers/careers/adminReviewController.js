// Admin: review queue (pending / flagged), posting detail and state changes, manual entry,
// and the list of student-submitted links.
import { z } from 'zod';
import prisma from '../../config/db.js';
import { sendError, parseId, CareersError } from '../../services/careers/errors.js';
import { getSetting } from '../../services/careers/settings.js';
import {
    editPosting, approvePosting, rejectPosting, expirePosting, reopenPosting, bulkApprove, createManualPosting, reviewWhere,
} from '../../services/careers/postings/reviewService.js';

const reviewQuery = z.object({
    tab: z.enum(['pending', 'flagged']).default('pending'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    q: z.string().trim().max(100).optional(),
});

const noteBody = z.object({ note: z.string().trim().max(500).optional() }).default({});
const rejectBody = z.object({ reason: z.string().trim().min(1).max(500) });
const approveBody = z.object({ edits: z.record(z.string(), z.unknown()).optional() }).default({});
const bulkBody = z.object({ ids: z.array(z.number().int().positive()).min(1).max(200) });
const submissionsQuery = z.object({
    status: z.enum(['RECEIVED', 'PROCESSING', 'EXTRACTING', 'PENDING_REVIEW', 'STORED_ONLY', 'DUPLICATE', 'FAILED', 'ALL']).default('ALL'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
});

const listSelect = {
    id: true, roleTitle: true, type: true, location: true, workMode: true, extractionTier: true,
    extractionConfidence: true, uncertainFields: true, firstSeenAt: true, applyUrl: true,
    stipendDisclosure: true, ctcDisclosure: true,
    company: { select: { id: true, name: true, status: true } },
    _count: { select: { observations: true } },
};

export const listReview = async (req, res) => {
    try {
        const { tab, page, limit, q } = reviewQuery.parse(req.query);
        const threshold = await getSetting('careers.confidenceThreshold');
        const search = q ? { OR: [{ roleTitle: { contains: q, mode: 'insensitive' } }, { company: { name: { contains: q, mode: 'insensitive' } } }] } : {};
        const where = { AND: [reviewWhere(tab, threshold), search] };
        const [items, total, pendingCount, flaggedCount, candidateCount, submissionCount] = await Promise.all([
            prisma.posting.findMany({ where, select: listSelect, orderBy: [{ firstSeenAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * limit, take: limit }),
            prisma.posting.count({ where }),
            prisma.posting.count({ where: reviewWhere('pending', threshold) }),
            prisma.posting.count({ where: reviewWhere('flagged', threshold) }),
            prisma.company.count({ where: { status: 'CANDIDATE' } }),
            prisma.linkSubmission.count({ where: { status: { in: ['RECEIVED', 'PROCESSING', 'EXTRACTING', 'FAILED'] } } }),
        ]);
        return res.json({
            success: true,
            data: items,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            counts: { pending: pendingCount, flagged: flaggedCount, candidates: candidateCount, submissions: submissionCount },
            threshold,
        });
    } catch (err) {
        return sendError(res, err, 'listReview');
    }
};

export const getPosting = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        const posting = await prisma.posting.findUnique({
            where: { id },
            include: {
                company: { select: { id: true, name: true, slug: true, status: true, website: true } },
                observations: { include: { source: { select: { id: true, name: true, kind: true, boardToken: true } } }, orderBy: { firstSeenAt: 'asc' } },
                reviews: { orderBy: { createdAt: 'desc' }, take: 50 },
            },
        });
        if (!posting) throw new CareersError(404, 'NOT_FOUND', `Posting #${id} was not found.`);
        const [extractions, users] = await Promise.all([
            prisma.extraction.findMany({ where: { postingId: id }, orderBy: { createdAt: 'desc' }, take: 5 }),
            prisma.user.findMany({ where: { id: { in: [...new Set(posting.reviews.map((r) => r.byUserId))] } }, select: { id: true, displayName: true, email: true } }),
        ]);
        const byId = new Map(users.map((u) => [u.id, u.displayName || u.email]));
        const reviews = posting.reviews.map((r) => ({ ...r, byName: byId.get(r.byUserId) ?? `User #${r.byUserId}` }));
        return res.json({ success: true, data: { ...posting, reviews, extractions } });
    } catch (err) {
        return sendError(res, err, 'getPosting');
    }
};

function action(fn, message) {
    return async (req, res) => {
        try {
            const result = await fn(req);
            return res.json({ success: true, message: typeof message === 'function' ? message(result) : message, data: result });
        } catch (err) {
            return sendError(res, err, message);
        }
    };
}

export const patchPosting = action(
    (req) => editPosting(parseId(req.params.id), req.body, req.user.id),
    (r) => (Object.keys(r.changes).length ? `Saved ${Object.keys(r.changes).length} change(s).` : 'Nothing changed.'),
);
export const approve = action(
    (req) => approvePosting(parseId(req.params.id), approveBody.parse(req.body ?? {}).edits ?? {}, req.user.id),
    'Approved. The posting is live.',
);
export const reject = action((req) => rejectPosting(parseId(req.params.id), rejectBody.parse(req.body).reason, req.user.id), 'Rejected.');
export const expire = action((req) => expirePosting(parseId(req.params.id), req.user.id, noteBody.parse(req.body ?? {}).note), 'Marked as expired.');
export const reopen = action((req) => reopenPosting(parseId(req.params.id), req.user.id, noteBody.parse(req.body ?? {}).note), (r) => `Reopened as ${r.posting.status}.`);
export const bulk = action(
    (req) => bulkApprove(bulkBody.parse(req.body).ids, req.user.id),
    (r) => `Approved ${r.approved.length}; skipped ${r.skipped.length}.`,
);

export const createManual = async (req, res) => {
    try {
        const result = await createManualPosting(req.body, req.user.id);
        return res.status(201).json({
            success: true,
            message: result.posting.status === 'LIVE' ? 'Posting published.' : 'Posting created and waiting for review.',
            data: result,
        });
    } catch (err) {
        return sendError(res, err, 'createManual');
    }
};

export const listSubmissions = async (req, res) => {
    try {
        const { status, page, limit } = submissionsQuery.parse(req.query);
        const where = status === 'ALL' ? {} : { status };
        const [items, total] = await Promise.all([
            prisma.linkSubmission.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
            prisma.linkSubmission.count({ where }),
        ]);
        const users = await prisma.user.findMany({ where: { id: { in: [...new Set(items.map((s) => s.submittedById))] } }, select: { id: true, displayName: true, email: true } });
        const names = new Map(users.map((u) => [u.id, u.displayName || u.email]));
        return res.json({
            success: true,
            data: items.map((s) => ({ ...s, submittedBy: names.get(s.submittedById) ?? null })),
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (err) {
        return sendError(res, err, 'listSubmissions');
    }
};
