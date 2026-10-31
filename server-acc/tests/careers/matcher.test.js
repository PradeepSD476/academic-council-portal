import { describe, it, expect } from 'vitest';
import { buildIndex, resolveName, addToIndex, similarity } from '../../services/careers/companies/matcher.js';
import { normalizeCompanyName } from '../../services/careers/text/normalize.js';
import { slugify, uniqueSlug } from '../../services/careers/companies/slug.js';

const alias = (companyId, text) => ({ companyId, alias: text, normalizedAlias: normalizeCompanyName(text) });

const index = () => buildIndex([
    alias(1, 'Google'),
    alias(1, 'Alphabet'),
    alias(2, 'Microsoft'),
    alias(3, 'Goldman Sachs'),
    alias(4, 'Meta'),
    alias(5, 'Texas Instruments'),
    alias(5, 'TI'),
    alias(6, 'Databricks'),
]);

describe('resolveName', () => {
    it('exact alias match (case/whitespace-insensitive)', () => {
        expect(resolveName('  alphabet ', index())).toMatchObject({ companyId: 1, method: 'exact', score: 1 });
    });
    it.each(['Google India', 'Google LLC', 'GOOGLE INDIA PVT. LTD.', 'google'])('normalised match: %s -> Google', (name) => {
        const r = resolveName(name, index());
        expect(r.companyId).toBe(1);
        expect(['exact', 'normalized']).toContain(r.method);
    });
    it('fuzzy match catches a small typo in a long name', () => {
        expect(resolveName('Goldman Sach', index())).toMatchObject({ companyId: 3, method: 'fuzzy' });
    });
    it('fuzzy score is reported so callers can flag it as uncertain', () => {
        const r = resolveName('Goldman Sach', index());
        expect(r.method).toBe('fuzzy');
        expect(r.score).toBeGreaterThanOrEqual(0.92);
        expect(r.score).toBeLessThan(1);
    });
    it('one typo in a 10-letter name (score 0.90) sits just below the default threshold', () => {
        expect(resolveName('Databriks', index()).companyId).toBeNull();
        expect(resolveName('Databriks', index(), { fuzzyThreshold: 0.9 })).toMatchObject({ companyId: 6, method: 'fuzzy' });
    });
    it('does not confuse short names: Beta is not Meta', () => {
        expect(resolveName('Beta', index())).toMatchObject({ companyId: null, method: 'none' });
    });
    it('the threshold blocks near-but-different names', () => {
        expect(resolveName('Goldman Partners', index()).companyId).toBeNull();
        expect(resolveName('Microsoft', index(), { fuzzyThreshold: 0.99 }).companyId).toBe(2); // exact still wins
    });
    it('a lower threshold is honoured', () => {
        expect(resolveName('Goldmann Sachss', index()).companyId).toBeNull();
        expect(resolveName('Goldmann Sachss', index(), { fuzzyThreshold: 0.85 }).companyId).toBe(3);
    });
    it('a tie between two different companies resolves to none', () => {
        const tied = buildIndex([alias(10, 'Alpha Labs'), alias(11, 'Alpha Lads')]);
        expect(resolveName('Alpha Lals', tied, { fuzzyThreshold: 0.5 }).companyId).toBeNull();
    });
    it('unknown company resolves to none but still returns its normalised key', () => {
        expect(resolveName('Acme Robotics Pvt Ltd', index())).toMatchObject({ companyId: null, method: 'none', normalized: 'acme robotics' });
    });
    it('empty or non-string input resolves to none', () => {
        expect(resolveName('', index()).method).toBe('none');
        expect(resolveName(null, index()).method).toBe('none');
    });
    it('addToIndex makes a newly created company resolvable', () => {
        const idx = index();
        addToIndex(idx, { companyId: 99, alias: 'Acme Robotics', normalizedAlias: 'acme robotics' });
        expect(resolveName('ACME ROBOTICS LTD', idx)).toMatchObject({ companyId: 99, method: 'normalized' });
    });
});

describe('similarity', () => {
    it('is 1 for equal strings and lower for different ones', () => {
        expect(similarity('abc', 'abc')).toBe(1);
        expect(similarity('meta', 'beta')).toBe(0.75);
    });
});

describe('slugify / uniqueSlug', () => {
    it.each([
        ['D. E. Shaw & Co.', 'd-e-shaw-and-co'],
        ['Société Générale', 'societe-generale'],
        ['Media.net', 'media-net'],
        ['   ', 'company'],
    ])('%s -> %s', (name, slug) => {
        expect(slugify(name)).toBe(slug);
    });
    it('appends a counter when the slug is taken', async () => {
        const taken = new Set(['google', 'google-2']);
        expect(await uniqueSlug('Google', async (s) => taken.has(s))).toBe('google-3');
    });
});
