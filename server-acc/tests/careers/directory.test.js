import { describe, it, expect } from 'vitest';
import { directoryQuery, directoryWhere, rankCompanies } from '../../services/careers/companies/directory.js';

describe('directoryQuery', () => {
    it('defaults and coercion', () => {
        expect(directoryQuery.parse({})).toEqual({ q: undefined, page: 1, limit: 24 });
        expect(directoryQuery.parse({ q: ' goo ', page: '2', limit: '10' })).toEqual({ q: 'goo', page: 2, limit: 10 });
    });
    it('rejects bad paging', () => {
        expect(directoryQuery.safeParse({ limit: '51' }).success).toBe(false);
        expect(directoryQuery.safeParse({ page: '0' }).success).toBe(false);
    });
});

describe('directoryWhere', () => {
    it('lists only ACTIVE companies with a LIVE posting or a PUBLISHED experience', () => {
        expect(directoryWhere()).toEqual({
            status: 'ACTIVE',
            OR: [{ postings: { some: { status: 'LIVE' } } }, { experiences: { some: { status: 'PUBLISHED' } } }],
        });
    });
    it('searches name and aliases on top of that', () => {
        const where = directoryWhere('goo');
        expect(where.status).toBe('ACTIVE');
        expect(where.OR).toHaveLength(2);
        expect(where.AND).toEqual([{
            OR: [
                { name: { contains: 'goo', mode: 'insensitive' } },
                { aliases: { some: { alias: { contains: 'goo', mode: 'insensitive' } } } },
            ],
        }]);
    });
});

describe('rankCompanies', () => {
    it('flattens counts and sorts by open roles, then experiences, then name', () => {
        const rows = [
            { id: 1, name: 'Zeta', slug: 'zeta', _count: { postings: 1, experiences: 0 } },
            { id: 2, name: 'Google', slug: 'google', _count: { postings: 0, experiences: 3 } },
            { id: 3, name: 'Paytm', slug: 'paytm', _count: { postings: 14, experiences: 0 } },
            { id: 4, name: 'Amazon', slug: 'amazon', _count: { postings: 0, experiences: 3 } },
            { id: 5, name: 'Stripe', slug: 'stripe', _count: { postings: 1, experiences: 2 } },
        ];
        expect(rankCompanies(rows).map((c) => c.name)).toEqual(['Paytm', 'Stripe', 'Zeta', 'Amazon', 'Google']);
        expect(rankCompanies(rows)[0]).toEqual({ id: 3, name: 'Paytm', slug: 'paytm', openRoles: 14, experiences: 0 });
    });
});
