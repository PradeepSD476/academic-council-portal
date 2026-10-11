import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { sourceRuleDrop, normalizeKeywords, keywordFields, hasRules } from '../../services/careers/sources/keywordRules.js';

describe('per-board keyword rules (F-08)', () => {
    const paytm = { excludeTitleKeywords: ['tele', 'sales', 'field executive'] };
    it('drops titles with an excluded word or phrase, case-insensitive', () => {
        expect(sourceRuleDrop('Tele Sales Executive - Noida', paytm)).toBe('exclude');
        expect(sourceRuleDrop('Inside SALES Intern', paytm)).toBe('exclude');
        expect(sourceRuleDrop('Field Executive (Fresher)', paytm)).toBe('exclude');
    });
    it('matches whole words only', () => {
        expect(sourceRuleDrop('Salesforce Developer Intern', paytm)).toBeNull();
        expect(sourceRuleDrop('Telecom Software Engineer Intern', paytm)).toBeNull();
    });
    it('"only keep" lists keep matching titles and drop the rest', () => {
        const only = { includeTitleKeywords: ['engineer', 'developer', 'c++'] };
        expect(sourceRuleDrop('Software Engineer Intern', only)).toBeNull();
        expect(sourceRuleDrop('C++ Intern', only)).toBeNull();
        expect(sourceRuleDrop('Business Analyst Intern', only)).toBe('include');
    });
    it('exclude wins over include; no rules keeps everything', () => {
        expect(sourceRuleDrop('Sales Engineer Intern', { excludeTitleKeywords: ['sales'], includeTitleKeywords: ['engineer'] })).toBe('exclude');
        expect(sourceRuleDrop('Anything', {})).toBeNull();
        expect(sourceRuleDrop('Anything', { excludeTitleKeywords: null, includeTitleKeywords: null })).toBeNull();
        expect(hasRules({ excludeTitleKeywords: [] })).toBe(false);
        expect(hasRules({ includeTitleKeywords: ['x'] })).toBe(true);
    });
    it('keywords are trimmed, lower-cased and de-duplicated; limits apply', () => {
        expect(normalizeKeywords([' Tele ', 'sales', 'SALES', 'field   executive'])).toEqual(['tele', 'sales', 'field executive']);
        const body = z.object(keywordFields);
        expect(body.parse({ excludeTitleKeywords: ['Tele', 'tele'] })).toEqual({ excludeTitleKeywords: ['tele'] });
        expect(() => body.parse({ excludeTitleKeywords: Array.from({ length: 21 }, (_, i) => `k${i}`) })).toThrow();
        expect(() => body.parse({ includeTitleKeywords: [''] })).toThrow();
        expect(() => body.parse({ includeTitleKeywords: ['x'.repeat(41)] })).toThrow();
    });
});
