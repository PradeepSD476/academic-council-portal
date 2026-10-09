import { describe, it, expect, vi, beforeEach } from 'vitest';

const db = vi.hoisted(() => ({}));
vi.mock('../../config/db.js', () => ({ default: db }));

const { submitLink, mySubmissions, reshareDecision, STORED_ONLY_RESHARE_DAYS } = await import('../../controllers/careers/submissionsController.js');

const now = new Date('2026-10-09T12:00:00Z');
const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

describe('reshareDecision (B-08)', () => {
    it('a new link is processed', () => {
        expect(reshareDecision(null, now)).toBe('NEW');
    });
    it('a link that failed before is processed again (the page may be back)', () => {
        expect(reshareDecision({ status: 'FAILED', createdAt: daysAgo(0) }, now)).toBe('NEW');
    });
    it('a store-only link is shared again only after some days', () => {
        expect(reshareDecision({ status: 'STORED_ONLY', createdAt: daysAgo(1) }, now)).toBe('SHARE');
        expect(reshareDecision({ status: 'STORED_ONLY', createdAt: daysAgo(STORED_ONLY_RESHARE_DAYS + 1) }, now)).toBe('NEW');
    });
    it.each(['RECEIVED', 'PROCESSING', 'EXTRACTING', 'PENDING_REVIEW', 'DUPLICATE'])('%s: recorded as a re-share, not processed twice', (status) => {
        expect(reshareDecision({ status, createdAt: daysAgo(30) }, now)).toBe('SHARE');
    });
});

// Fake Prisma for the two controllers.
let submissions;
let shares;
const res = () => {
    const r = { statusCode: 200 };
    r.status = (c) => { r.statusCode = c; return r; };
    r.json = (b) => { r.body = b; return r; };
    return r;
};
beforeEach(() => {
    submissions = [{ id: 1, url: 'https://jobs.example.com/a', canonicalUrl: 'https://jobs.example.com/a', note: 'my friend works here', submittedById: 10, status: 'PENDING_REVIEW', postingId: null, error: null, createdAt: daysAgo(2), updatedAt: daysAgo(2) }];
    shares = [];
    const pick = (row, select) => (select ? Object.fromEntries(Object.keys(select).map((k) => [k, row[k]])) : row);
    Object.assign(db, {
        linkSubmission: {
            findFirst: async ({ where, select }) => {
                const hit = submissions.filter((s) => s.canonicalUrl === where.canonicalUrl).sort((a, b) => b.createdAt - a.createdAt)[0];
                return hit ? pick(hit, select) : null;
            },
            create: async ({ data, select }) => {
                const row = { id: submissions.length + 1, status: 'RECEIVED', postingId: null, error: null, createdAt: now, updatedAt: now, ...data };
                submissions.push(row);
                return pick(row, select);
            },
            findMany: async ({ where, select }) => submissions
                .filter((s) => (where.submittedById ? s.submittedById === where.submittedById : where.id.in.includes(s.id)))
                .map((s) => pick(s, select)),
        },
        linkShare: {
            upsert: async ({ create }) => {
                if (!shares.some((x) => x.submissionId === create.submissionId && x.userId === create.userId)) shares.push({ ...create, createdAt: now });
                return create;
            },
            findMany: async ({ where }) => shares.filter((x) => x.userId === where.userId),
        },
        posting: { findMany: async () => [] },
    });
});

describe('submitLink / mySubmissions (B-08)', () => {
    it('a second student re-sharing a link sees it in their list, without the first student\'s note', async () => {
        const r = res();
        await submitLink({ body: { url: 'https://jobs.example.com/a' }, user: { id: 20 } }, r);
        expect(r.statusCode).toBe(200);
        expect(submissions).toHaveLength(1);

        const mine = res();
        await mySubmissions({ user: { id: 20 } }, mine);
        expect(mine.body.data).toHaveLength(1);
        expect(mine.body.data[0]).toMatchObject({ id: 1, status: 'PENDING_REVIEW', sharedEarlier: true });
        expect(mine.body.data[0].note).toBeUndefined();
    });
    it('a link that failed before becomes a new submission', async () => {
        submissions[0].status = 'FAILED';
        const r = res();
        await submitLink({ body: { url: 'https://jobs.example.com/a', note: 'back up now' }, user: { id: 20 } }, r);
        expect(r.statusCode).toBe(201);
        expect(submissions).toHaveLength(2);
        expect(submissions[1]).toMatchObject({ submittedById: 20, status: 'RECEIVED' });
    });
    it('the first sharer still sees their own note', async () => {
        const mine = res();
        await mySubmissions({ user: { id: 10 } }, mine);
        expect(mine.body.data[0]).toMatchObject({ id: 1, note: 'my friend works here', sharedEarlier: false });
    });
});
