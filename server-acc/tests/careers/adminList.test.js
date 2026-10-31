import { describe, it, expect } from 'vitest';
import { adminPostingsQuery, adminPostingsWhere, adminPostingsOrder } from '../../services/careers/postings/adminList.js';

describe('adminPostingsQuery', () => {
    it('defaults to LIVE, newest first, 25 a page', () => {
        expect(adminPostingsQuery.parse({})).toMatchObject({ status: 'LIVE', sort: 'newest', page: 1, limit: 25 });
    });

    it('coerces ids and rejects bad values', () => {
        expect(adminPostingsQuery.parse({ companyId: '7', sourceId: '3', limit: '50' })).toMatchObject({ companyId: 7, sourceId: 3, limit: 50 });
        for (const bad of [{ status: 'live' }, { limit: '51' }, { tier: 'GPT' }, { hasDeadline: 'maybe' }, { sort: 'oldest' }, { companyId: '0' }]) {
            expect(adminPostingsQuery.safeParse(bad).success).toBe(false);
        }
    });
});

describe('adminPostingsWhere', () => {
    const where = (q) => adminPostingsWhere(adminPostingsQuery.parse(q));

    it('filters by status unless ALL', () => {
        expect(where({}).AND).toContainEqual({ status: 'LIVE' });
        expect(where({ status: 'ALL' }).AND.some((c) => 'status' in c)).toBe(false);
        expect(where({ status: 'REJECTED' }).AND).toContainEqual({ status: 'REJECTED' });
    });

    it('searches title or company with LIKE wildcards escaped', () => {
        const search = where({ q: '50%_off' }).AND.find((c) => c.OR);
        expect(search.OR).toEqual([
            { roleTitle: { contains: '50\\%\\_off', mode: 'insensitive' } },
            { company: { name: { contains: '50\\%\\_off', mode: 'insensitive' } } },
        ]);
    });

    it('adds company, source, tier and deadline filters', () => {
        const and = where({ companyId: '4', sourceId: '9', tier: 'MANUAL', hasDeadline: 'yes' }).AND;
        expect(and).toContainEqual({ companyId: 4 });
        expect(and).toContainEqual({ observations: { some: { sourceId: 9 } } });
        expect(and).toContainEqual({ extractionTier: 'MANUAL' });
        expect(and).toContainEqual({ deadlineStated: { not: null } });
        expect(where({ hasDeadline: 'no' }).AND).toContainEqual({ deadlineStated: null });
    });

    it('can drop the status filter (for the per-status counts)', () => {
        const params = adminPostingsQuery.parse({ status: 'EXPIRED', q: 'x' });
        expect(adminPostingsWhere(params, { withStatus: false }).AND.some((c) => 'status' in c)).toBe(false);
    });
});

describe('adminPostingsOrder', () => {
    it('orders by the chosen column with a stable tie-break', () => {
        expect(adminPostingsOrder('newest')).toEqual([{ publishedAt: { sort: 'desc', nulls: 'last' } }, { firstSeenAt: 'desc' }, { id: 'desc' }]);
        expect(adminPostingsOrder('lastSeen')).toEqual([{ lastSeenLiveAt: 'desc' }, { id: 'desc' }]);
        expect(adminPostingsOrder('deadline')).toEqual([{ deadlineStated: { sort: 'asc', nulls: 'last' } }, { id: 'desc' }]);
    });
});
