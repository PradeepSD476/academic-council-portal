import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/db.js', () => ({ default: {} }));
const { retryProblem, withdrawProblem, linkProblem, WITHDRAWN_REASON } = await import('../../services/careers/links/submissionActions.js');
const { reshareDecision, DISMISSED_RESHARE_DAYS } = await import('../../controllers/careers/submissionsController.js');

const sub = (over = {}) => ({ id: 1, status: 'FAILED', submittedById: 5, postingId: null, dismissedAt: null, dismissedById: null, ...over });

describe('retryProblem (admin Retry, F-09)', () => {
    it('allows a failed link that was not dismissed', () => {
        expect(retryProblem(sub())).toBeNull();
    });
    it.each(['RECEIVED', 'PROCESSING', 'EXTRACTING', 'PENDING_REVIEW', 'STORED_ONLY', 'DUPLICATE'])('refuses %s', (status) => {
        expect(retryProblem(sub({ status }))).toMatch(/only a link that failed/i);
    });
    it('refuses a dismissed link', () => {
        expect(retryProblem(sub({ dismissedAt: new Date() }))).toMatch(/dismissed/i);
    });
});

describe('withdrawProblem (student withdraws their own link)', () => {
    it('allows the owner while it is still waiting', () => {
        expect(withdrawProblem(sub({ status: 'RECEIVED' }), 5)).toBeNull();
    });
    it('is forbidden for anyone else', () => {
        expect(withdrawProblem(sub({ status: 'RECEIVED' }), 6)).toEqual({ status: 403, message: expect.any(String) });
    });
    it('is too late once processing started or the link was already withdrawn', () => {
        expect(withdrawProblem(sub({ status: 'PROCESSING' }), 5).status).toBe(409);
        expect(withdrawProblem(sub({ status: 'RECEIVED', dismissedAt: new Date() }), 5).status).toBe(409);
    });
});

describe('linkProblem (create a posting from a link)', () => {
    it('allows a link with no posting that was not dismissed', () => {
        expect(linkProblem(sub())).toBeNull();
        expect(linkProblem(sub({ status: 'STORED_ONLY' }))).toBeNull();
        expect(linkProblem(sub({ status: 'EXTRACTING' }))).toBeNull();
    });
    it('refuses a link that already has a posting or was dismissed', () => {
        expect(linkProblem(sub({ postingId: 9 }))).toMatch(/already/i);
        expect(linkProblem(sub({ dismissedAt: new Date() }))).toMatch(/dismissed/i);
    });
});

describe('reshareDecision with withdrawn / dismissed links', () => {
    const now = new Date('2026-10-10T12:00:00Z');
    const daysAgo = (n) => new Date(now.getTime() - n * 864e5);
    it('a link its own student withdrew can be shared again (by anyone)', () => {
        expect(reshareDecision(sub({ status: 'RECEIVED', dismissedAt: daysAgo(0), dismissedById: 5, dismissReason: WITHDRAWN_REASON }), now)).toBe('NEW');
    });
    it('a link an admin dismissed is not processed again for a while', () => {
        expect(reshareDecision(sub({ status: 'EXTRACTING', createdAt: daysAgo(2), dismissedAt: daysAgo(1), dismissedById: 99 }), now)).toBe('SHARE');
        expect(reshareDecision(sub({ status: 'FAILED', createdAt: daysAgo(2), dismissedAt: daysAgo(1), dismissedById: 99 }), now)).toBe('SHARE');
        expect(reshareDecision(sub({ status: 'EXTRACTING', createdAt: daysAgo(40), dismissedAt: daysAgo(DISMISSED_RESHARE_DAYS + 1), dismissedById: 99 }), now)).toBe('NEW');
    });
});
