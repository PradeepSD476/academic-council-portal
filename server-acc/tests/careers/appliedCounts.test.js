import { describe, it, expect, vi } from 'vitest';
import { APPLIED_STATUSES, MIN_SHOWN, shownCount, appliedWhere, postingAppliedCount, companyAppliedCount } from '../../services/careers/postings/appliedCounts.js';

describe('how many students applied (proposal §4.5)', () => {
    it('counts every stage after Interested', () => {
        expect(APPLIED_STATUSES).toEqual(['APPLIED', 'IN_PROGRESS', 'REJECTED', 'OFFER']);
        expect(APPLIED_STATUSES).not.toContain('INTERESTED');
    });
    it('never sends a count below 3', () => {
        expect(MIN_SHOWN).toBe(3);
        expect([0, 1, 2, 3, 40].map(shownCount)).toEqual([null, null, null, 3, 40]);
    });
    it('only student accounts count, never the viewer', () => {
        expect(appliedWhere({ postingId: 7 }, 9)).toEqual({ postingId: 7, userId: { not: 9 }, status: { in: APPLIED_STATUSES }, user: { role: 'STUDENT' } });
    });
    it('posting: one row per student; company: different students across its postings', async () => {
        const db = { postingApplication: { count: vi.fn().mockResolvedValue(2), groupBy: vi.fn().mockResolvedValue([{ userId: 1 }, { userId: 2 }, { userId: 3 }]) } };
        expect(await postingAppliedCount(db, 7, 9)).toBeNull();
        expect(db.postingApplication.count).toHaveBeenCalledWith({ where: appliedWhere({ postingId: 7 }, 9) });
        expect(await companyAppliedCount(db, 4, 9)).toBe(3);
        expect(db.postingApplication.groupBy).toHaveBeenCalledWith({ by: ['userId'], where: appliedWhere({ posting: { companyId: 4 } }, 9) });
    });
});
