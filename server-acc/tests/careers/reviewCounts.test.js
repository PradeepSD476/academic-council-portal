import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/db.js', () => ({ default: {} }));
const { reviewCounts } = await import('../../services/careers/postings/reviewCounts.js');

describe('reviewCounts (sidebar badge + review tabs)', () => {
    it('counts pending, flagged, candidates and open links; waiting = pending + flagged', async () => {
        const where = [];
        const db = {
            posting: { count: vi.fn(async ({ where: w }) => { where.push(w); return w.OR ? 2 : 5; }) },
            company: { count: vi.fn(async () => 3) },
            linkSubmission: { count: vi.fn(async () => 4) },
        };
        expect(await reviewCounts(0.7, db)).toEqual({ pending: 5, flagged: 2, candidates: 3, links: 4, waiting: 7 });
        expect(where.every((w) => w.status === 'PENDING_REVIEW')).toBe(true);
        expect(db.company.count).toHaveBeenCalledWith({ where: { status: 'CANDIDATE', rejectedAt: null } });
        // Withdrawn or dismissed links are not open work (P5-T4/T5).
        expect(db.linkSubmission.count).toHaveBeenCalledWith({ where: { status: { in: ['RECEIVED', 'PROCESSING', 'EXTRACTING', 'FAILED'] }, dismissedAt: null } });
    });
});
