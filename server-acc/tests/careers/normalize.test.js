import { describe, it, expect } from 'vitest';
import { normalizeCompanyName, normalizeTitle, normalizeLocation } from '../../services/careers/text/normalize.js';

describe('normalizeCompanyName', () => {
    it.each([
        ['Google', 'google'],
        ['Google India', 'google'],
        ['Google LLC', 'google'],
        ['google', 'google'],
        ['GOOGLE INDIA PVT. LTD.', 'google'],
        ['Google India Private Limited', 'google'],
        ['Qualcomm India Pvt. Ltd.', 'qualcomm'],
        ['amazon.com', 'amazon'],
        ['Amazon.com, Inc.', 'amazon'],
        ['JPMorgan Chase & Co.', 'jpmorgan chase'],
        ['JPMorgan Chase', 'jpmorgan chase'],
        ['Procter & Gamble', 'procter and gamble'],
        ['Société Générale', 'societe generale'],
        ['The D. E. Shaw Group', 'd e shaw group'],
        ['  Microsoft   Corporation ', 'microsoft'],
    ])('%s -> %s', (input, expected) => {
        expect(normalizeCompanyName(input)).toBe(expected);
    });

    it('keeps meaningful words such as "India" in the middle of a name', () => {
        expect(normalizeCompanyName('Microsoft India Development Center')).toBe('microsoft india development center');
    });
    it('never erases a name made only of noise words', () => {
        expect(normalizeCompanyName('Company')).toBe('company');
    });
    it('handles non-strings and empty input', () => {
        expect(normalizeCompanyName(null)).toBe('');
        expect(normalizeCompanyName('')).toBe('');
        expect(normalizeCompanyName(' ... ')).toBe('');
    });
});

describe('normalizeTitle', () => {
    it('drops the hiring-cycle noise from an intern title', () => {
        expect(normalizeTitle('Software Engineer Intern - Summer 2026')).toBe('software engineer intern');
    });
    it('an intern role never collapses into the full-time role', () => {
        expect(normalizeTitle('Software Engineer Intern - Summer 2026')).not.toBe(normalizeTitle('Software Engineer'));
    });
    it.each([
        ['SDE-1', 'software engineer'],
        ['SDE I', 'software engineer'],
        ['Software Development Engineer', 'software engineer'],
        ['SWE Intern (Bangalore)', 'software engineer intern'],
        ['Software Engineering Internship [2027 Batch]', 'software engineering intern'],
        ['Data Analyst — Winter Cohort', 'data analyst'],
        ['  Product   Manager  ', 'product manager'],
    ])('%s -> %s', (input, expected) => {
        expect(normalizeTitle(input)).toBe(expected);
    });
    it('keeps level markers other than I/1 (they are real differences)', () => {
        expect(normalizeTitle('Software Engineer II')).toBe('software engineer ii');
    });
    it('handles empty input', () => {
        expect(normalizeTitle(undefined)).toBe('');
    });
});

describe('normalizeLocation', () => {
    it.each([
        ['Bangalore, India', 'bengaluru'],
        ['Bengaluru, Karnataka, India', 'bengaluru'],
        ['Gurgaon', 'gurugram'],
        ['New Delhi', 'delhi'],
        ['Bombay', 'mumbai'],
        ['Hyderabad / Bangalore', 'bengaluru|hyderabad'],
        ['Bangalore; Hyderabad', 'bengaluru|hyderabad'],
        ['Remote', 'remote'],
        ['Remote - India', 'remote'],
        ['Work from home', 'remote'],
        ['Hybrid (Pune)', 'pune'],
        ['Bengaluru or Remote', 'bengaluru|remote'],
        ['India', 'india'],
        ['London, UK', 'london uk'],
    ])('%s -> %s', (input, expected) => {
        expect(normalizeLocation(input)).toBe(expected);
    });
    it('the same cities in any order give the same key', () => {
        expect(normalizeLocation('Hyderabad, Bangalore')).toBe(normalizeLocation('Bangalore / Hyderabad'));
    });
    it('returns null for missing locations (unknown is not a value)', () => {
        expect(normalizeLocation(null)).toBeNull();
        expect(normalizeLocation('   ')).toBeNull();
    });
});
