// Review-queue state changes. Every change writes a PostingReview row (the audit trail), in the
// same transaction as the change itself.
import { createHash } from 'node:crypto';
import { z } from 'zod';
import prisma from '../../../config/db.js';
import { CareersError } from '../errors.js';
import { getSetting } from '../settings.js';
import { planEdit, postingFields } from './editPosting.js';
import { findDuplicateCandidates, isSamePosting } from '../ingest/dedup.js';
import { loadCompanyIndex } from '../companies/companyIndex.js';
import { resolveCompany } from '../companies/resolveCompany.js';

const BULK_TIERS = ['STRUCTURED', 'JSON_LD'];

// Flagged = low confidence OR any uncertain field. Pending = everything else (incl. MANUAL with null
// confidence). The two tabs never overlap.
export function reviewWhere(tab, threshold) {
    const flagged = { OR: [{ extractionConfidence: { lt: threshold } }, { NOT: { uncertainFields: { isEmpty: true } } }] };
    const pending = {
        AND: [
            { OR: [{ extractionConfidence: null }, { extractionConfidence: { gte: threshold } }] },
            { uncertainFields: { isEmpty: true } },
        ],
    };
    return { status: 'PENDING_REVIEW', ...(tab === 'flagged' ? flagged : pending) };
}

async function load(tx, id) {
    const posting = await tx.posting.findUnique({ where: { id }, include: { company: { select: { id: true, name: true, status: true } } } });
    if (!posting) throw new CareersError(404, 'NOT_FOUND', `Posting #${id} was not found.`);
    return posting;
}

function requireStatus(posting, allowed, verb) {
    if (!allowed.includes(posting.status)) {
        throw new CareersError(409, 'INVALID_STATE', `A ${posting.status} posting cannot be ${verb}.`, { status: posting.status });
    }
}

async function companyMustBeActive(tx, companyId) {
    const company = await tx.company.findUnique({ where: { id: companyId }, select: { name: true, status: true } });
    if (company?.status !== 'ACTIVE') {
        throw new CareersError(409, 'COMPANY_NOT_ACTIVE',
            `${company?.name ?? 'The company'} is ${company?.status ?? 'missing'}. Approve or merge it in Companies first, or pick another company.`,
            { companyId, status: company?.status });
    }
}

const review = (tx, postingId, action, userId, changes, note) => tx.postingReview.create({
    data: { postingId, action, byUserId: userId, changes: changes && Object.keys(changes).length ? changes : undefined, note: note ?? null },
});

export async function editPosting(id, edits, userId) {
    return prisma.$transaction(async (tx) => {
        const posting = await load(tx, id);
        requireStatus(posting, ['PENDING_REVIEW', 'LIVE', 'EXPIRED'], 'edited');
        const { data, changes } = planEdit(posting, edits);
        if (!Object.keys(changes).length) return { posting, changes };
        const updated = await tx.posting.update({ where: { id }, data });
        await review(tx, id, 'EDIT', userId, changes);
        return { posting: updated, changes };
    });
}

// Optional edits are applied first, then the posting goes LIVE. The reviewer has now vouched for
// every field, so the uncertain markers are cleared.
export async function approvePosting(id, edits, userId) {
    return prisma.$transaction(async (tx) => {
        const posting = await load(tx, id);
        requireStatus(posting, ['PENDING_REVIEW'], 'approved');
        const { data, changes } = planEdit(posting, edits);
        await companyMustBeActive(tx, data.companyId ?? posting.companyId);
        const now = new Date();
        const updated = await tx.posting.update({
            where: { id },
            data: { ...data, status: 'LIVE', publishedAt: posting.publishedAt ?? now, reviewedById: userId, reviewedAt: now, uncertainFields: [], rejectReason: null },
        });
        await review(tx, id, 'APPROVE', userId, changes);
        return { posting: updated, changes };
    });
}

export async function rejectPosting(id, reason, userId) {
    return prisma.$transaction(async (tx) => {
        const posting = await load(tx, id);
        requireStatus(posting, ['PENDING_REVIEW', 'LIVE', 'EXPIRED'], 'rejected');
        const updated = await tx.posting.update({
            where: { id },
            data: { status: 'REJECTED', rejectReason: reason, reviewedById: userId, reviewedAt: new Date() },
        });
        await review(tx, id, 'REJECT', userId, null, reason);
        return { posting: updated };
    });
}

export async function expirePosting(id, userId, note) {
    return prisma.$transaction(async (tx) => {
        const posting = await load(tx, id);
        requireStatus(posting, ['PENDING_REVIEW', 'LIVE'], 'expired');
        const updated = await tx.posting.update({ where: { id }, data: { status: 'EXPIRED' } });
        await review(tx, id, 'EXPIRE', userId, null, note);
        return { posting: updated };
    });
}

