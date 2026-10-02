// Student-side company endpoints. P2 has only the picker search; the company list and page come in P3.
import { z } from 'zod';
import prisma from '../../config/db.js';
import { sendError } from '../../services/careers/errors.js';

const searchQuery = z.object({ q: z.string().trim().max(100).optional().default('') });

// ACTIVE companies by name or alias, max 10 (no flag gate: the picker also works while hidden).
export const searchCompanies = async (req, res) => {
    try {
        const { q } = searchQuery.parse(req.query);
        const where = { status: 'ACTIVE' };
        if (q) {
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { aliases: { some: { alias: { contains: q, mode: 'insensitive' } } } },
            ];
        }
        const data = await prisma.company.findMany({ where, select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' }, take: 10 });
        return res.status(200).json({ success: true, data });
    } catch (err) {
        return sendError(res, err, 'searchCompanies');
    }
};
