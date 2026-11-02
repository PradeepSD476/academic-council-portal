import { describe, it, expect } from 'vitest';
import { parseSeason } from '../../services/careers/text/season.js';
import { buildPostingData } from '../../services/careers/ingest/buildPosting.js';
import { postingsQuery, baseWhere } from '../../services/careers/postings/query.js';

const month = (y, m) => new Date(Date.UTC(y, m - 1, 1));

describe('parseSeason (F-25), on titles and lines seen in the dev data', () => {
    it('#102 Google: "Summer 2026" title, "start in May 2026", "10-12 weeks"', () => {
        const r = parseSeason('Software Engineering Intern, Summer 2026',
            'Our Summer internships will start in May 2026 and will be for 10-12 weeks in duration.\nJoin us for a 10-12 week paid internship.');
        expect(r).toEqual({ season: 'SUMMER', startMonth: month(2026, 5), durationMonths: 3, found: true });
    });
    it('#64: "Winter Intern" title, "January 2027 to May 2027"', () => {
        expect(parseSeason('Software Engineer (CPD) - Winter Intern', '- Available from January 2027 to May 2027 in Bangalore for the onsite internship'))
            .toEqual({ season: 'WINTER', startMonth: month(2027, 1), durationMonths: 5, found: true });
    });
    it('#63: a range alone gives start and length, but no season (not stated)', () => {
        expect(parseSeason('ENG Project/ Program - Intern', '- Available from January 2027 to May 2027 in Bangalore'))
            .toEqual({ season: null, startMonth: month(2027, 1), durationMonths: 5, found: true });
    });
    it('#69 "a 3-month internship", "Duration: 3 months"', () => {
        expect(parseSeason('Intern - Creative & Communications', 'join our Talent team for a 3-month internship.\n- Duration: 3 months')).toMatchObject({ durationMonths: 3, season: null, startMonth: null });
    });
    it('#86 "Duration: 6 months", #103 "a 6 months programme", #53 "6-month Apprenticeship … starting in Jan 2027"', () => {
        expect(parseSeason('Talent Acquisition Intern', 'Duration: 6 months ').durationMonths).toBe(6);
        expect(parseSeason('Software Engineer - Intern', '- This will be a 6 months programme with a possibility of converting').durationMonths).toBe(6);
        expect(parseSeason('Operations Associate, Apprenticeship', 'This is a 6-month Apprenticeship Intern Program, starting in Jan 2027 and run'))
            .toEqual({ season: null, startMonth: month(2027, 1), durationMonths: 6, found: true });
    });
    it('#100 "Six month backend internship. Java, Spring and SQL": word numbers; Spring is not a season', () => {
        expect(parseSeason('Backend Engineering Intern', 'Six month backend internship. Java, Spring and SQL.')).toEqual({ season: null, startMonth: null, durationMonths: 6, found: true });
    });
    it('#72 / #101: experience and "ago" are not durations', () => {
        expect(parseSeason('Associate, Mid Market Sales', '- 6 months – 2 years experience in Sales Development').found).toBe(false);
        expect(parseSeason('Software Engineer Intern', 'Posted 6 months ago').found).toBe(false);
        expect(parseSeason('Intern', 'At least 6 months of experience with React').found).toBe(false);
    });
    it('a summer mentioned in passing does not count; "summer internship" does', () => {
        expect(parseSeason('Data Intern', 'We had a great summer offsite.').season).toBeNull();
        expect(parseSeason('Data Intern', 'This summer internship program includes a project.').season).toBe('SUMMER');
        expect(parseSeason('Winter Internship 2026 - SDE', '').season).toBe('WINTER');
    });
    it('nothing stated → all null', () => {
        expect(parseSeason('SDE Intern', 'Build APIs in Go.')).toEqual({ season: null, startMonth: null, durationMonths: null, found: false });
    });
    it('ignores impossible lengths', () => {
        expect(parseSeason('Intern', 'Duration: 36 months').durationMonths).toBeNull();
    });
});

describe('season on postings and in the search', () => {
    const raw = (title, employmentTypeText) => ({
        externalId: '1', title, companyName: 'Acme', locationText: 'Bengaluru, India', url: 'https://x.example/j/1',
        descriptionText: 'Duration: 6 months. Starting in Jan 2027.', workplaceText: null, employmentTypeText,
        compensationText: null, postedAt: null, deadline: null,
    });
    const company = { companyId: 7, uncertain: false };

    it('an internship gets the parsed values and a "season" flag for the reviewer', () => {
        const d = buildPostingData(raw('Winter Intern - SDE', 'Intern'), { relevance: { type: 'INTERNSHIP', location: 'india' }, company });
        expect(d).toMatchObject({ season: 'WINTER', startMonth: month(2027, 1), durationMonths: 6 });
        expect(d.uncertainFields).toContain('season');
    });
    it('a full-time role gets none', () => {
        const d = buildPostingData(raw('Software Engineer, Summer start', 'Full-time'), { relevance: { type: 'FULL_TIME', location: 'india' }, company });
        expect(d).toMatchObject({ season: null, startMonth: null, durationMonths: null });
        expect(d.uncertainFields).not.toContain('season');
    });
    it('filters: season and minimum length (only postings that state them)', () => {
        const where = baseWhere(postingsQuery.parse({ season: 'SUMMER', minDurationMonths: '6' }));
        expect(where.AND).toContainEqual({ season: 'SUMMER' });
        expect(where.AND).toContainEqual({ durationMonths: { gte: 6 } });
        expect(() => postingsQuery.parse({ season: 'SPRING' })).toThrow();
        expect(() => postingsQuery.parse({ minDurationMonths: '13' })).toThrow();
    });
});
