import { describe, it, expect } from 'vitest';
import { deleteBody, deleteProblem, comesBack, LINK_REMOVED_REASON } from '../../services/careers/postings/deletePosting.js';

describe('permanent delete (P8-T2, F-02 level 2)', () => {
    it('needs a reason and the posting number typed back', () => {
        expect(deleteBody.parse({ reason: ' Spam ', confirmId: 12 })).toEqual({ reason: 'Spam', confirmId: 12 });
        expect(() => deleteBody.parse({ confirmId: 12 })).toThrow();
        expect(() => deleteBody.parse({ reason: '', confirmId: 12 })).toThrow();
        expect(() => deleteBody.parse({ reason: 'x'.repeat(301), confirmId: 12 })).toThrow();
        expect(() => deleteBody.parse({ reason: 'Spam', confirmId: 12, extra: 1 })).toThrow();
    });
    it('refuses a missing posting, a LIVE one, and a wrong confirmation number', () => {
        expect(deleteProblem(null, 5)).toMatchObject({ status: 404 });
        expect(deleteProblem({ id: 5, status: 'LIVE' }, 5)).toMatchObject({ status: 409 });
        expect(deleteProblem({ id: 5, status: 'REJECTED' }, 6)).toMatchObject({ status: 400 });
        for (const status of ['REJECTED', 'EXPIRED', 'PENDING_REVIEW']) expect(deleteProblem({ id: 5, status }, 5)).toBeNull();
        expect(deleteProblem({ id: 5, status: 'REJECTED' })).toBeNull(); // preview: no confirmation yet
    });
    it('warns when a job board still lists it (the next fetch adds it back for review)', () => {
        expect(comesBack([{ isLive: true, source: { kind: 'GREENHOUSE' } }])).toBe(true);
        expect(comesBack([{ isLive: false, source: { kind: 'GREENHOUSE' } }])).toBe(false);
        expect(comesBack([{ isLive: true, source: { kind: 'MANUAL' } }, { isLive: true, source: { kind: 'STUDENT_LINK' } }])).toBe(false);
        expect(comesBack([])).toBe(false);
    });
    it('tells the student who shared the link what happened', () => {
        expect(LINK_REMOVED_REASON).toMatch(/removed/i);
    });
});
