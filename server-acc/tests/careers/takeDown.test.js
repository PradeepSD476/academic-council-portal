import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/db.js', () => ({ default: {} }));
const { takeDownBody, takeDownPlan, TAKE_DOWN_REASONS } = await import('../../services/careers/postings/takeDown.js');

describe('takeDownPlan (decision D-02)', () => {
    it('Closed expires the posting (students who saved it still see "No longer live")', () => {
        expect(takeDownPlan({ reason: 'CLOSED' })).toEqual({ action: 'expire', text: 'Taken down: closed' });
        expect(takeDownPlan({ reason: 'CLOSED', details: 'role filled' })).toEqual({ action: 'expire', text: 'Taken down: closed (role filled)' });
    });

    it('every other reason rejects it with a readable reason', () => {
        expect(takeDownPlan({ reason: 'SPAM' })).toEqual({ action: 'reject', text: 'Taken down: spam or not a real opening' });
        expect(takeDownPlan({ reason: 'NOT_FOR_STUDENTS' }).action).toBe('reject');
        expect(takeDownPlan({ reason: 'DUPLICATE', details: 'same as #12' })).toEqual({ action: 'reject', text: 'Taken down: duplicate of another posting (same as #12)' });
        expect(takeDownPlan({ reason: 'WRONG_DETAILS' }).action).toBe('reject');
        expect(takeDownPlan({ reason: 'OTHER', details: 'company asked us' })).toEqual({ action: 'reject', text: 'Taken down: company asked us' });
    });

    it('lists every reason with a label for the dialog', () => {
        expect(TAKE_DOWN_REASONS.map((r) => r.value)).toEqual(['CLOSED', 'NOT_FOR_STUDENTS', 'DUPLICATE', 'SPAM', 'WRONG_DETAILS', 'OTHER']);
    });
});

describe('takeDownBody', () => {
    it('needs a known reason, and details when the reason is Other', () => {
        expect(takeDownBody.parse({ reason: 'SPAM' })).toEqual({ reason: 'SPAM' });
        expect(takeDownBody.parse({ reason: 'SPAM', details: '  x  ' })).toEqual({ reason: 'SPAM', details: 'x' });
        for (const bad of [{}, { reason: 'spam' }, { reason: 'OTHER' }, { reason: 'OTHER', details: '   ' }, { reason: 'SPAM', details: 'x'.repeat(301) }, { reason: 'SPAM', extra: 1 }]) {
            expect(takeDownBody.safeParse(bad).success).toBe(false);
        }
    });
});
