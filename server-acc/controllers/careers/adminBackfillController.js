// Experience backfill (P3-T2): link existing Career Vault experiences to companies. Suggestions come
// from the title (services/careers/companies/suggest.js); nothing is linked until an admin applies
// it, and every link can be undone with unlink. Only Experience.companyId changes (AI_Rules §3).
import { z } from 'zod';
import prisma from '../../config/db.js';
import { sendError, CareersError } from '../../services/careers/errors.js';
import { buildIndex } from '../../services/careers/companies/matcher.js';
import { suggestCompany } from '../../services/careers/companies/suggest.js';
import { getSetting } from '../../services/careers/settings.js';

const listQuery = z.object({
    view: z.enum(['unlinked', 'linked']).default('unlinked'),
    q: z.string().trim().max(100).optional().transform((v) => v || undefined),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
});
const applyBody = z.object({
    items: z.array(z.object({ experienceId: z.number().int().positive(), companyId: z.number().int().positive() }).strict()).min(1).max(200),
}).strict();
const unlinkBody = z.object({ experienceId: z.number().int().positive() }).strict();

const experienceFields = {
    id: true, title: true, status: true, experienceType: true, domain: true, createdAt: true, companyId: true,
    uploadedBy: { select: { displayName: true } },
    company: { select: { id: true, name: true, slug: true } },
};

// Suggestions only point at ACTIVE companies (a link to a candidate would show nowhere).
async function activeIndex() {
    const aliases = await prisma.companyAlias.findMany({
        where: { company: { status: 'ACTIVE' } },
        select: { companyId: true, alias: true, normalizedAlias: true },
    });
    return buildIndex(aliases);
}

export const listBackfill = async (req, res) => {
    try {
        const { view, q, page, limit } = listQuery.parse(req.query);
        const where = {
            companyId: view === 'linked' ? { not: null } : null,
            ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
        };
        const [total, unlinked, linked, rows] = await Promise.all([
            prisma.experience.count({ where }),
            prisma.experience.count({ where: { companyId: null } }),
            prisma.experience.count({ where: { companyId: { not: null } } }),
            prisma.experience.findMany({ where, select: experienceFields, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * limit, take: limit }),
        ]);

        let suggestions = new Map();
        if (view === 'unlinked' && rows.length) {
            const [index, fuzzyThreshold] = await Promise.all([activeIndex(), getSetting('careers.fuzzyThreshold')]);
            const found = rows.map((e) => [e.id, suggestCompany(e.title, index, { fuzzyThreshold })]).filter(([, s]) => s);
            const companies = await prisma.company.findMany({
                where: { id: { in: [...new Set(found.map(([, s]) => s.companyId))] } },
                select: { id: true, name: true, slug: true },
            });
            const byId = new Map(companies.map((c) => [c.id, c]));
            suggestions = new Map(found.map(([id, s]) => [id, { ...s, company: byId.get(s.companyId) ?? null }]));
        }

        return res.status(200).json({
            success: true,
            data: rows.map(({ uploadedBy, ...e }) => ({
                ...e,
                authorName: uploadedBy?.displayName || 'Unknown',
                suggestion: suggestions.get(e.id) ?? null,
            })),
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            counts: { unlinked, linked },
        });
    } catch (err) {
        return sendError(res, err, 'listBackfill');
    }
};

// Links experiences to companies (also re-links one that is already linked). All or nothing.
export const applyBackfill = async (req, res) => {
    try {
        const { items } = applyBody.parse(req.body);
        const experienceIds = [...new Set(items.map((i) => i.experienceId))];
        if (experienceIds.length !== items.length) throw new CareersError(400, 'VALIDATION_ERROR', 'An experience appears more than once.');
        const companyIds = [...new Set(items.map((i) => i.companyId))];

        const [companies, experiences] = await Promise.all([
            prisma.company.findMany({ where: { id: { in: companyIds } }, select: { id: true, status: true } }),
            prisma.experience.findMany({ where: { id: { in: experienceIds } }, select: { id: true } }),
        ]);
        const notActive = companyIds.filter((id) => companies.find((c) => c.id === id)?.status !== 'ACTIVE');
        if (notActive.length) throw new CareersError(400, 'COMPANY_NOT_ACTIVE', 'Experiences can only be linked to active companies.', { companyIds: notActive });
        const missing = experienceIds.filter((id) => !experiences.some((e) => e.id === id));
        if (missing.length) throw new CareersError(404, 'NOT_FOUND', 'Some experiences no longer exist.', { experienceIds: missing });

        await prisma.$transaction(items.map((i) => prisma.experience.update({ where: { id: i.experienceId }, data: { companyId: i.companyId }, select: { id: true } })));
        console.info(`[careers] backfill: user #${req.user.id} linked ${items.length} experience(s)`);
        return res.status(200).json({ success: true, message: `Linked ${items.length} experience${items.length === 1 ? '' : 's'}.`, data: { applied: items.length } });
    } catch (err) {
        return sendError(res, err, 'applyBackfill');
    }
};

export const unlinkBackfill = async (req, res) => {
    try {
        const { experienceId } = unlinkBody.parse(req.body);
        const experience = await prisma.experience.findUnique({ where: { id: experienceId }, select: { id: true, companyId: true } });
        if (!experience) throw new CareersError(404, 'NOT_FOUND', 'This experience no longer exists.');
        if (experience.companyId === null) throw new CareersError(409, 'NOT_LINKED', 'This experience is not linked to a company.');
        await prisma.experience.update({ where: { id: experienceId }, data: { companyId: null }, select: { id: true } });
        console.info(`[careers] backfill: user #${req.user.id} unlinked experience #${experienceId} from company #${experience.companyId}`);
        return res.status(200).json({ success: true, message: 'Unlinked.', data: { experienceId, previousCompanyId: experience.companyId } });
    } catch (err) {
        return sendError(res, err, 'unlinkBackfill');
    }
};
