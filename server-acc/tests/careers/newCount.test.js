import { describe, it, expect } from 'vitest';
import { newSinceWhere, newCountQuery } from '../../services/careers/postings/newCount.js';
import { eligibilityWhere } from '../../services/careers/postings/query.js';

describe('newSinceWhere ("New for you" count, F-21)', () => {
    const since = new Date('2026-10-09T10:00:00Z');
    it('counts LIVE postings shown after the last visit, like the New badge (publishedAt, else firstSeenAt)', () => {
        expect(newSinceWhere(since, null)).toEqual({
            AND: [
                { status: 'LIVE' },
                { OR: [{ publishedAt: { gt: since } }, { publishedAt: null, firstSeenAt: { gt: since } }] },
            ],
        });
    });
    it('adds the "Eligible for me" rule when the student has one', () => {
        const elig = eligibilityWhere({ hasRollNumber: true, branchName: 'CS', academicYear: 3, cpi: null });
        expect(newSinceWhere(since, elig).AND).toHaveLength(3);
        expect(newSinceWhere(since, elig).AND[2]).toBe(elig);
    });
});

describe('newCountQuery', () => {
    const now = Date.parse('2026-10-10T10:00:00Z');
    it('reads since as epoch milliseconds', () => {
        expect(newCountQuery({ since: '1760000000000' }, now).since.getTime()).toBe(1760000000000);
    });
    it('rejects a missing, non-numeric or future value', () => {
        expect(() => newCountQuery({}, now)).toThrow();
        expect(() => newCountQuery({ since: 'yesterday' }, now)).toThrow();
        expect(() => newCountQuery({ since: String(now + 10 * 60_000) }, now)).toThrow();
    });
});
