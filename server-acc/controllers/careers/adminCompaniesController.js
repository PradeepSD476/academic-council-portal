// Admin: company registry CRUD, aliases and candidate approval.
import { z } from 'zod';
import prisma from '../../config/db.js';
import { CareersError, sendError, parseId } from '../../services/careers/errors.js';
import { normalizeCompanyName } from '../../services/careers/text/normalize.js';
import { uniqueSlug } from '../../services/careers/companies/slug.js';

const PAGE_SIZE_MAX = 100;

const listQuery = z.object({
    status: z.enum(['ACTIVE', 'CANDIDATE', 'MERGED', 'ALL']).default('ACTIVE'),
    q: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(PAGE_SIZE_MAX).default(25),
});

const nameSchema = z.string().trim().min(1).max(120).transform((s) => s.replace(/\s+/g, ' '));
const websiteSchema = z.url({ protocol: /^https?$/ }).max(300).nullable().optional();

const createBody = z.object({
    name: nameSchema,
    website: websiteSchema,
    aliases: z.array(nameSchema).max(20).default([]),
});

const updateBody = z.object({
    name: nameSchema.optional(),
    website: websiteSchema,
}).refine((b) => b.name !== undefined || b.website !== undefined, { message: 'Nothing to update.' });

const aliasBody = z.object({ alias: nameSchema });

const companySelect = {
    id: true, name: true, slug: true, normalizedName: true, website: true, status: true,
    mergedIntoId: true, createdAt: true, updatedAt: true,
    _count: { select: { aliases: true, experiences: true } },
};

async function assertAliasFree(tx, normalizedAlias, companyId) {
    const owner = await tx.companyAlias.findUnique({
        where: { normalizedAlias },
        include: { company: { select: { id: true, name: true } } },
    });
    if (owner && owner.companyId !== companyId) {
        throw new CareersError(409, 'ALIAS_TAKEN', `"${owner.alias}" already belongs to ${owner.company.name}.`, { companyId: owner.company.id, companyName: owner.company.name });
    }
    return owner;
}

