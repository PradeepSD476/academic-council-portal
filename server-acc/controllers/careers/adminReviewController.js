// Admin: review queue (pending / flagged), posting detail and state changes, manual entry,
// and the list of student-submitted links.
import { z } from 'zod';
import prisma from '../../config/db.js';
import { sendError, parseId, CareersError } from '../../services/careers/errors.js';
import { getSetting } from '../../services/careers/settings.js';
import {
    editPosting, approvePosting, rejectPosting, expirePosting, reopenPosting, bulkApprove, createManualPosting, reviewWhere,
} from '../../services/careers/postings/reviewService.js';
import { likeSafe } from '../../services/careers/text/likeSafe.js';
import {
    adminPostingsQuery, adminPostingsWhere, adminPostingsOrder, adminListSelect, ADMIN_STATUSES,
} from '../../services/careers/postings/adminList.js';
import { takeDownBody, takeDownPosting } from '../../services/careers/postings/takeDown.js';
import { retrySubmission, dismissSubmission, dismissBody } from '../../services/careers/links/submissionActions.js';
import { aiTierUsable, needsPersonWhere } from '../../services/careers/links/waiting.js';
import { reviewCounts } from '../../services/careers/postings/reviewCounts.js';
import { reportsForAdmin, handleReports } from '../../services/careers/postings/reports.js';
import { bulkBodies, undoBulkApprove, bulkReject, bulkExpire } from '../../services/careers/postings/bulkActions.js';
import { applyClicksFor } from '../../services/careers/usage/usage.js';
import { mergeBody, mergeQuery, mergePreview, mergePostings } from '../../services/careers/postings/mergePostings.js';

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
    // NEEDS_PERSON (P5-T5): links nothing will read automatically (store-only, or waiting for an AI tier that is off).
    status: z.enum(['NEEDS_PERSON', 'RECEIVED', 'PROCESSING', 'EXTRACTING', 'PENDING_REVIEW', 'STORED_ONLY', 'DUPLICATE', 'FAILED', 'ALL']).default('ALL'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
});

const listSelect = {
    id: true, roleTitle: true, type: true, location: true, workMode: true, extractionTier: true,
    extractionConfidence: true, uncertainFields: true, firstSeenAt: true, applyUrl: true,
    stipendDisclosure: true, ctcDisclosure: true,
    company: { select: { id: true, name: true, status: true } },
    _count: { select: { observations: true, reports: { where: { handledAt: null } } } },
};

