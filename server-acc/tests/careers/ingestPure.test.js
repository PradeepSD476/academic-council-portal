import { describe, it, expect } from 'vitest';
import { isSamePosting, findPossibleDuplicates } from '../../services/careers/ingest/dedup.js';
import { nextHealth } from '../../services/careers/ingest/health.js';
import { statusWhenSeen, shouldExpire } from '../../services/careers/ingest/liveness.js';
import { buildPostingData, resolveType, compensationFields, confidenceFor } from '../../services/careers/ingest/buildPosting.js';
import { evaluateRelevance } from '../../services/careers/text/relevance.js';
import { simhash64 } from '../../services/careers/text/fingerprint.js';

const JD = `Join our payments platform team as an intern. You will build backend services in Java and Go,
write well tested code, review pull requests, and work with product managers to ship features used by
millions of merchants across India. Requirements: data structures, algorithms, SQL, and clear communication.`;
const OTHER_JD = `Mechanical design engineer for turbine blades using ANSYS and SolidWorks, finite element
analysis of rotating parts, and manufacturing drawings for the foundry in Pune.`;

const p = (over = {}) => ({
    roleTitleNormalized: 'software engineer intern', locationNormalized: 'bengaluru', contentFingerprint: simhash64(JD), ...over,
});

describe('isSamePosting', () => {
    it('same title and same location', () => {
        expect(isSamePosting(p(), p({ contentFingerprint: simhash64(OTHER_JD) }))).toBe(true);
    });
    it('same title and one location unknown', () => {
        expect(isSamePosting(p(), p({ locationNormalized: null, contentFingerprint: simhash64(OTHER_JD) }))).toBe(true);
    });
    it('same title in different cities with different descriptions is two jobs', () => {
        expect(isSamePosting(p(), p({ locationNormalized: 'hyderabad', contentFingerprint: simhash64(OTHER_JD) }))).toBe(false);
    });
    it('near-identical description and similar title', () => {
        expect(isSamePosting(p(), p({ roleTitleNormalized: 'software engineering intern', locationNormalized: 'pune' }))).toBe(true);
    });
    it('near-identical description but a different title is not enough', () => {
        expect(isSamePosting(p(), p({ roleTitleNormalized: 'product design intern', locationNormalized: 'pune' }))).toBe(false);
    });
    it('an internship never matches a full-time role', () => {
        expect(isSamePosting(p(), p({ roleTitleNormalized: 'software engineer' }))).toBe(false);
    });
    it('missing titles never match', () => {
        expect(isSamePosting(p({ roleTitleNormalized: '' }), p({ roleTitleNormalized: '' }))).toBe(false);
    });
    it('findPossibleDuplicates reports pairs with ids and titles', () => {
        const rows = [
            { id: 1, roleTitle: 'SWE Intern', ...p() },
            { id: 2, roleTitle: 'Data Analyst', ...p({ roleTitleNormalized: 'data analyst', contentFingerprint: simhash64(OTHER_JD) }) },
            { id: 3, roleTitle: 'Software Engineer Intern', ...p({ locationNormalized: null }) },
        ];
        expect(findPossibleDuplicates(rows)).toEqual([{ postingIds: [1, 3], roleTitles: ['SWE Intern', 'Software Engineer Intern'] }]);
    });
});

