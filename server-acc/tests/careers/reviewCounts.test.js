import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/db.js', () => ({ default: {} }));
const { reviewCounts } = await import('../../services/careers/postings/reviewCounts.js');
const { needsAttentionWhere } = await import('../../services/careers/links/waiting.js');

describe('reviewCounts (sidebar badge + review tabs)', () => {
    it('counts pending, flagged, candidates and the links that need an admin; waiting = pending + flagged', async () => {
        const where = [];
        const db = {
            posting: { count: vi.fn(async ({ where: w }) => { where.push(w); return w.OR ? 2 : 5; }) },
            company: { count: vi.fn(async () => 3) },
            linkSubmission: { count: vi.fn(async (args) => (args?.where ? 4 : 9)) },
        };
        expect(await reviewCounts(0.7, db, true)).toEqual({ pending: 5, flagged: 2, candidates: 3, links: 4, linksTotal: 9, waiting: 7 });
        expect(where.every((w) => w.status === 'PENDING_REVIEW')).toBe(true);
        expect(db.company.count).toHaveBeenCalledWith({ where: { status: 'CANDIDATE', rejectedAt: null } });
        // B-26: failed + needs a person, never dismissed / withdrawn (the same rule as the tab's default filter).
        expect(db.linkSubmission.count).toHaveBeenCalledWith({ where: needsAttentionWhere(true) });
    });
});
