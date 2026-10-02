import { describe, it, expect } from 'vitest';
import {
    postingsQuery, compensationWhere, eligibilityWhere, baseWhere, withEligibility, orderByFor, hasPayFilter, MAX_LIMIT,
} from '../../services/careers/postings/query.js';

const parse = (q) => postingsQuery.parse(q);

describe('postingsQuery', () => {
    it('applies defaults', () => {
        expect(parse({})).toEqual({
            q: undefined, type: undefined, workMode: undefined, location: undefined, skills: [], companyId: undefined,
            minStipend: undefined, minCtc: undefined, includeUndisclosed: true, eligibleOnly: false,
            sort: 'newest', page: 1, limit: 20,
        });
    });
    it('parses strings from the query string', () => {
        const p = parse({ minStipend: '10000', includeUndisclosed: 'false', eligibleOnly: 'true', page: '2', limit: '50', companyId: '7' });
        expect(p).toMatchObject({ minStipend: 10000, includeUndisclosed: false, eligibleOnly: true, page: 2, limit: 50, companyId: 7 });
    });
    it('canonicalises and dedupes skills (csv)', () => {
        expect(parse({ skills: 'react, React ,python,,' }).skills).toEqual(['React', 'Python']);
    });
    it('rejects bad values', () => {
        for (const q of [{ limit: String(MAX_LIMIT + 1) }, { page: '0' }, { type: 'PART_TIME' }, { minStipend: '-1' }, { includeUndisclosed: 'yes' }, { sort: 'oldest' }]) {
            expect(postingsQuery.safeParse(q).success, JSON.stringify(q)).toBe(false);
        }
    });
    it('treats an empty q / location as absent', () => {
        expect(parse({ q: '  ', location: '' })).toMatchObject({ q: undefined, location: undefined });
    });
});

describe('compensationWhere (null-safe)', () => {
    it('stipend with undisclosed included', () => {
        expect(compensationWhere('stipend', 10000, true)).toEqual({
            AND: [
                { type: { not: 'FULL_TIME' } },
                {
                    OR: [
                        {
                            compCurrency: 'INR',
                            stipendDisclosure: { in: ['DISCLOSED', 'RANGE'] },
                            OR: [{ stipendMax: { gte: 10000 } }, { stipendMax: null, stipendMin: { gte: 10000 } }],
                        },
                        { stipendDisclosure: { in: ['NOT_DISCLOSED', 'UNCLEAR'] } },
                        { compCurrency: { not: 'INR' } },
                    ],
                },
            ],
        });
    });
    it('without undisclosed only the disclosed branch remains', () => {
        const where = compensationWhere('stipend', 10000, false);
        expect(where.AND[1].OR).toHaveLength(1);
        expect(where.AND[1].OR[0].stipendDisclosure).toEqual({ in: ['DISCLOSED', 'RANGE'] });
    });
    it('CTC uses the ctc fields and skips internships', () => {
        const where = compensationWhere('ctc', 1200000, true);
        expect(where.AND[0]).toEqual({ type: { not: 'INTERNSHIP' } });
        expect(where.AND[1].OR[0].OR).toEqual([{ ctcMax: { gte: 1200000 } }, { ctcMax: null, ctcMin: { gte: 1200000 } }]);
        expect(where.AND[1].OR[1]).toEqual({ ctcDisclosure: { in: ['NOT_DISCLOSED', 'UNCLEAR'] } });
    });
});

describe('eligibilityWhere', () => {
    const profile = { branchName: 'CS', academicYear: 3, cpi: 8.25, hasRollNumber: true };
    it('branch, year and CPI clauses, each passing when the posting states nothing ([] or NULL)', () => {
        expect(eligibilityWhere(profile)).toEqual({
            AND: [
                { OR: [{ eligibleBranches: { isEmpty: true } }, { eligibleBranches: { equals: null } }, { eligibleBranches: { has: 'CS' } }] },
                { OR: [{ eligibleYears: { isEmpty: true } }, { eligibleYears: { equals: null } }, { eligibleYears: { has: 3 } }] },
                { OR: [{ minCpi: null }, { minCpi: { lte: 8.25 } }] },
            ],
        });
    });
    it('no CPI: no CPI clause (postings with a cutoff still pass)', () => {
        expect(eligibilityWhere({ ...profile, cpi: null }).AND).toHaveLength(2);
    });
    it('no roll number: null (the filter is not applied)', () => {
        expect(eligibilityWhere({ branchName: null, academicYear: null, cpi: 9, hasRollNumber: false })).toBeNull();
    });
});

describe('baseWhere', () => {
    it('is LIVE only with no filters', () => {
        expect(baseWhere(parse({}))).toEqual({ AND: [{ status: 'LIVE' }] });
    });
    it('builds each filter', () => {
        const where = baseWhere(parse({ q: 'react', type: 'INTERNSHIP', workMode: 'REMOTE', location: 'Bangalore', skills: 'Python', companyId: '3' }));
        expect(where.AND).toEqual([
            { status: 'LIVE' },
            { OR: [{ roleTitle: { contains: 'react', mode: 'insensitive' } }, { company: { name: { contains: 'react', mode: 'insensitive' } } }, { skills: { has: 'React' } }] },
            { type: 'INTERNSHIP' },
            { workMode: 'REMOTE' },
            { OR: [{ locationNormalized: { contains: 'bengaluru' } }] },
            { skills: { hasSome: ['Python'] } },
            { companyId: 3 },
        ]);
    });
    it('a q that is not a known skill only searches title and company', () => {
        expect(baseWhere(parse({ q: 'acme' })).AND[1].OR).toHaveLength(2);
    });
    it('the includeUndisclosed override changes only the pay clause', () => {
        const params = parse({ minStipend: '10000' });
        expect(baseWhere(params).AND[1].AND[1].OR).toHaveLength(3);
        expect(baseWhere(params, { includeUndisclosed: false }).AND[1].AND[1].OR).toHaveLength(1);
    });
    it('withEligibility appends the clause, or leaves the where alone', () => {
        const base = baseWhere(parse({}));
        expect(withEligibility(base, null)).toBe(base);
        expect(withEligibility(base, { x: 1 }).AND).toEqual([{ status: 'LIVE' }, { x: 1 }]);
    });
});

describe('orderByFor / hasPayFilter', () => {
    it('sorts newest by publishedAt, lastSeen by lastSeenLiveAt, ties by id', () => {
        expect(orderByFor('newest')).toEqual([{ publishedAt: 'desc' }, { id: 'desc' }]);
        expect(orderByFor('lastSeen')).toEqual([{ lastSeenLiveAt: 'desc' }, { id: 'desc' }]);
    });
    it('knows when a pay filter is set (0 counts)', () => {
        expect(hasPayFilter(parse({}))).toBe(false);
        expect(hasPayFilter(parse({ minStipend: '0' }))).toBe(true);
        expect(hasPayFilter(parse({ minCtc: '500000' }))).toBe(true);
    });
});
