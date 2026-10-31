import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/db.js', () => ({ default: {} }));
const { withTracking, byTrackedAt, applicationBody, trackedBy } = await import('../../services/careers/postings/tracking.js');

const d = (s) => new Date(`2026-10-0${s}T10:00:00Z`);

describe('withTracking', () => {
    it('adds saved / applicationStatus / trackedAt for the page with one query per table', async () => {
        const savedFind = vi.fn(async () => [{ postingId: 1, createdAt: d(1) }, { postingId: 3, createdAt: d(5) }]);
        const appFind = vi.fn(async () => [{ postingId: 1, status: 'APPLIED', updatedAt: d(3) }, { postingId: 2, status: 'OFFER', updatedAt: d(2) }]);
        const db = { savedPosting: { findMany: savedFind }, postingApplication: { findMany: appFind } };
        const out = await withTracking([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }], 7, db);
        expect(savedFind).toHaveBeenCalledTimes(1);
        expect(appFind).toHaveBeenCalledTimes(1);
        expect(savedFind.mock.calls[0][0].where).toEqual({ userId: 7, postingId: { in: [1, 2, 3, 4] } });
        expect(out.map((c) => [c.id, c.saved, c.applicationStatus])).toEqual([
            [1, true, 'APPLIED'], [2, false, 'OFFER'], [3, true, null], [4, false, null],
        ]);
        expect(out.map((c) => c.trackedAt)).toEqual([d(3), d(2), d(5), null]);
    });

    it('makes no query for an empty page', async () => {
        const db = { savedPosting: { findMany: vi.fn() }, postingApplication: { findMany: vi.fn() } };
        expect(await withTracking([], 1, db)).toEqual([]);
        expect(db.savedPosting.findMany).not.toHaveBeenCalled();
    });
});

describe('Saved page helpers', () => {
    const cards = [
        { id: 1, saved: true, applicationStatus: null, trackedAt: d(1) },
        { id: 2, saved: false, applicationStatus: 'APPLIED', trackedAt: d(4) },
        { id: 3, saved: true, applicationStatus: 'APPLIED', trackedAt: d(2) },
    ];

    it('orders by most recently touched', () => {
        expect([...cards].sort(byTrackedAt).map((c) => c.id)).toEqual([2, 3, 1]);
    });

    it('matches postings the user saved or applied to', () => {
        expect(trackedBy(5)).toEqual({ OR: [{ saves: { some: { userId: 5 } } }, { applications: { some: { userId: 5 } } }] });
    });
});

describe('applicationBody', () => {
    it('accepts a status or null', () => {
        expect(applicationBody.parse({ status: 'IN_PROGRESS' })).toEqual({ status: 'IN_PROGRESS' });
        expect(applicationBody.parse({ status: null })).toEqual({ status: null });
    });

    it.each([{}, { status: 'HIRED' }, { status: 'applied' }, { status: 'APPLIED', extra: 1 }])('rejects %j', (body) => {
        expect(applicationBody.safeParse(body).success).toBe(false);
    });
});

describe('appliedAtFor / noteBody (P6-T10, F-13)', async () => {
    const { appliedAtFor, noteBody } = await import('../../services/careers/postings/tracking.js');
    const now = new Date('2026-10-10T10:00:00Z');
    const earlier = new Date('2026-10-03T09:00:00Z');
    it('is set the first time the status reaches Applied or a later stage', () => {
        expect(appliedAtFor(null, 'INTERESTED', now)).toBeNull();
        expect(appliedAtFor(null, 'APPLIED', now)).toBe(now);
        expect(appliedAtFor(null, 'IN_PROGRESS', now)).toBe(now);
        expect(appliedAtFor(null, 'OFFER', now)).toBe(now);
        expect(appliedAtFor(null, 'REJECTED', now)).toBe(now);
    });
    it('never moves once set, even if the status goes back to Interested', () => {
        expect(appliedAtFor(earlier, 'APPLIED', now)).toBe(earlier);
        expect(appliedAtFor(earlier, 'INTERESTED', now)).toBe(earlier);
    });
    it('note: trimmed, at most 500 characters, empty clears it, text only', () => {
        expect(noteBody.parse({ note: '  Round 1 on 12 Oct  ' }).note).toBe('Round 1 on 12 Oct');
        expect(noteBody.parse({ note: '   ' }).note).toBeNull();
        expect(noteBody.parse({ note: null }).note).toBeNull();
        expect(() => noteBody.parse({ note: 'x'.repeat(501) })).toThrow();
        expect(noteBody.parse({ note: '<img src=x onerror=alert(1)>' }).note).toBe('<img src=x onerror=alert(1)>');
    });
});
