import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/db.js', () => ({ default: {} }));
const { withOpenRoles } = await import('../../services/careers/companies/openRoles.js');

describe('withOpenRoles', () => {
    it('adds LIVE-posting counts per company with a single grouped query', async () => {
        const groupBy = vi.fn(async () => [{ companyId: 1, _count: { _all: 3 } }]);
        const db = { posting: { groupBy } };
        const posts = [
            { id: 10, company: { id: 1, name: 'Google', slug: 'google' } },
            { id: 11, company: { id: 1, name: 'Google', slug: 'google' } },
            { id: 12, company: { id: 2, name: 'Zeta', slug: 'zeta' } },
            { id: 13, company: null },
        ];
        const out = await withOpenRoles(posts, db);
        expect(groupBy).toHaveBeenCalledTimes(1);
        expect(groupBy.mock.calls[0][0]).toEqual({
            by: ['companyId'],
            where: { companyId: { in: [1, 2] }, status: 'LIVE' },
            _count: { _all: true },
        });
        expect(out.map((p) => p.openRoles)).toEqual([3, 3, 0, 0]);
        expect(posts[0].openRoles).toBeUndefined(); // inputs are not mutated
    });

    it('makes no query when no post is linked to a company', async () => {
        const groupBy = vi.fn();
        const out = await withOpenRoles([{ id: 1, company: null }, { id: 2 }], { posting: { groupBy } });
        expect(groupBy).not.toHaveBeenCalled();
        expect(out.map((p) => p.openRoles)).toEqual([0, 0]);
    });
});
