// Student-side company endpoints: the picker search, the company directory and one company's page
// (its LIVE postings and the PUBLISHED Career Vault experiences linked to it).
import { z } from 'zod';
import prisma from '../../config/db.js';
import { sendError, CareersError } from '../../services/careers/errors.js';
import { cardFields, loadProfile, toCard } from '../../services/careers/postings/cards.js';
import { withTracking } from '../../services/careers/postings/tracking.js';
import { directoryQuery, directoryWhere, countSelect, rankCompanies } from '../../services/careers/companies/directory.js';
import { likeSafe } from '../../services/careers/text/likeSafe.js';

const searchQuery = z.object({ q: z.string().trim().max(100).optional().default('') });
const PAGE_ITEMS = 50; // postings / experiences shown on one company page (counts cover all)

// ACTIVE companies by name or alias, max 10 (no flag gate: the picker also works while hidden).
export const searchCompanies = async (req, res) => {
    try {
        const { q } = searchQuery.parse(req.query);
        const where = { status: 'ACTIVE' };
        if (q) {
            where.OR = [
                { name: { contains: likeSafe(q), mode: 'insensitive' } },
                { aliases: { some: { alias: { contains: likeSafe(q), mode: 'insensitive' } } } },
            ];
        }
        const data = await prisma.company.findMany({ where, select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' }, take: 10 });
        return res.status(200).json({ success: true, data });
    } catch (err) {
        return sendError(res, err, 'searchCompanies');
    }
};

// Companies with something to show. Sorted by open roles (a filtered count Prisma can't order by),
// so the matching rows are ranked in memory; the directory is small (a few hundred at most).
export const listCompanies = async (req, res) => {
    try {
        const { q, page, limit } = directoryQuery.parse(req.query);
        const rows = await prisma.company.findMany({
            where: directoryWhere(q),
            select: { id: true, name: true, slug: true, ...countSelect },
        });
        const ranked = rankCompanies(rows);
        const total = ranked.length;
        return res.status(200).json({
            success: true,
            data: ranked.slice((page - 1) * limit, page * limit),
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (err) {
        return sendError(res, err, 'listCompanies');
    }
};

export const getCompanyPage = async (req, res) => {
    try {
        const slug = String(req.params.slug ?? '').toLowerCase();
        const company = await prisma.company.findUnique({
            where: { slug },
            select: { id: true, name: true, slug: true, website: true, status: true, mergedIntoId: true, ...countSelect },
        });
        if (!company || company.status !== 'ACTIVE') {
            // A merged company's old link points at the company it was merged into.
            const target = company?.mergedIntoId
                ? await prisma.company.findUnique({ where: { id: company.mergedIntoId }, select: { slug: true, status: true } })
                : null;
            const details = target?.status === 'ACTIVE' ? { movedTo: target.slug } : undefined;
            throw new CareersError(404, 'NOT_FOUND', 'This company page does not exist.', details);
        }

        const [profile, postings, experiences] = await Promise.all([
            loadProfile(req.user.id),
            prisma.posting.findMany({
                where: { companyId: company.id, status: 'LIVE' },
                select: cardFields,
                orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
                take: PAGE_ITEMS,
            }),
            prisma.experience.findMany({
                where: { companyId: company.id, status: 'PUBLISHED' },
                orderBy: { createdAt: 'desc' },
                take: PAGE_ITEMS,
                select: {
                    id: true, title: true, experienceType: true, domain: true, createdAt: true, description: true,
                    uploadedBy: { select: { displayName: true } },
                },
            }),
        ]);

        const { _count, status, mergedIntoId, ...info } = company; // eslint-disable-line no-unused-vars
        return res.status(200).json({
            success: true,
            data: {
                ...info,
                counts: { openRoles: _count.postings, experiences: _count.experiences },
                postings: await withTracking(postings.map((p) => toCard(p, profile)), req.user.id),
                experiences: experiences.map(({ uploadedBy, ...e }) => ({ ...e, authorName: uploadedBy?.displayName || 'Unknown' })),
            },
        });
    } catch (err) {
        return sendError(res, err, 'getCompanyPage');
    }
};
