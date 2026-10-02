import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/db.js', () => ({ default: {} }));

const { recheckUpdate, recheckResult } = await import('../../services/careers/ingest/liveness.js');
const { recheckLiveness } = await import('../../services/careers/links/recheckLiveness.js');
const { SafeFetchError } = await import('../../services/careers/links/safeFetch.js');

const now = new Date('2026-10-02T00:00:00Z');
const httpError = (status) => Object.assign(new SafeFetchError(`HTTP ${status}`, 'HTTP_STATUS'), { status });

describe('recheckResult', () => {
    it('maps 404 and 410 to gone, success to ok, everything else to an error', () => {
        expect(recheckResult(null)).toEqual({ ok: true });
        expect(recheckResult(httpError(404))).toEqual({ gone: true });
        expect(recheckResult(httpError(410))).toEqual({ gone: true });
        expect(recheckResult(httpError(500)).error).toMatch(/HTTP_STATUS/);
        expect(recheckResult(httpError(403)).error).toBeDefined();
        expect(recheckResult(new SafeFetchError('timeout', 'NETWORK')).error).toMatch(/NETWORK/);
    });
});

describe('recheckUpdate', () => {
    it('counts a miss, drops at the second, resets on a loaded page, ignores errors', () => {
        expect(recheckUpdate({ missedRuns: 0 }, { gone: true }, now)).toEqual({ missedRuns: 1 });
        expect(recheckUpdate({ missedRuns: 1 }, { gone: true }, now)).toEqual({ missedRuns: 2, isLive: false });
        expect(recheckUpdate({ missedRuns: 1 }, { ok: true }, now)).toEqual({ missedRuns: 0, lastSeenAt: now });
        expect(recheckUpdate({ missedRuns: 1 }, { error: 'NETWORK: down' }, now)).toBeNull();
    });
});

// A tiny in-memory stand-in for the two Prisma models the recheck touches.
function fakeDb(postings, observations) {
    return {
        postingSource: {
            findMany: async () => observations.filter((o) => o.isLive && ['LIVE', 'PENDING_REVIEW'].includes(postings[o.postingId].status)),
            update: async ({ where, data }) => Object.assign(observations.find((o) => o.id === where.id), data),
        },
        posting: {
            findUnique: async ({ where }) => ({ ...postings[where.id], observations: observations.filter((o) => o.postingId === where.id) }),
            update: async ({ where, data }) => Object.assign(postings[where.id], data),
        },
    };
}

describe('recheckLiveness', () => {
    it('expires a posting whose URL returns 404 on two runs', async () => {
        const postings = { 1: { id: 1, status: 'LIVE' } };
        const observations = [{ id: 10, postingId: 1, url: 'https://jobs.example.com/a', isLive: true, missedRuns: 0 }];
        const db = fakeDb(postings, observations);
        const fetchPage = async () => { throw httpError(404); };

        const first = await recheckLiveness({ db, fetchPage, now });
        expect(first).toMatchObject({ checked: 1, gone: 1, dropped: 0, expired: 0 });
        expect(postings[1].status).toBe('LIVE');

        const second = await recheckLiveness({ db, fetchPage, now });
        expect(second).toMatchObject({ checked: 1, gone: 1, dropped: 1, expired: 1 });
        expect(observations[0]).toMatchObject({ isLive: false, missedRuns: 2 });
        expect(postings[1].status).toBe('EXPIRED');

        // Nothing left to check on a third run.
        expect((await recheckLiveness({ db, fetchPage, now })).checked).toBe(0);
    });

    it('does not count network errors, and a loaded page resets the misses', async () => {
        const postings = { 1: { id: 1, status: 'LIVE' } };
        const observations = [{ id: 10, postingId: 1, url: 'https://jobs.example.com/a', isLive: true, missedRuns: 1 }];
        const db = fakeDb(postings, observations);

        const down = await recheckLiveness({ db, fetchPage: async () => { throw new SafeFetchError('refused', 'NETWORK'); }, now });
        expect(down).toMatchObject({ errors: 1, dropped: 0 });
        expect(observations[0].missedRuns).toBe(1);

        await recheckLiveness({ db, fetchPage: async () => ({ status: 200 }), now });
        expect(observations[0]).toMatchObject({ missedRuns: 0, isLive: true, lastSeenAt: now });
        expect(postings[1].status).toBe('LIVE');
    });

    it('keeps a posting live while another observation is still live, and skips blocked domains', async () => {
        const postings = { 1: { id: 1, status: 'LIVE' } };
        const observations = [
            { id: 10, postingId: 1, url: 'https://jobs.example.com/a', isLive: true, missedRuns: 1 },
            { id: 11, postingId: 1, url: 'https://www.linkedin.com/jobs/view/1', isLive: true, missedRuns: 0 },
        ];
        const fetchPage = vi.fn(async () => { throw httpError(410); });
        const result = await recheckLiveness({ db: fakeDb(postings, observations), fetchPage, now });
        expect(result).toMatchObject({ checked: 1, skipped: 1, dropped: 1, expired: 0 });
        expect(fetchPage).toHaveBeenCalledTimes(1);
        expect(postings[1].status).toBe('LIVE');
    });
});
