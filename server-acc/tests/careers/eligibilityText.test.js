import { describe, it, expect } from 'vitest';
import { parseEligibility, CIRCUITAL_BRANCHES } from '../../services/careers/text/eligibility.js';

// 9 Oct 2026: academic year 2026-27, so "2027 graduates" are in their final year.
const now = new Date('2026-10-09T00:00:00+05:30');
const parse = (text, at = now) => parseEligibility(text, at);

describe('parseEligibility (B-03)', () => {
    it('reads the Rubrik #17 criteria seen on 8 Oct', () => {
        const text = 'Minimum eligibility criteria\n- CGPA 8 and above\n- 2027 graduates of Circuital branches only\n- Available from January 2027 to May 2027 in Bangalore';
        expect(parse(text)).toEqual({ minCpi: 8, years: [4, 5], branches: CIRCUITAL_BRANCHES, mentioned: true });
    });

    it.each([
        ['CGPA of 7.5 and above', 7.5],
        ['Minimum CPI: 8.5', 8.5],
        ['7.5+ CGPA required', 7.5],
        ['8 CGPA or above', 8],
        ['CGPA >= 7.0/10', 7],
        ['CGPA 8 (CSE) or CGPA 8.5 (other branches)', 8],
    ])('CPI cutoff: %s -> %s', (text, min) => {
        expect(parse(text)).toMatchObject({ minCpi: min, mentioned: true });
    });

    it('a 4-point GPA is not a CPI, but eligibility is still mentioned', () => {
        expect(parse('GPA 3.5/4 or higher')).toMatchObject({ minCpi: null, mentioned: true });
    });
    it('a number away from any CPI word is not a cutoff', () => {
        expect(parse('Work 5 days a week; 7 days of onboarding.')).toEqual({ minCpi: null, years: [], branches: [], mentioned: false });
    });

    it.each([
        ['Open to the batch of 2028', [3, 4]],
        ['2027 passouts only', [4, 5]],
        ['Pre-final year students', [3, 4]],
        ['Final year students only', [4, 5]],
        ['Graduating in 2029', [2, 3]],
    ])('years: %s -> %j', (text, years) => {
        expect(parse(text)).toMatchObject({ years, mentioned: true });
    });
    it('a batch that has already graduated gives no year (but is mentioned)', () => {
        expect(parse('2027 graduates only', new Date('2027-07-15T00:00:00+05:30'))).toMatchObject({ years: [], mentioned: true });
        expect(parse('2020 graduates with 3+ years of experience')).toMatchObject({ years: [], mentioned: true });
    });

    it('a branch list maps to roll-number codes', () => {
        expect(parse('Eligible branches: CSE, ECE and EE')).toMatchObject({ branches: ['CS', 'EC', 'EE'], mentioned: true });
    });
    it('"branches" of a bank (posting #42) is not eligibility', () => {
        expect(parse('They will be responsible for collection targets of the assigned branches.')).toMatchObject({ mentioned: false });
    });
    it('a branch list with a name we cannot map is not guessed', () => {
        expect(parse('Branches: CSE, Biotechnology')).toMatchObject({ branches: [], mentioned: true });
    });
    it('"degree in Computer Science or a related field" does not restrict branches', () => {
        expect(parse('Pursuing a Bachelor’s degree in Computer Science, Engineering, Information Systems or a related field.'))
            .toEqual({ minCpi: null, years: [], branches: [], mentioned: false });
    });
});