export const listCompanies = async (req, res) => {
    try {
        const { status, q, page, limit } = listQuery.parse(req.query);
        const where = {
            ...(status === 'ALL' ? {} : { status }),
            ...(q ? {
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { aliases: { some: { alias: { contains: q, mode: 'insensitive' } } } },
                ],
            } : {}),
        };
        const [data, total] = await Promise.all([
            prisma.company.findMany({ where, select: companySelect, orderBy: { name: 'asc' }, skip: (page - 1) * limit, take: limit }),
            prisma.company.count({ where }),
        ]);
        return res.status(200).json({
            success: true, message: 'Companies fetched.', data,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (err) {
        return sendError(res, err, 'listCompanies');
    }
};

export const getCompany = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        const company = await prisma.company.findUnique({
            where: { id },
            select: {
                ...companySelect,
                aliases: { select: { id: true, alias: true, normalizedAlias: true, origin: true, createdAt: true }, orderBy: { alias: 'asc' } },
                experiences: {
                    select: { id: true, title: true, experienceType: true, status: true, createdAt: true },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!company) throw new CareersError(404, 'NOT_FOUND', 'Company not found.');
        const mergedInto = company.mergedIntoId
            ? await prisma.company.findUnique({ where: { id: company.mergedIntoId }, select: { id: true, name: true, slug: true } })
            : null;
        return res.status(200).json({ success: true, message: 'Company fetched.', data: { ...company, mergedInto } });
    } catch (err) {
        return sendError(res, err, 'getCompany');
    }
};

export const createCompany = async (req, res) => {
    try {
        const body = createBody.parse(req.body);
        const normalized = normalizeCompanyName(body.name);
        if (!normalized) throw new CareersError(400, 'VALIDATION_ERROR', 'The company name has no letters or digits.');

        const company = await prisma.$transaction(async (tx) => {
            const aliasTexts = [body.name, ...body.aliases];
            const seen = new Set();
            const aliasRows = [];
            for (const text of aliasTexts) {
                const norm = normalizeCompanyName(text);
                if (!norm || seen.has(norm)) continue;
                seen.add(norm);
                await assertAliasFree(tx, norm, null);
                aliasRows.push({ alias: text, normalizedAlias: norm, origin: 'MANUAL' });
            }
            const slug = await uniqueSlug(body.name, async (s) => Boolean(await tx.company.findUnique({ where: { slug: s }, select: { id: true } })));
            return tx.company.create({
                data: {
                    name: body.name, slug, normalizedName: normalized, website: body.website ?? null, status: 'ACTIVE',
                    aliases: { create: aliasRows },
                },
                select: companySelect,
            });
        });
        return res.status(201).json({ success: true, message: 'Company created.', data: company });
    } catch (err) {
        return sendError(res, err, 'createCompany');
    }
};

export const updateCompany = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        const body = updateBody.parse(req.body);
        const company = await prisma.$transaction(async (tx) => {
            const existing = await tx.company.findUnique({ where: { id } });
            if (!existing) throw new CareersError(404, 'NOT_FOUND', 'Company not found.');
            if (existing.status === 'MERGED') throw new CareersError(409, 'ALREADY_MERGED', 'A merged company cannot be edited.');
            const data = {};
            if (body.website !== undefined) data.website = body.website;
            if (body.name !== undefined && body.name !== existing.name) {
                const norm = normalizeCompanyName(body.name);
                if (!norm) throw new CareersError(400, 'VALIDATION_ERROR', 'The company name has no letters or digits.');
                // The display name must stay resolvable, so it is also an alias of this company.
                const owner = await assertAliasFree(tx, norm, id);
                if (!owner) await tx.companyAlias.create({ data: { companyId: id, alias: body.name, normalizedAlias: norm, origin: 'MANUAL' } });
                data.name = body.name;
                data.normalizedName = norm;
            }
            return tx.company.update({ where: { id }, data, select: companySelect });
        });
        return res.status(200).json({ success: true, message: 'Company updated.', data: company });
    } catch (err) {
        return sendError(res, err, 'updateCompany');
    }
};

export const addAlias = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        const { alias } = aliasBody.parse(req.body);
        const norm = normalizeCompanyName(alias);
        if (!norm) throw new CareersError(400, 'VALIDATION_ERROR', 'The alias has no letters or digits.');
        const created = await prisma.$transaction(async (tx) => {
            const company = await tx.company.findUnique({ where: { id } });
            if (!company) throw new CareersError(404, 'NOT_FOUND', 'Company not found.');
            if (company.status === 'MERGED') throw new CareersError(409, 'ALREADY_MERGED', 'Add aliases to the company it was merged into.');
            const owner = await assertAliasFree(tx, norm, id);
            if (owner) throw new CareersError(409, 'ALIAS_EXISTS', `"${alias}" already resolves to this company (as "${owner.alias}").`);
            return tx.companyAlias.create({ data: { companyId: id, alias, normalizedAlias: norm, origin: 'MANUAL' } });
        });
        return res.status(201).json({ success: true, message: 'Alias added.', data: created });
    } catch (err) {
        return sendError(res, err, 'addAlias');
    }
};

export const deleteAlias = async (req, res) => {
    try {
        const aliasId = parseId(req.params.aliasId, 'aliasId');
        await prisma.$transaction(async (tx) => {
            const alias = await tx.companyAlias.findUnique({ where: { id: aliasId } });
            if (!alias) throw new CareersError(404, 'NOT_FOUND', 'Alias not found.');
            const remaining = await tx.companyAlias.count({ where: { companyId: alias.companyId } });
            if (remaining <= 1) throw new CareersError(400, 'LAST_ALIAS', 'A company must keep at least one alias.');
            await tx.companyAlias.delete({ where: { id: aliasId } });
        });
        return res.status(200).json({ success: true, message: 'Alias removed.' });
    } catch (err) {
        return sendError(res, err, 'deleteAlias');
    }
};

export const approveCandidate = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        const company = await prisma.company.findUnique({ where: { id } });
        if (!company) throw new CareersError(404, 'NOT_FOUND', 'Company not found.');
        if (company.status !== 'CANDIDATE') throw new CareersError(409, 'NOT_A_CANDIDATE', `${company.name} is ${company.status.toLowerCase()}, not a candidate.`);
        const updated = await prisma.company.update({ where: { id }, data: { status: 'ACTIVE' }, select: companySelect });
        return res.status(200).json({ success: true, message: 'Company approved.', data: updated });
    } catch (err) {
        return sendError(res, err, 'approveCandidate');
    }
};
