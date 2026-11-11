import { describe, it, expect } from 'vitest';
import { activityEntries, changedFields, activityQuery } from '../../services/careers/ops/activityLog.js';

const reviews = [
    { id: 1, action: 'APPROVE', createdAt: '2026-10-09T10:00:00Z', byUserId: 2, postingId: 5, note: null, changes: null },
    { id: 2, action: 'EDIT', createdAt: '2026-10-10T10:00:00Z', byUserId: 3, postingId: 5, note: null, changes: { roleTitle: { from: 'a', to: 'b' }, minCpi: { from: null, to: 7 } } },
];
const merges = [
    { id: 7, action: 'MERGE', fromCompanyId: 10, toCompanyId: 11, performedById: 2, createdAt: '2026-10-09T12:00:00Z', undoneAt: '2026-10-11T08:00:00Z', undoneById: 3 },
    { id: 8, action: 'SPLIT', fromCompanyId: 11, toCompanyId: 12, performedById: 3, createdAt: '2026-10-08T12:00:00Z', undoneAt: null, undoneById: null },
];

describe('admin activity log (F-15)', () => {
    it('merges both logs newest first; an undone merge gives a merge and an undo entry', () => {
        const e = activityEntries(reviews, merges);
        expect(e.map((x) => `${x.action}:${x.byUserId}`)).toEqual(['UNDO:3', 'EDIT:3', 'MERGE:2', 'APPROVE:2', 'SPLIT:3']);
        expect(e[0]).toMatchObject({ kind: 'COMPANY', fromCompanyId: 10, toCompanyId: 11, mergeAction: 'MERGE' });
    });
    it('filters by admin and by action', () => {
        expect(activityEntries(reviews, merges, { adminId: 2 }).map((x) => x.key)).toEqual(['m7', 'r1']);
        expect(activityEntries(reviews, merges, { action: 'UNDO' }).map((x) => x.key)).toEqual(['u7']);
        expect(activityEntries(reviews, merges, { adminId: 3, action: 'EDIT' }).map((x) => x.key)).toEqual(['r2']);
    });
    it('a permanent delete is an entry with the title and company it had (P8-T2)', () => {
        const d = [{ id: 4, postingId: 99, roleTitle: 'Spam role', companyName: 'Acme', reason: 'Spam', byUserId: 2, createdAt: '2026-10-12T00:00:00Z' }];
        const e = activityEntries(reviews, merges, {}, d);
        expect(e[0]).toMatchObject({ key: 'd4', action: 'DELETE', byUserId: 2, note: 'Spam', posting: { id: 99, roleTitle: 'Spam role', company: { name: 'Acme' }, deleted: true } });
        expect(activityEntries(reviews, merges, { action: 'DELETE' }, d).map((x) => x.key)).toEqual(['d4']);
        expect(activityEntries(reviews, merges, { adminId: 3 }, d).some((x) => x.key === 'd4')).toBe(false);
    });
    it('lists which fields an edit changed, not the values', () => {
        expect(changedFields(reviews[1].changes)).toEqual(['roleTitle', 'minCpi']);
        expect(changedFields({ mergedFrom: 3 })).toEqual([]);
        expect(changedFields(null)).toEqual([]);
    });
    it('query: actions from both logs, at most 50 a page', () => {
        expect(activityQuery.parse({ action: 'MERGE', adminId: '2' })).toMatchObject({ action: 'MERGE', adminId: 2, page: 1, limit: 25 });
        expect(activityQuery.parse({ action: 'DELETE' }).action).toBe('DELETE');
        expect(() => activityQuery.parse({ action: 'DESTROY' })).toThrow();
        expect(() => activityQuery.parse({ limit: '51' })).toThrow();
    });
});
