import { describe, it, expect } from 'vitest';
import { buildIndex } from '../../services/careers/companies/matcher.js';
import { normalizeCompanyName } from '../../services/careers/text/normalize.js';
import { suggestCompany, patternCandidates, scanText, SHORT_ALIAS_SCORE } from '../../services/careers/companies/suggest.js';

const C = { google: 1, microsoft: 2, amazon: 3, goldman: 4, deshaw: 5, flipkart: 6, qualcomm: 7, ti: 8, googleCloud: 61, meta: 9 };
const aliases = [
    ['Google', C.google], ['Microsoft', C.microsoft], ['Microsoft IDC', C.microsoft], ['Microsoft India Development Center', C.microsoft],
    ['Amazon', C.amazon], ['Amazon Web Services', C.amazon], ['AWS', C.amazon], ['Goldman Sachs', C.goldman], ['GS', C.goldman],
    ['D. E. Shaw', C.deshaw], ['DE Shaw', C.deshaw], ['The D. E. Shaw Group', C.deshaw], ['Flipkart', C.flipkart], ['Flipkart Internet', C.flipkart],
    ['Qualcomm', C.qualcomm], ['Texas Instruments', C.ti], ['TI', C.ti], ['Google Cloud India', C.googleCloud], ['Meta', C.meta],
].map(([alias, companyId]) => ({ alias, companyId, normalizedAlias: normalizeCompanyName(alias) }));
const index = buildIndex(aliases);

describe('suggestCompany on the 12 demo experience titles', () => {
    const cases = [
        ['My Google India internship: from OA to offer', C.google],
        ['Interview experience at GOOGLE LLC (SWE intern)', C.google],
        ['Microsoft SWE intern 2025: rounds and preparation', C.microsoft],
        ['Placement at Microsoft India Development Center', C.microsoft],
        ['Goldman Sachs Analyst: summer internship experience', C.goldman],
        ['Amazon SDE-1 placement interview', C.amazon],
        ['amazon.com internship: 2 rounds + bar raiser', C.amazon],
        ['Texas Instruments analog intern experience', C.ti],
        ['Qualcomm India Pvt. Ltd. interview rounds', C.qualcomm],
        ['Flipkart Internship Experience (APM)', C.flipkart],
        ['DE Shaw quant developer interview', C.deshaw],
        ['Building a campus startup: lessons learned', null],
    ];
    it.each(cases)('%s', (title, expected) => {
        expect(suggestCompany(title, index)?.companyId ?? null).toBe(expected);
    });
    it('gets all 11 company titles right and suggests nothing for the startup post', () => {
        const right = cases.filter(([t, e]) => (suggestCompany(t, index)?.companyId ?? null) === e).length;
        expect(right).toBe(12);
    });
});

describe('suggestCompany rules', () => {
    it('prefers the longest alias in the title', () => {
        expect(suggestCompany('Google Cloud India internship', index)).toMatchObject({ companyId: C.googleCloud, matched: 'google cloud', method: 'alias', score: 1 });
        expect(suggestCompany('Placement at Microsoft India Development Center', index).matched).toBe('microsoft india development center');
    });
    it('only matches whole words', () => {
        expect(suggestCompany('Metamorphic testing at a startup', index)).toBeNull();
        expect(suggestCompany('Tips for interviews', index)).toBeNull(); // "ti" inside "tips"
    });
    it('short aliases score lower', () => {
        expect(suggestCompany('GS summer analyst', index)).toMatchObject({ companyId: C.goldman, score: SHORT_ALIAS_SCORE });
    });
    it('falls back to the patterns through the matcher (fuzzy for a typo)', () => {
        const r = suggestCompany('Interview experience at Goldmann Sachs', index);
        expect(r).toMatchObject({ companyId: C.goldman, method: 'pattern:at:fuzzy' });
        expect(r.score).toBeGreaterThan(0.92);
        // One letter off in a short name is below the 0.92 fuzzy threshold: no guess.
        expect(suggestCompany('Interview experience at Qualcom', index)).toBeNull();
    });
    it('returns null when nothing is known', () => {
        expect(suggestCompany('Internship at Acme Robotics', index)).toBeNull();
        expect(suggestCompany('', index)).toBeNull();
    });
});

describe('helpers', () => {
    it('scanText folds case, accents and punctuation without dropping words', () => {
        expect(scanText('Société Générale & Co. — Intern')).toBe('societe generale and co intern');
    });
    it('patternCandidates cuts at punctuation, years and "for"/"in"', () => {
        expect(patternCandidates('Interview experience at Acme Robotics (SWE intern)')[0]).toEqual({ kind: 'at', name: 'Acme Robotics' });
        expect(patternCandidates('Acme intern 2025: rounds')[0]).toEqual({ kind: 'intern', name: 'Acme' });
        expect(patternCandidates('Placement @Acme in Bangalore')[0]).toEqual({ kind: '@', name: 'Acme' });
    });
});
