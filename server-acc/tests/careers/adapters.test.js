import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import * as greenhouse from '../../services/careers/ingest/adapters/greenhouse.js';
import * as lever from '../../services/careers/ingest/adapters/lever.js';
import * as ashby from '../../services/careers/ingest/adapters/ashby.js';
import { fetchPostings } from '../../services/careers/ingest/adapters/index.js';
import { parseCompensation } from '../../services/careers/text/compensation.js';

// Trimmed real responses saved by scripts/careers/verifyBoard.js --save (30 Sep 2026).
const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8'));

const RAW_KEYS = ['externalId', 'title', 'companyName', 'locationText', 'url', 'descriptionText', 'workplaceText',
    'employmentTypeText', 'compensationText', 'postedAt', 'deadline'].sort();

function expectWellFormed(raw) {
    expect(Object.keys(raw).sort()).toEqual(RAW_KEYS);
    expect(raw.externalId).toMatch(/\S/);
    expect(raw.title).toBe(raw.title.trim());
    expect(raw.url).toMatch(/^https:\/\//);
    expect(raw.descriptionText.length).toBeGreaterThan(50);
    expect(raw.descriptionText).not.toMatch(/<\/?(p|div|span|br|li)\b|&lt;|&amp;nbsp;/i); // plain text, entities decoded
}

describe('greenhouse adapter (real fixture: rubrik)', () => {
    const body = fixture('greenhouse');
    const jobs = greenhouse.jobsFrom(body);
    it('reads jobs[] and maps every job to a well-formed RawPosting', () => {
        expect(jobs.length).toBe(3);
        for (const job of jobs) {
            const raw = greenhouse.mapJob(job);
            expectWellFormed(raw);
            expect(raw.externalId).toBe(String(job.id));
            expect(raw.url).toBe(job.absolute_url);
            expect(raw.locationText).toContain(job.location.name.trim());
            expect(raw.deadline).toBe(job.application_deadline ?? null);
        }
    });
    it('merges location.name with office locations (e.g. "Hybrid" + real cities)', () => {
        const raw = greenhouse.mapJob({
            id: 1, title: 'Analyst', absolute_url: 'https://x.test/1', content: '&lt;p&gt;Hi&lt;/p&gt;',
            location: { name: 'Hybrid' }, offices: [{ location: 'Bengaluru, India' }, { name: 'Hybrid' }],
        });
        expect(raw.locationText).toBe('Hybrid; Bengaluru, India');
        expect(raw.descriptionText).toBe('Hi');
    });
    it('reads pay and employment type from custom metadata when present', () => {
        const raw = greenhouse.mapJob({
            id: 2, title: 'Intern', absolute_url: 'https://x.test/2', content: '',
            metadata: [{ name: 'Employment Type', value: 'Internship' }, { name: 'Stipend', value: '₹40,000 per month' }],
        });
        expect(raw.employmentTypeText).toBe('Internship');
        expect(parseCompensation(raw.compensationText)).toMatchObject({ min: 40000, disclosure: 'DISCLOSED' });
    });
});

describe('lever adapter (real fixture: paytm)', () => {
    const jobs = lever.jobsFrom(fixture('lever'));
    it('reads the top-level array and maps every job', () => {
        expect(jobs.length).toBe(3);
        for (const job of jobs) {
            const raw = lever.mapJob(job);
            expectWellFormed(raw);
            expect(raw.externalId).toBe(job.id);
            expect(raw.title).toBe(job.text.trim());
            expect(raw.url).toBe(job.hostedUrl);
            expect(raw.employmentTypeText).toBe(job.categories.commitment ?? null);
            expect(new Date(raw.postedAt).getTime()).toBe(job.createdAt);
        }
    });
    it('turns salaryRange into text the compensation parser understands', () => {
        const raw = lever.mapJob({
            id: 'a', text: 'Intern', hostedUrl: 'https://x.test/a', descriptionPlain: 'd', categories: {},
            salaryRange: { min: 30000, max: 45000, currency: 'INR', interval: 'per-month-salary' },
        });
        expect(raw.compensationText).toBe('INR 30000 - 45000 per month');
        expect(parseCompensation(raw.compensationText)).toMatchObject({ min: 30000, max: 45000, disclosure: 'RANGE' });
    });
    it('treats workplaceType "unspecified" as unknown', () => {
        expect(lever.mapJob({ id: 'b', text: 't', hostedUrl: 'https://x.test/b', categories: {}, workplaceType: 'unspecified' }).workplaceText).toBeNull();
    });
    it('includes requirement lists in the description', () => {
        const raw = lever.mapJob({
            id: 'c', text: 't', hostedUrl: 'https://x.test/c', descriptionPlain: 'About us.', categories: {},
            lists: [{ text: 'Requirements', content: '<li>Python</li><li>SQL</li>' }],
        });
        expect(raw.descriptionText).toBe('About us.\n\nRequirements\n- Python\n- SQL');
    });
});

describe('ashby adapter (real fixture: sarvam)', () => {
    const jobs = ashby.jobsFrom(fixture('ashby'));
    it('reads jobs[] and maps every job', () => {
        expect(jobs.length).toBe(3);
        for (const job of jobs) {
            const raw = ashby.mapJob(job);
            expectWellFormed(raw);
            expect(raw.externalId).toBe(job.id);
            expect(raw.url).toBe(job.jobUrl);
            expect(raw.employmentTypeText).toBe(job.employmentType);
            expect(raw.locationText).toContain(job.location);
        }
    });
    it('skips unlisted jobs', () => {
        expect(ashby.jobsFrom({ jobs: [{ id: 1, isListed: false }, { id: 2, isListed: true }, { id: 3 }] }).map((j) => j.id)).toEqual([2, 3]);
    });
    it('marks remote-eligible roles and joins secondary locations', () => {
        const raw = ashby.mapJob({ id: 'r', title: 't', jobUrl: 'https://x.test/r', descriptionPlain: 'd', location: 'Bengaluru', secondaryLocations: [{ location: 'Hyderabad' }], isRemote: true });
        expect(raw.locationText).toBe('Bengaluru; Hyderabad; Remote');
    });
    it('only exposes pay when the company chose to display it', () => {
        const job = { id: 'p', title: 't', jobUrl: 'https://x.test/p', descriptionPlain: 'd', compensation: { compensationTierSummary: '₹12L – ₹18L' } };
        expect(ashby.mapJob({ ...job, shouldDisplayCompensationOnJobPostings: false }).compensationText).toBeNull();
        expect(ashby.mapJob({ ...job, shouldDisplayCompensationOnJobPostings: true }).compensationText).toBe('₹12L – ₹18L');
    });
});

describe('fetchPostings', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('fetches, maps, and skips jobs missing an id, title or url', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
            jobs: [
                { id: 1, title: 'Intern', absolute_url: 'https://x.test/1', content: '' },
                { id: 2, title: '', absolute_url: 'https://x.test/2', content: '' },
            ],
        }), { status: 200 })));
        const result = await fetchPostings({ kind: 'GREENHOUSE', boardToken: 'acme' });
        expect(result.fetchedCount).toBe(2);
        expect(result.skipped).toBe(1);
        expect(result.postings.map((p) => p.externalId)).toEqual(['1']);
        expect(fetch.mock.calls[0][0]).toBe('https://boards-api.greenhouse.io/v1/boards/acme/jobs?content=true');
        expect(fetch.mock.calls[0][1].headers['User-Agent']).toMatch(/ACC-IITP-CareerVault/);
    });
    it('throws on 404 without retrying (bad board token)', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response('not found', { status: 404 })));
        await expect(fetchPostings({ kind: 'LEVER', boardToken: 'nope' })).rejects.toThrow('HTTP 404');
        expect(fetch).toHaveBeenCalledTimes(1);
    });
    it('retries once on a 5xx', async () => {
        vi.stubGlobal('fetch', vi.fn()
            .mockResolvedValueOnce(new Response('oops', { status: 503 }))
            .mockResolvedValueOnce(new Response('[]', { status: 200 })));
        const result = await fetchPostings({ kind: 'LEVER', boardToken: 'acme' });
        expect(result.fetchedCount).toBe(0);
        expect(fetch).toHaveBeenCalledTimes(2);
    });
    it('rejects an unknown source kind', async () => {
        await expect(fetchPostings({ kind: 'MANUAL', boardToken: null })).rejects.toThrow('No ATS adapter');
    });
});
