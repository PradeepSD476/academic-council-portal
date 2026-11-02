import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/db.js', () => ({ default: {} }));
const settings = vi.hoisted(() => ({ visible: true }));
vi.mock('../../services/careers/settings.js', () => ({ getSetting: async () => settings.visible }));
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
        const out = await withOpenRoles(posts, { user: { role: 'STUDENT' }, db });
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
        const out = await withOpenRoles([{ id: 1, company: null }, { id: 2 }], { user: { role: 'STUDENT' }, db: { posting: { groupBy } } });
        expect(groupBy).not.toHaveBeenCalled();
        expect(out.map((p) => p.openRoles)).toEqual([0, 0]);
    });

    it('B-12: while the feature is hidden from students, a student gets no company and no counts (and no query)', async () => {
        settings.visible = false;
        const groupBy = vi.fn();
        const out = await withOpenRoles([{ id: 10, company: { id: 1, name: 'Google', slug: 'google' } }], { user: { role: 'STUDENT' }, db: { posting: { groupBy } } });
        expect(groupBy).not.toHaveBeenCalled();
        expect(out).toEqual([{ id: 10, company: null, openRoles: 0 }]);
        settings.visible = true;
    });
    it('B-12: a career admin still gets them while the feature is hidden', async () => {
        settings.visible = false;
        const groupBy = vi.fn(async () => [{ companyId: 1, _count: { _all: 2 } }]);
        const out = await withOpenRoles([{ id: 10, company: { id: 1, name: 'Google', slug: 'google' } }], { user: { role: 'CAREER_ADMIN' }, db: { posting: { groupBy } } });
        expect(out[0]).toMatchObject({ company: { id: 1 }, openRoles: 2 });
        settings.visible = true;
    });
});