export const listReview = async (req, res) => {
    try {
        const { tab, page, limit, q } = reviewQuery.parse(req.query);
        const threshold = await getSetting('careers.confidenceThreshold');
        const search = q ? { OR: [{ roleTitle: { contains: likeSafe(q), mode: 'insensitive' } }, { company: { name: { contains: likeSafe(q), mode: 'insensitive' } } }] } : {};
        const where = { AND: [reviewWhere(tab, threshold), search] };
        const [items, total, counts] = await Promise.all([
            prisma.posting.findMany({ where, select: listSelect, orderBy: [{ firstSeenAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * limit, take: limit }),
            prisma.posting.count({ where }),
            reviewCounts(threshold),
        ]);
        return res.json({
            success: true,
            data: items,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            counts: { pending: counts.pending, flagged: counts.flagged, candidates: counts.candidates, submissions: counts.links },
            threshold,
        });
    } catch (err) {
        return sendError(res, err, 'listReview');
    }
};

// The sidebar badge (P5-T6, F-16): how much is waiting for review.
export const getReviewCounts = async (req, res) => {
    try {
        return res.json({ success: true, data: await reviewCounts(await getSetting('careers.confidenceThreshold')) });
    } catch (err) {
        return sendError(res, err, 'getReviewCounts');
    }
};

// All postings in any status (P5-T1), with per-status counts for the same filters.
export const listAllPostings = async (req, res) => {
    try {
        const params = adminPostingsQuery.parse(req.query);
        const where = adminPostingsWhere(params);
        const [items, total, byStatus] = await Promise.all([
            prisma.posting.findMany({ where, select: adminListSelect, orderBy: adminPostingsOrder(params.sort), skip: (params.page - 1) * params.limit, take: params.limit }),
            prisma.posting.count({ where }),
            prisma.posting.groupBy({ by: ['status'], where: adminPostingsWhere(params, { withStatus: false }), _count: { _all: true } }),
        ]);
        const counts = Object.fromEntries(ADMIN_STATUSES.map((s) => [s, 0]));
        for (const g of byStatus) counts[g.status] = g._count._all;
        counts.ALL = ADMIN_STATUSES.reduce((n, s) => n + counts[s], 0);
        const clicks = await applyClicksFor(prisma, items.map((p) => p.id)); // P7-T4: per posting, never per student
        return res.json({
            success: true,
            data: items.map((p) => ({ ...p, applyClicks: clicks[p.id] ?? 0 })),
            pagination: { total, page: params.page, limit: params.limit, totalPages: Math.ceil(total / params.limit) },
            counts,
        });
    } catch (err) {
        return sendError(res, err, 'listAllPostings');
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
                _count: { select: { saves: true, applications: true } }, // who a take-down affects (counts only)
            },
        });
        if (!posting) throw new CareersError(404, 'NOT_FOUND', `Posting #${id} was not found.`);
        const [extractions, users, reports] = await Promise.all([
            prisma.extraction.findMany({ where: { postingId: id }, orderBy: { createdAt: 'desc' }, take: 5 }),
            prisma.user.findMany({ where: { id: { in: [...new Set(posting.reviews.map((r) => r.byUserId))] } }, select: { id: true, displayName: true, email: true } }),
            reportsForAdmin(prisma, id), // P6-T7: reasons and notes, never who reported
        ]);
        const byId = new Map(users.map((u) => [u.id, u.displayName || u.email]));
        const reviews = posting.reviews.map((r) => ({ ...r, byName: byId.get(r.byUserId) ?? `User #${r.byUserId}` }));
        return res.json({ success: true, data: { ...posting, reviews, extractions, reports } });
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
export const takeDown = action(
    (req) => takeDownPosting(parseId(req.params.id), takeDownBody.parse(req.body ?? {}), req.user.id),
    (r) => (r.action === 'expire' ? 'Marked as closed. Students who saved it see "No longer live".' : 'Taken down. Students no longer see it.'),
);
export const dismissLink = action((req) => dismissSubmission(parseId(req.params.id), dismissBody.parse(req.body ?? {}).reason, req.user.id), 'Dismissed. The student sees your reason.');
export const retryLink = action((req) => retrySubmission(parseId(req.params.id)), 'Queued again. The next links run (every 10 minutes) will fetch it.');
export const handlePostingReports = action((req) => handleReports(prisma, parseId(req.params.id), req.user.id), (n) => `${n} report${n === 1 ? '' : 's'} marked as handled; the "reported" flag is cleared.`);
const summary = (verb, r, n = r.undone ?? r.done) => `${n.length} ${verb}${r.skipped.length ? `, ${r.skipped.length} skipped` : ''}.`;
// P6-T8 (F-04): Undo a bulk approve within a minute; bulk reject / expire, one review row each.
export const bulkUndo = action((req) => undoBulkApprove(bulkBodies.ids.parse(req.body).ids, req.user.id), (r) => summary('back in Pending', r));
export const bulkRejectPostings = action((req) => {
    const { ids, reason } = bulkBodies.reject.parse(req.body);
    return bulkReject(ids, reason, req.user.id);
}, (r) => summary('rejected', r));
export const bulkExpirePostings = action((req) => bulkExpire(bulkBodies.ids.parse(req.body).ids, req.user.id), (r) => summary('marked as expired', r));
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
        const aiUsable = await aiTierUsable();
        const where = status === 'ALL' ? {} : status === 'NEEDS_PERSON' ? needsPersonWhere(aiUsable) : { status };
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
            aiUsable,
        });
    } catch (err) {
        return sendError(res, err, 'listSubmissions');
    }
};

// P7-T8 (F-06): merge two postings by hand. GET .../merge-preview?keepId&dropId says what would move.
export const mergePreviewPostings = async (req, res) => {
    try {
        const data = await mergePreview(prisma, mergeQuery.parse(req.query));
        return res.json({ success: true, data });
    } catch (err) {
        return sendError(res, err, 'mergePreviewPostings');
    }
};

export const mergeTwoPostings = async (req, res) => {
    try {
        const { keepId, dropId } = mergeBody.parse(req.body ?? {});
        const r = await mergePostings(prisma, { keepId, dropId, adminId: req.user.id });
        const students = r.saves.moved + r.saves.merged + r.applications.moved + r.applications.merged;
        return res.json({
            success: true,
            message: `#${dropId} merged into #${keepId}: ${r.observations} observation(s) and ${students} student save(s) / status(es) moved. #${dropId} is now rejected as a duplicate.`,
            data: r,
        });
    } catch (err) {
        return sendError(res, err, 'mergeTwoPostings');
    }
};