// EXPIRED -> LIVE if it was approved before, else back to review; REJECTED -> back to review.
export async function reopenPosting(id, userId, note) {
    return prisma.$transaction(async (tx) => {
        const posting = await load(tx, id);
        requireStatus(posting, ['EXPIRED', 'REJECTED'], 'reopened');
        const status = posting.status === 'EXPIRED' && posting.publishedAt ? 'LIVE' : 'PENDING_REVIEW';
        if (status === 'LIVE') await companyMustBeActive(tx, posting.companyId);
        const updated = await tx.posting.update({ where: { id }, data: { status, rejectReason: null, lastSeenLiveAt: new Date() } });
        await review(tx, id, 'REOPEN', userId, null, note);
        return { posting: updated };
    });
}

// Pure: why a posting may not be bulk-approved (null = it may).
export function bulkSkipReason(posting, threshold) {
    if (posting.status !== 'PENDING_REVIEW') return `status is ${posting.status}`;
    if (!BULK_TIERS.includes(posting.extractionTier)) return `${posting.extractionTier} postings need an individual review`;
    if (posting.uncertainFields.length) return `uncertain: ${posting.uncertainFields.join(', ')}`;
    if (posting.extractionConfidence === null || posting.extractionConfidence < threshold) return `confidence ${posting.extractionConfidence ?? 'unknown'} is below ${threshold}`;
    if (posting.company?.status !== 'ACTIVE') return `company is ${posting.company?.status ?? 'missing'}`;
    return null;
}

export async function bulkApprove(ids, userId) {
    const threshold = await getSetting('careers.confidenceThreshold');
    const postings = await prisma.posting.findMany({ where: { id: { in: ids } }, include: { company: { select: { status: true } } } });
    const found = new Map(postings.map((p) => [p.id, p]));
    const approved = [];
    const skipped = [];
    for (const id of ids) {
        const posting = found.get(id);
        const reason = posting ? bulkSkipReason(posting, threshold) : 'not found';
        if (reason) {
            skipped.push({ id, reason });
            continue;
        }
        try {
            await approvePosting(id, {}, userId);
            approved.push(id);
        } catch (err) {
            skipped.push({ id, reason: err.message });
        }
    }
    return { approved, skipped };
}

// Manual entry: an admin types a posting in (e.g. from an email). Company by id or by name
// (resolved, creating a CANDIDATE if new). publish = the admin is the reviewer -> LIVE at once.
export const manualBody = postingFields.required({ roleTitle: true, descriptionText: true, applyUrl: true }).extend({
    companyName: z.string().trim().min(1).max(120).optional(),
    publish: z.boolean().default(false),
}).refine((b) => b.companyId || b.companyName, { message: 'Give companyId or companyName.' });

export async function createManualPosting(body, userId) {
    const { companyName, publish, ...fields } = manualBody.parse(body);
    let companyId = fields.companyId;
    let companyUncertain = false;
    if (!companyId) {
        const resolved = await resolveCompany(prisma, companyName, await loadCompanyIndex(prisma), { fuzzyThreshold: await getSetting('careers.fuzzyThreshold') });
        if (!resolved) throw new CareersError(400, 'VALIDATION_ERROR', 'The company name is empty after cleaning.');
        companyId = resolved.companyId;
        companyUncertain = resolved.uncertain;
    }

    const source = await prisma.source.findFirst({ where: { kind: 'MANUAL', boardToken: null } });
    if (!source) throw new CareersError(500, 'SETUP_MISSING', 'The MANUAL source is missing. Run npm run careers:seed.');

    // Same apply link entered twice -> point at the existing posting instead of a duplicate.
    const externalId = createHash('sha1').update(fields.applyUrl.trim()).digest('hex');
    const existing = await prisma.postingSource.findUnique({ where: { sourceId_externalId: { sourceId: source.id, externalId } } });
    if (existing) throw new CareersError(409, 'DUPLICATE', 'A manual posting with this apply link already exists.', { postingId: existing.postingId });

    const base = { stipendDisclosure: 'NOT_DISCLOSED', ctcDisclosure: 'NOT_DISCLOSED', compensationRaw: null, uncertainFields: [] };
    const { data } = planEdit(base, { ...fields, companyId });
    // planEdit validates pay and fills the derived columns (normalised title/location, fingerprint).
    const posting = {
        skills: [], eligibleBranches: [], eligibleYears: [], // [] = not stated; never NULL
        ...data,
        companyId,
        extractionTier: 'MANUAL',
        extractionConfidence: null,
        uncertainFields: companyUncertain ? ['company'] : [],
    };
    const possibleDuplicates = (await findDuplicateCandidates(prisma, companyId)).filter((c) => isSamePosting(c, posting))
        .map((c) => ({ id: c.id, roleTitle: c.roleTitle, status: c.status }));

    return prisma.$transaction(async (tx) => {
        if (publish) await companyMustBeActive(tx, companyId);
        const now = new Date();
        const created = await tx.posting.create({
            data: {
                ...posting,
                status: publish ? 'LIVE' : 'PENDING_REVIEW',
                ...(publish ? { publishedAt: now, reviewedById: userId, reviewedAt: now } : {}),
                observations: { create: { sourceId: source.id, externalId, url: fields.applyUrl } },
            },
        });
        await review(tx, created.id, 'CREATE_MANUAL', userId);
        if (publish) await review(tx, created.id, 'APPROVE', userId);
        return { posting: created, possibleDuplicates };
    });
}