describe('nextHealth', () => {
    const now = new Date('2026-09-30T00:00:00Z');
    const source = { isEnabled: true, consecutiveFailures: 2 };
    it('a thrown run -> FAILING, failures + 1, error kept', () => {
        expect(nextHealth(source, { error: new Error('HTTP 404 for https://x') }, now)).toEqual({
            health: 'FAILING', lastRunAt: now, consecutiveFailures: 3, lastError: 'HTTP 404 for https://x',
        });
    });
    it('0 jobs fetched -> ZERO_RESULTS (a success, but suspicious)', () => {
        expect(nextHealth(source, { fetchedCount: 0, keptCount: 0 }, now)).toMatchObject({ health: 'ZERO_RESULTS', consecutiveFailures: 0, lastSuccessAt: now });
    });
    it('jobs fetched -> OK, counts recorded, error cleared', () => {
        expect(nextHealth(source, { fetchedCount: 40, keptCount: 3 }, now)).toEqual({
            health: 'OK', lastRunAt: now, lastSuccessAt: now, lastFetchedCount: 40, lastKeptCount: 3, consecutiveFailures: 0, lastError: null,
        });
    });
    it('disabled source -> DISABLED', () => {
        expect(nextHealth({ isEnabled: false }, { fetchedCount: 5 }, now)).toEqual({ health: 'DISABLED' });
    });
    it('long errors are truncated', () => {
        expect(nextHealth(source, { error: 'x'.repeat(5000) }, now).lastError).toHaveLength(2000);
    });
});

describe('liveness decisions', () => {
    it('an expired posting that reappears on its board goes back to LIVE if it was approved before', () => {
        expect(statusWhenSeen({ status: 'EXPIRED', publishedAt: new Date() }, false)).toBe('LIVE');
    });
    it('...and back to review if it never was', () => {
        expect(statusWhenSeen({ status: 'EXPIRED', publishedAt: null }, false)).toBe('PENDING_REVIEW');
    });
    it('an admin-expired posting still listed on the board stays expired', () => {
        expect(statusWhenSeen({ status: 'EXPIRED', publishedAt: new Date() }, true)).toBe('EXPIRED');
    });
    it('REJECTED is never re-queued', () => {
        expect(statusWhenSeen({ status: 'REJECTED', publishedAt: null }, false)).toBe('REJECTED');
    });
    it('expires only when every observation is gone', () => {
        expect(shouldExpire({ status: 'LIVE' }, [{ isLive: false }, { isLive: false }])).toBe(true);
        expect(shouldExpire({ status: 'LIVE' }, [{ isLive: false }, { isLive: true }])).toBe(false);
        expect(shouldExpire({ status: 'PENDING_REVIEW' }, [{ isLive: false }])).toBe(true);
        expect(shouldExpire({ status: 'REJECTED' }, [{ isLive: false }])).toBe(false);
        expect(shouldExpire({ status: 'LIVE' }, [])).toBe(false);
    });
});

