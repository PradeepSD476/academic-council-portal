import { describe, it, expect } from 'vitest';
import { mergeProblem, mergedApplication, mergeBody, mergePostings } from '../../services/careers/postings/mergePostings.js';

describe('mergeProblem (F-06)', () => {
    const p = (id, status) => ({ id, status });
    it('allows merging into a live, pending or expired posting', () => {
        expect(mergeProblem(p(1, 'LIVE'), p(2, 'LIVE'))).toBeNull();
        expect(mergeProblem(p(1, 'LIVE'), p(2, 'PENDING_REVIEW'))).toBeNull();
        expect(mergeProblem(p(1, 'EXPIRED'), p(2, 'PENDING_REVIEW'))).toBeNull();
    });
    it('refuses rejected postings, the same posting, and hiding a live one behind a non-live one', () => {
        expect(mergeProblem(p(1, 'REJECTED'), p(2, 'LIVE'))).toMatch(/#1 is rejected/);
        expect(mergeProblem(p(1, 'LIVE'), p(2, 'REJECTED'))).toMatch(/already rejected/);
        expect(mergeProblem(p(1, 'LIVE'), p(1, 'LIVE'))).toMatch(/two different/);
        expect(mergeProblem(p(1, 'PENDING_REVIEW'), p(2, 'LIVE'))).toMatch(/merge #1 into #2 instead/);
        expect(mergeProblem(null, p(2, 'LIVE'))).toBe('Posting not found.');
    });
    it('the body needs two different ids', () => {
        expect(() => mergeBody.parse({ keepId: 1, dropId: 1 })).toThrow();
        expect(mergeBody.parse({ keepId: 1, dropId: 2 })).toEqual({ keepId: 1, dropId: 2 });
    });
});

describe('mergedApplication', () => {
    it('keeps the furthest stage, both notes and the earliest applied date', () => {
        const r = mergedApplication(
            { status: 'APPLIED', note: 'Referral from senior', appliedAt: new Date('2026-10-05') },
            { status: 'IN_PROGRESS', note: 'OA on 12 Oct', appliedAt: new Date('2026-10-03') },
        );
        expect(r).toEqual({ status: 'IN_PROGRESS', note: 'Referral from senior\nOA on 12 Oct', appliedAt: new Date('2026-10-03') });
    });
    it('an offer beats a rejection; empty notes stay null', () => {
        expect(mergedApplication({ status: 'OFFER', note: null, appliedAt: null }, { status: 'REJECTED', note: ' ', appliedAt: null }))
            .toEqual({ status: 'OFFER', note: null, appliedAt: null });
    });
});

// A small in-memory stand-in for the Prisma transaction client, enough for mergePostings.
function fakeDb(state) {
    let nextId = 1000;
    const table = (name) => ({
        findMany: async ({ where }) => state[name].filter((r) => r.postingId === where.postingId),
        delete: async ({ where }) => { state[name] = state[name].filter((r) => r.id !== where.id); },
        update: async ({ where, data }) => Object.assign(state[name].find((r) => r.id === where.id), data),
        updateMany: async ({ where, data }) => { const rows = state[name].filter((r) => r.postingId === where.postingId); rows.forEach((r) => Object.assign(r, data)); return { count: rows.length }; },
        create: async ({ data }) => { state[name].push({ id: nextId++, ...data }); },
    });
    const tx = {
        posting: {
            findUnique: async ({ where }) => state.posting.find((p) => p.id === where.id) ?? null,
            update: async ({ where, data }) => Object.assign(state.posting.find((p) => p.id === where.id), data),
        },
        postingSource: table('postingSource'), savedPosting: table('savedPosting'), postingApplication: table('postingApplication'),
        hiddenPosting: table('hiddenPosting'), postingReview: table('postingReview'),
    };
    return { ...tx, $transaction: (fn) => fn(tx) };
}

describe('mergePostings', () => {
    it('moves everything, keeps one row per student, rejects the duplicate, one review per posting', async () => {
        const state = {
            posting: [{ id: 1, status: 'LIVE', roleTitle: 'SDE Intern' }, { id: 2, status: 'LIVE', roleTitle: 'SDE Intern' }],
            postingSource: [{ id: 10, postingId: 1 }, { id: 11, postingId: 2 }],
            savedPosting: [{ id: 20, userId: 7, postingId: 1 }, { id: 21, userId: 7, postingId: 2 }, { id: 22, userId: 8, postingId: 2 }],
            postingApplication: [{ id: 30, userId: 7, postingId: 1, status: 'INTERESTED', note: null, appliedAt: null }, { id: 31, userId: 7, postingId: 2, status: 'APPLIED', note: 'x', appliedAt: new Date('2026-10-01') }],
            hiddenPosting: [{ id: 40, userId: 9, postingId: 2 }],
            postingReview: [],
        };
        const r = await mergePostings(fakeDb(state), { keepId: 1, dropId: 2, adminId: 2, now: new Date('2026-10-11') });
        expect(r.observations).toBe(1);
        expect(state.postingSource.every((o) => o.postingId === 1)).toBe(true);
        expect(state.savedPosting.map((s) => [s.userId, s.postingId]).sort()).toEqual([[7, 1], [8, 1]]); // user 7 saved both: one save left
        expect(state.postingApplication).toEqual([expect.objectContaining({ id: 30, userId: 7, postingId: 1, status: 'APPLIED', note: 'x' })]);
        expect(state.hiddenPosting[0].postingId).toBe(1);
        expect(state.posting[1]).toMatchObject({ status: 'REJECTED', rejectReason: 'Duplicate of #1', reviewedById: 2 });
        expect(state.postingReview.map((x) => [x.postingId, x.action])).toEqual([[2, 'REJECT'], [1, 'EDIT']]);
    });
    it('refuses with a 409 when the rule says no', async () => {
        const state = { posting: [{ id: 1, status: 'PENDING_REVIEW' }, { id: 2, status: 'LIVE' }], postingSource: [], savedPosting: [], postingApplication: [], hiddenPosting: [], postingReview: [] };
        await expect(mergePostings(fakeDb(state), { keepId: 1, dropId: 2, adminId: 2 })).rejects.toMatchObject({ status: 409 });
    });
});
