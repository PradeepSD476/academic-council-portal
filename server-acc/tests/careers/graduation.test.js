import { describe, it, expect } from 'vitest';
import { eligibilityProfile, graduationInfo, postingEligibility, programmeBody } from '../../services/careers/postings/eligibility.js';
import { eligibilityWhere } from '../../services/careers/postings/query.js';
import { parseEligibility } from '../../services/careers/text/eligibility.js';

const now = new Date('2026-10-10T12:00:00');

describe('graduationInfo (F-22)', () => {
    it('no programme given: a 4-year B.Tech is assumed, as before', () => {
        expect(graduationInfo({ admissionYear: 2024 })).toEqual({ graduationYear: 2028, graduationYearSource: 'ASSUMED' });
    });
    it('a programme sets the length', () => {
        expect(graduationInfo({ admissionYear: 2022, programme: 'DUAL' })).toEqual({ graduationYear: 2027, graduationYearSource: 'PROGRAMME' });
        expect(graduationInfo({ admissionYear: 2025, programme: 'MTECH' })).toEqual({ graduationYear: 2027, graduationYearSource: 'PROGRAMME' });
    });
    it("the student's own year wins; PhD without one is unknown", () => {
        expect(graduationInfo({ admissionYear: 2024, programme: 'DUAL', graduationYear: 2027 })).toEqual({ graduationYear: 2027, graduationYearSource: 'SELF' });
        expect(graduationInfo({ admissionYear: 2023, programme: 'PHD' })).toEqual({ graduationYear: null, graduationYearSource: null });
        expect(graduationInfo({ admissionYear: null })).toEqual({ graduationYear: null, graduationYearSource: null });
    });
});

describe('programmeBody', () => {
    it('accepts a known programme and a sensible year, null clears', () => {
        expect(programmeBody.parse({ programme: 'DUAL', graduationYear: 2027 })).toEqual({ programme: 'DUAL', graduationYear: 2027 });
        expect(programmeBody.parse({ graduationYear: null })).toEqual({ graduationYear: null });
    });
    it('rejects unknown values, odd years, extra keys and empty bodies', () => {
        expect(() => programmeBody.parse({ programme: 'BSC' })).toThrow();
        expect(() => programmeBody.parse({ graduationYear: 27 })).toThrow();
        expect(() => programmeBody.parse({ graduationYear: 2027, cpi: 9 })).toThrow();
        expect(() => programmeBody.parse({})).toThrow();
    });
});

describe('graduation batch first', () => {
    // A dual-degree student admitted in 2023: 4th year now, roll-number guess says 2027 (B.Tech) but
    // they graduate in 2028. And one admitted in 2022 whose guess (2026) they corrected to 2027.
    const posting2027 = { eligibleBranches: [], eligibleYears: [4, 5], eligibleGradYears: [2027], minCpi: null };

    it('the parser keeps the stated batch', () => {
        expect(parseEligibility('Open to 2027 graduates only', now).gradYears).toEqual([2027]);
    });
    it('a dual-degree student who corrected their year sees a "2027 graduates" posting as eligible', () => {
        const before = eligibilityProfile({ branchName: 'CS', admissionYear: 2024 }, now); // 3rd year, assumed 2028
        expect(postingEligibility(posting2027, before)).toMatchObject({ status: 'NOT_ELIGIBLE', reasons: [{ field: 'gradYear', allowed: [2027] }] });
        const after = eligibilityProfile({ branchName: 'CS', admissionYear: 2024, programme: 'DUAL', graduationYear: 2027 }, now);
        expect(postingEligibility(posting2027, after).status).toBe('ELIGIBLE');
    });
    it('the year of study no longer lets a wrong batch through', () => {
        // 4th-year dual student (year 4 is in eligibleYears) who graduates in 2028.
        const dual = eligibilityProfile({ branchName: 'CS', admissionYear: 2023, programme: 'DUAL' }, now);
        expect(dual.academicYear).toBe(4);
        expect(postingEligibility(posting2027, dual).status).toBe('NOT_ELIGIBLE');
    });
    it('without a stated batch the year of study still decides', () => {
        const p = { eligibleBranches: [], eligibleYears: [3], eligibleGradYears: [], minCpi: null };
        expect(postingEligibility(p, eligibilityProfile({ branchName: 'CS', admissionYear: 2024 }, now)).status).toBe('ELIGIBLE');
        expect(postingEligibility({ ...p, eligibleGradYears: null }, eligibilityProfile({ branchName: 'CS', admissionYear: 2023 }, now)).status).toBe('NOT_ELIGIBLE');
    });
    it('a batch alone counts as stated eligibility', () => {
        const p = { eligibleBranches: [], eligibleYears: [], eligibleGradYears: [2027], minCpi: null };
        expect(postingEligibility(p, eligibilityProfile({ branchName: null, admissionYear: null }, now)).status).toBe('UNKNOWN');
    });

    it('eligibilityWhere: the batch, else (no batch stated) the year of study', () => {
        const profile = eligibilityProfile({ branchName: 'CS', admissionYear: 2024, graduationYear: 2027 }, now);
        expect(eligibilityWhere(profile).AND[1]).toEqual({
            OR: [
                { eligibleGradYears: { has: 2027 } },
                {
                    AND: [
                        { OR: [{ eligibleGradYears: { isEmpty: true } }, { eligibleGradYears: { equals: null } }] },
                        { OR: [{ eligibleYears: { isEmpty: true } }, { eligibleYears: { equals: null } }, { eligibleYears: { has: 3 } }] },
                    ],
                },
            ],
        });
    });
    it('eligibilityWhere: graduation year unknown → year of study only (as before)', () => {
        const phd = eligibilityProfile({ branchName: 'CS', admissionYear: 2023, programme: 'PHD' }, now);
        expect(eligibilityWhere(phd).AND[1]).toEqual({ OR: [{ eligibleYears: { isEmpty: true } }, { eligibleYears: { equals: null } }, { eligibleYears: { has: 4 } }] });
    });
});
