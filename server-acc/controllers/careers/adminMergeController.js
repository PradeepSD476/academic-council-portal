// Admin: merge, split, and the reversible merge log.
import { z } from 'zod';
import prisma from '../../config/db.js';
import { sendError, parseId } from '../../services/careers/errors.js';
import { mergeCompanies, splitCompany, undoMergeLog } from '../../services/careers/companies/mergeService.js';
import { findPossibleDuplicatesForCompany } from '../../services/careers/ingest/dedup.js';

const idList = z.array(z.number().int().positive()).max(500).default([]);

const mergeBody = z.object({
    fromId: z.number().int().positive(),
    toId: z.number().int().positive(),
});

const splitBody = z.object({
    name: z.string().trim().min(1).max(120),
    aliasIds: idList,
    experienceIds: idList,
    postingIds: idList,
    sourceIds: idList,
});

const logQuery = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    companyId: z.coerce.number().int().positive().optional(),
});

export const merge = async (req, res) => {
    try {
        const { fromId, toId } = mergeBody.parse(req.body);
        const result = await mergeCompanies({ fromId, toId, userId: req.user.id });
        // Postings of the two companies that now look like the same job. Reported for the admin to
        // review, never merged automatically.
        const possibleDuplicatePostings = await findPossibleDuplicatesForCompany(prisma, toId);
        return res.status(200).json({
            success: true,
            message: `Merged ${result.from.name} into ${result.to.name}.`,
            data: { ...result, possibleDuplicatePostings },
        });
    } catch (err) {
        return sendError(res, err, 'merge');
    }
};

export const split = async (req, res) => {
    try {
        const sourceId = parseId(req.params.id);
        const body = splitBody.parse(req.body);
        const result = await splitCompany({ sourceId, ...body, userId: req.user.id });
        return res.status(201).json({
            success: true,
            message: `Split ${result.created.name} out of ${result.source.name}.`,
            data: result,
        });
    } catch (err) {
        return sendError(res, err, 'split');
    }
};

export const listMergeLog = async (req, res) => {
    try {
        const { page, limit, companyId } = logQuery.parse(req.query);
        const where = companyId ? { OR: [{ fromCompanyId: companyId }, { toCompanyId: companyId }] } : {};
        const [rows, total] = await Promise.all([
            prisma.companyMergeLog.findMany({ where, orderBy: { id: 'desc' }, skip: (page - 1) * limit, take: limit }),
            prisma.companyMergeLog.count({ where }),
        ]);

        // Attach names so the UI can show "Google LLC → Google" without extra calls.
        const companyIds = [...new Set(rows.flatMap((r) => [r.fromCompanyId, r.toCompanyId]))];
        const userIds = [...new Set(rows.flatMap((r) => [r.performedById, r.undoneById]).filter(Boolean))];
        const [companies, users] = await Promise.all([
            prisma.company.findMany({ where: { id: { in: companyIds } }, select: { id: true, name: true, slug: true, status: true } }),
            prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, displayName: true } }),
        ]);
        const companyById = new Map(companies.map((c) => [c.id, c]));
        const userById = new Map(users.map((u) => [u.id, u.displayName]));

        const data = rows.map((r) => ({
            ...r,
            fromCompany: companyById.get(r.fromCompanyId) ?? null,
            toCompany: companyById.get(r.toCompanyId) ?? null,
            performedBy: userById.get(r.performedById) ?? null,
            undoneBy: r.undoneById ? userById.get(r.undoneById) ?? null : null,
        }));
        return res.status(200).json({
            success: true, message: 'Merge log fetched.', data,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (err) {
        return sendError(res, err, 'listMergeLog');
    }
};

export const undo = async (req, res) => {
    try {
        const logId = parseId(req.params.id);
        const log = await undoMergeLog({ logId, userId: req.user.id });
        return res.status(200).json({ success: true, message: `Undid ${log.action.toLowerCase()} #${log.id}.`, data: log });
    } catch (err) {
        return sendError(res, err, 'undo');
    }
};
