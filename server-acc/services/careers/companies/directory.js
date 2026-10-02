// The student company directory (Architecture 9.1): which companies are listed and in what order.
// Pure parts are unit-tested; the queries live in controllers/careers/companiesController.js.
import { z } from 'zod';

export const directoryQuery = z.object({
    q: z.string().trim().max(100).optional().transform((v) => v || undefined),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(24),
});

// Listed: ACTIVE and something to show (a LIVE posting or a PUBLISHED linked experience).
export function directoryWhere(q) {
    const where = {
        status: 'ACTIVE',
        OR: [{ postings: { some: { status: 'LIVE' } } }, { experiences: { some: { status: 'PUBLISHED' } } }],
    };
    if (q) {
        where.AND = [{
            OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { aliases: { some: { alias: { contains: q, mode: 'insensitive' } } } },
            ],
        }];
    }
    return where;
}

// Filtered relation counts for the cards.
export const countSelect = {
    _count: { select: { postings: { where: { status: 'LIVE' } }, experiences: { where: { status: 'PUBLISHED' } } } },
};

// { id, name, slug, _count } -> { id, name, slug, openRoles, experiences }, sorted: most open roles,
// then most experiences, then name.
export function rankCompanies(rows) {
    return rows
        .map(({ _count, ...c }) => ({ ...c, openRoles: _count.postings, experiences: _count.experiences }))
        .sort((a, b) => b.openRoles - a.openRoles || b.experiences - a.experiences || a.name.localeCompare(b.name));
}