describe('buildPostingData', () => {
    const raw = {
        externalId: '42', title: ' Software Engineer Intern ', companyName: 'Acme', locationText: 'Bangalore, India',
        url: 'https://boards.greenhouse.io/acme/jobs/42', descriptionText: JD, workplaceText: 'Hybrid',
        employmentTypeText: null, compensationText: '₹40,000 - 60,000 per month', postedAt: '2026-09-01T00:00:00Z',
        deadline: '2026-10-15',
    };
    const build = (over = {}, company = { companyId: 7, uncertain: false }) => {
        const r = { ...raw, ...over };
        return buildPostingData(r, { relevance: evaluateRelevance(r), company });
    };

    it('sets eligibility to [] (not stated), never leaves it NULL', () => {
        expect(build()).toMatchObject({ eligibleBranches: [], eligibleYears: [] });
    });

    it('maps a clean internship with full confidence', () => {
        const d = build();
        expect(d).toMatchObject({
            companyId: 7, roleTitle: 'Software Engineer Intern', roleTitleNormalized: 'software engineer intern',
            type: 'INTERNSHIP', location: 'Bangalore, India', locationNormalized: 'bengaluru', workMode: 'HYBRID',
            stipendMin: 40000, stipendMax: 60000, stipendDisclosure: 'RANGE', ctcDisclosure: 'NOT_DISCLOSED',
            compCurrency: 'INR', applyUrl: raw.url, extractionTier: 'STRUCTURED', extractionConfidence: 1, uncertainFields: [],
        });
        expect(d.skills).toEqual(expect.arrayContaining(['Java', 'SQL']));
        expect(d.contentFingerprint).toMatch(/^[0-9a-f]{16}$/);
        expect(d.deadlineStated.toISOString()).toBe('2026-10-15T00:00:00.000Z');
    });
    it('no pay text -> NOT_DISCLOSED with null amounts, never 0', () => {
        expect(build({ compensationText: null })).toMatchObject({
            stipendMin: null, stipendMax: null, stipendDisclosure: 'NOT_DISCLOSED', compensationRaw: null,
        });
    });
    it('pay without a period -> UNCLEAR, raw text kept, flagged', () => {
        const d = build({ compensationText: 'Stipend: 1.2L' });
        expect(d).toMatchObject({ stipendDisclosure: 'UNCLEAR', stipendMin: null, compensationRaw: 'Stipend: 1.2L' });
        expect(d.uncertainFields).toEqual(['compensation']);
        expect(d.extractionConfidence).toBe(0.85);
    });
    it('non-geographic location, unknown type and a candidate company are all flagged', () => {
        const d = build({ title: 'Associate', locationText: 'Hybrid', compensationText: null }, { companyId: 9, uncertain: true });
        expect(d.type).toBe('UNKNOWN');
        expect(d.uncertainFields).toEqual(['type', 'location', 'company']);
        expect(d.extractionConfidence).toBe(0.55);
    });
    it('missing location is flagged and stored as null', () => {
        expect(build({ locationText: null })).toMatchObject({ location: null, locationNormalized: null, uncertainFields: ['location'] });
    });
    it('an invalid deadline is dropped, not guessed', () => {
        expect(build({ deadline: 'soon' }).deadlineStated).toBeNull();
        expect(build({ deadline: null }).deadlineStated).toBeNull();
    });
    it('full-time pay is parsed as CTC', () => {
        const d = build({ title: 'Graduate Engineer', compensationText: '12-18 LPA' });
        expect(d).toMatchObject({ type: 'FULL_TIME', ctcMin: 1200000, ctcMax: 1800000, ctcDisclosure: 'RANGE', stipendDisclosure: 'NOT_DISCLOSED' });
    });
});

describe('resolveType / compensationFields / confidenceFor', () => {
    it.each([
        ['INTERNSHIP', null, 'INTERNSHIP'],
        ['UNKNOWN', 'Intern', 'INTERNSHIP'],
        ['FULL_TIME', 'Internship', 'INTERNSHIP'],
        ['UNKNOWN', 'Full-time', 'FULL_TIME'],
        ['FULL_TIME', null, 'FULL_TIME'],
        ['UNKNOWN', 'Contract', 'UNKNOWN'],
        ['UNKNOWN', null, 'UNKNOWN'],
    ])('relevance %s + employment %s -> %s', (rel, emp, expected) => {
        expect(resolveType(rel, emp)).toBe(expected);
    });
    it('unpaid internship is the one real 0', () => {
        expect(compensationFields('Unpaid internship', 'INTERNSHIP')).toMatchObject({ stipendMin: 0, stipendMax: 0, stipendDisclosure: 'DISCLOSED' });
    });
    it('foreign currency is kept', () => {
        expect(compensationFields('$5000/month', 'INTERNSHIP')).toMatchObject({ compCurrency: 'USD', stipendMin: 5000 });
    });
    it('confidence drops 0.15 per uncertain field and never goes below 0', () => {
        expect(confidenceFor([])).toBe(1);
        expect(confidenceFor(['type', 'location'])).toBe(0.7);
        expect(confidenceFor(Array(8).fill('x'))).toBe(0);
    });
});

describe('zero is not pay', () => {
    it('a 0 amount without "unpaid" is NOT_DISCLOSED, never DISCLOSED 0', () => {
        expect(compensationFields('INR 0 per year', 'FULL_TIME')).toMatchObject({ ctcMin: null, ctcDisclosure: 'NOT_DISCLOSED', compensationRaw: 'INR 0 per year' });
        expect(compensationFields('₹0 per month', 'INTERNSHIP')).toMatchObject({ stipendMin: null, stipendDisclosure: 'NOT_DISCLOSED' });
    });
});
