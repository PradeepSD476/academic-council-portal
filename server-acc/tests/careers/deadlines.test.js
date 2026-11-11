import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/db.js', () => ({ default: {} }));

const { expirePastDeadlines } = await import('../../services/careers/postings/deadlines.js');

// Minimal stand-in for prisma.posting that applies the where clause the job sends.
function fakeDb(postings) {
    const matches = (p, where) => where.status.in.includes(p.status) && p.deadlineStated !== null && p.deadlineStated < where.deadlineStated.lt
        && (!where.id || where.id.in.includes(p.id));
    return {
        posting: {
            findMany: async ({ where }) => postings.filter((p) => matches(p, where)).map(({ id, roleTitle }) => ({ id, roleTitle })),
            updateMany: async ({ where, data }) => {
                const hit = postings.filter((p) => matches(p, where));
                hit.forEach((p) => Object.assign(p, data));
                return { count: hit.length };
            },
        },
    };
}

describe('expirePastDeadlines (B-06)', () => {
    it('expires LIVE and pending postings whose stated deadline is before today (IST), nothing else', async () => {
        vi.spyOn(console, 'info').mockImplementation(() => {});
        const d = (s) => new Date(s);
        const postings = [
            { id: 1, roleTitle: 'Past, live', status: 'LIVE', deadlineStated: d('2026-10-08T00:00:00Z') },
            { id: 2, roleTitle: 'Past, pending', status: 'PENDING_REVIEW', deadlineStated: d('2026-10-01T00:00:00Z') },
            { id: 3, roleTitle: 'Today', status: 'LIVE', deadlineStated: d('2026-10-09T00:00:00Z') },
            { id: 4, roleTitle: 'No deadline', status: 'LIVE', deadlineStated: null },
            { id: 5, roleTitle: 'Rejected', status: 'REJECTED', deadlineStated: d('2026-10-01T00:00:00Z') },
        ];
        const result = await expirePastDeadlines({ db: fakeDb(postings), now: new Date('2026-10-09T05:30:00+05:30') });

        expect(result).toEqual({ expired: 2, ids: [1, 2] });
        expect(postings.map((p) => p.status)).toEqual(['EXPIRED', 'EXPIRED', 'LIVE', 'LIVE', 'REJECTED']);
    });
    it('does nothing when no deadline has passed', async () => {
        expect(await expirePastDeadlines({ db: fakeDb([]), now: new Date() })).toEqual({ expired: 0, ids: [] });
    });
});
