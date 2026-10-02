import { describe, it, expect } from 'vitest';
import { eligibilityProfile, postingEligibility, cpiBody, toCpi } from '../../services/careers/postings/eligibility.js';

// 2 Oct 2026: academic year 2026-27, so a 2024 admission is in year 3.
const now = new Date('2026-10-02T10:00:00+05:30');
const cs3 = eligibilityProfile({ branchName: 'CS', admissionYear: 2024, cpi: '8.25', cpiUpdatedAt: null }, now);
const cs3NoCpi = { ...cs3, cpi: null };
const noRoll = eligibilityProfile({ branchName: null, admissionYear: null, cpi: null }, now);

const posting = (over = {}) => ({ eligibleBranches: [], eligibleYears: [], minCpi: null, ...over });

describe('eligibilityProfile', () => {
    it('derives branch and academic year, converts CPI', () => {
        expect(cs3).toEqual({ branchName: 'CS', academicYear: 3, cpi: 8.25, cpiUpdatedAt: null, hasRollNumber: true });
    });
    it('uses the July academic-year boundary', () => {
        expect(eligibilityProfile({ branchName: 'EE', admissionYear: 2024 }, new Date('2026-06-30T12:00:00')).academicYear).toBe(2);
        expect(eligibilityProfile({ branchName: 'EE', admissionYear: 2024 }, new Date('2026-07-01T12:00:00')).academicYear).toBe(3);
    });
    it('reports no roll number when branch or year is missing', () => {
        expect(noRoll).toMatchObject({ branchName: null, academicYear: null, cpi: null, hasRollNumber: false });
        expect(eligibilityProfile({ branchName: 'CS', admissionYear: null }, now).hasRollNumber).toBe(false);
    });
    it('upper-cases the branch code', () => {
        expect(eligibilityProfile({ branchName: 'cs', admissionYear: 2024 }, now).branchName).toBe('CS');
    });
});

describe('postingEligibility matrix', () => {
    const cases = [
        // [label, posting, profile, status, failing fields]
        ['nothing stated', posting(), cs3, 'NOT_STATED', []],
        ['branch matches', posting({ eligibleBranches: ['CS', 'EE'] }), cs3, 'ELIGIBLE', []],
        ['branch does not match', posting({ eligibleBranches: ['ME'] }), cs3, 'NOT_ELIGIBLE', ['branch']],
        ['year matches', posting({ eligibleYears: [3, 4] }), cs3, 'ELIGIBLE', []],
        ['year does not match', posting({ eligibleYears: [4] }), cs3, 'NOT_ELIGIBLE', ['year']],
        ['CPI above cutoff', posting({ minCpi: '7.00' }), cs3, 'ELIGIBLE', []],
        ['CPI equal to cutoff', posting({ minCpi: 8.25 }), cs3, 'ELIGIBLE', []],
        ['CPI below cutoff', posting({ minCpi: 8.5 }), cs3, 'NOT_ELIGIBLE', ['cpi']],
        ['cutoff, no CPI given', posting({ minCpi: 7 }), cs3NoCpi, 'NEEDS_CPI', []],
        ['branch + year + CPI all fail', posting({ eligibleBranches: ['ME'], eligibleYears: [4], minCpi: 9 }), cs3, 'NOT_ELIGIBLE', ['branch', 'year', 'cpi']],
        ['branch ok, CPI unknown', posting({ eligibleBranches: ['CS'], minCpi: 7 }), cs3NoCpi, 'NEEDS_CPI', []],
        ['branch fails, CPI unknown', posting({ eligibleBranches: ['ME'], minCpi: 7 }), cs3NoCpi, 'NOT_ELIGIBLE', ['branch']],
        ['no roll number, branch limit', posting({ eligibleBranches: ['CS'] }), noRoll, 'UNKNOWN', []],
        ['no roll number, CPI-only cutoff', posting({ minCpi: 7 }), noRoll, 'NEEDS_CPI', []],
        ['no roll number, nothing stated', posting(), noRoll, 'NOT_STATED', []],
        ['no roll number but CPI below cutoff', posting({ eligibleYears: [3], minCpi: 9 }), { ...noRoll, cpi: 8 }, 'NOT_ELIGIBLE', ['cpi']],
    ];
    it.each(cases)('%s', (_label, p, profile, status, fields) => {
        const result = postingEligibility(p, profile);
        expect(result.status).toBe(status);
        expect(result.reasons.map((r) => r.field)).toEqual(fields);
    });
    it('returns the allowed values and cutoff for the badge text', () => {
        const result = postingEligibility(posting({ eligibleBranches: ['ME'], minCpi: '9.00' }), cs3);
        expect(result.reasons).toEqual([{ field: 'branch', allowed: ['ME'] }, { field: 'cpi', min: 9 }]);
        expect(result.minCpi).toBe(9);
    });
});

describe('cpiBody', () => {
    const ok = (cpi) => cpiBody.safeParse({ cpi }).success;
    it('accepts 0-10 with up to 2 decimals, and null', () => {
        for (const v of [0, 10, 7, 7.5, 8.25, 9.99, 0.01, null]) expect(ok(v), String(v)).toBe(true);
    });
    it('rejects out of range, 3 decimals, strings and extra keys', () => {
        for (const v of [-0.01, 10.01, 11, 8.255, '8.5', undefined, Number.NaN]) expect(ok(v), String(v)).toBe(false);
        expect(cpiBody.safeParse({ cpi: 8, userId: 2 }).success).toBe(false);
        expect(cpiBody.safeParse({}).success).toBe(false);
    });
    it('toCpi keeps null distinct from 0', () => {
        expect(toCpi(null)).toBeNull();
        expect(toCpi(undefined)).toBeNull();
        expect(toCpi('0.00')).toBe(0);
    });
});
