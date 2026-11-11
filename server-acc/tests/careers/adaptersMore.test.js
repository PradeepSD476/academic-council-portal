import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import * as sr from '../../services/careers/ingest/adapters/smartrecruiters.js';
import * as wk from '../../services/careers/ingest/adapters/workable.js';
import { adapterFor } from '../../services/careers/ingest/adapters/index.js';
import { evaluateRelevance } from '../../services/careers/text/relevance.js';
import { detectWorkMode } from '../../services/careers/text/workMode.js';

const fixture = (name) => JSON.parse(fs.readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
const srList = fixture('smartrecruiters.json');
const srDetails = fixture('smartrecruiters_detail.json');
const wkList = fixture('workable.json');
const wkDetail = fixture('workable_detail.json');

describe('SmartRecruiters adapter (F-24), Swiggy board seen 10 Oct 2026', () => {
    it('is registered', () => expect(adapterFor('SMARTRECRUITERS')).toBe(sr));
    it('maps a list item without opening it', () => {
        const raw = sr.mapJob(srList.content[0]);
        expect(raw).toMatchObject({
            externalId: '6000000001476174', title: 'Software Dev Engineer I', companyName: null, locationText: 'Bengaluru, KA, India',
            url: 'https://jobs.smartrecruiters.com/SWIGGY/6000000001476174', descriptionText: null, employmentTypeText: 'Full-time', deadline: null,
        });
    });
    it('the detail gives the posting URL and the description (job, qualifications, additional info; no company blurb)', () => {
        const raw = sr.mapJob(srList.content[0], srDetails['6000000001476174']);
        expect(raw.url).toBe('https://jobs.smartrecruiters.com/SWIGGY/6000000001476174-software-dev-engineer-i');
        expect(raw.descriptionText).toContain('Job Description');
        expect(raw.descriptionText).toContain('Qualifications');
        expect(raw.descriptionText).not.toContain('Company Description');
        expect(raw.descriptionText).not.toMatch(/<[a-z]/i);
    });
    it('fetchAll opens only the jobs whose title passes the relevance rules', async () => {
        const getJson = vi.fn(async (url) => (url.includes('/postings?') ? srList : srDetails[url.split('/').pop()]));
        const out = await sr.fetchAll({ boardToken: 'Swiggy' }, { getJson });
        expect(out.fetchedCount).toBe(4);
        const opened = getJson.mock.calls.map(([u]) => u).filter((u) => !u.includes('?'));
        const keep = srList.content.filter((j) => evaluateRelevance(sr.mapJob(j)).keep).map((j) => j.id);
        expect(opened.map((u) => u.split('/').pop())).toEqual(keep);
        expect(keep).toContain('6000000001476174'); // "Engineer I"
        expect(out.jobs.find((j) => j.externalId === '6000000001476174').descriptionText).toContain('Job Description');
        expect(out.jobs.find((j) => j.title === 'Senior Strategic Account Manager').descriptionText).toBeNull();
        expect(getJson.mock.calls[0][0]).toBe('https://api.smartrecruiters.com/v1/companies/Swiggy/postings?limit=100&offset=0&country=in');
    });
    it('pages through long lists', async () => {
        const page = (n) => ({ totalFound: 150, content: Array.from({ length: n }, (_, i) => ({ id: `x${n}${i}`, name: 'Senior Manager', company: { identifier: 'A' } })) });
        const getJson = vi.fn().mockResolvedValueOnce(page(100)).mockResolvedValueOnce(page(50));
        const out = await sr.fetchAll({ boardToken: 'A' }, { getJson });
        expect(out.fetchedCount).toBe(150);
        expect(getJson.mock.calls[1][0]).toContain('offset=100');
    });
});

describe('Workable adapter (F-24), leena-ai board seen 10 Oct 2026', () => {
    it('is registered', () => expect(adapterFor('WORKABLE')).toBe(wk));
    it('maps a list item', () => {
        const raw = wk.mapJob(wkList.results[0], null, { boardToken: 'leena-ai' });
        expect(raw).toMatchObject({
            externalId: 'D2E4D92832', title: 'Integration Architect (Workday)', locationText: 'Gurugram, Haryana, India',
            url: 'https://apply.workable.com/leena-ai/j/D2E4D92832/', workplaceText: 'onsite', employmentTypeText: 'Full-time', descriptionText: null,
        });
        expect(detectWorkMode({ workplaceText: raw.workplaceText })).toBe('ONSITE');
        expect(wk.mapJob(wkList.results[1], null, { boardToken: 'leena-ai' }).workplaceText).toBe('remote');
    });
    it('the detail gives description + requirements + benefits as text', () => {
        const raw = wk.mapJob(wkList.results[0], wkDetail, { boardToken: 'leena-ai' });
        expect(raw.descriptionText).toContain('About the Role');
        expect(raw.descriptionText).toContain('8+ years of total experience');
        expect(raw.descriptionText).not.toMatch(/<[a-z]/i);
    });
    it('salary fields become pay text only when given', () => {
        expect(wk.mapJob(wkList.results[0], { ...wkDetail, salary_from: 50000, salary_to: 60000, salary_currency_iso_code: 'INR', salary_frequency: 'month' }, { boardToken: 'x' }).compensationText).toBe('INR 50000 - 60000 per month');
        expect(wk.mapJob(wkList.results[0], wkDetail, { boardToken: 'x' }).compensationText).toBe('INR 5000000 - 6000000 per year'); // as on the real job
        expect(wk.mapJob(wkList.results[0], { ...wkDetail, salary_from: null, salary_to: null }, { boardToken: 'x' }).compensationText).toBeNull();
    });
    it('fetchAll POSTs the list query and opens only relevant titles (none on this board)', async () => {
        const page2 = { total: 11, results: [{ ...wkList.results[1], shortcode: '6DB727B53E', title: 'Enterprise Sales Development Representative - US' }] };
        const getJson = vi.fn(async (url, opts) => (opts?.body?.token ? page2 : wkList));
        const out = await wk.fetchAll({ boardToken: 'leena-ai' }, { getJson });
        expect(getJson).toHaveBeenCalledTimes(2);
        expect(getJson.mock.calls[0]).toEqual(['https://apply.workable.com/api/v3/accounts/leena-ai/jobs', { body: wk.LIST_BODY }]);
        expect(getJson.mock.calls[1][1].body).toEqual({ ...wk.LIST_BODY, token: wkList.nextPage }); // as verified live
        expect(out.fetchedCount).toBe(11);
        expect(out.jobs.every((j) => j.descriptionText === null)).toBe(true);
    });
    it('opens a relevant one', async () => {
        const list = { results: [{ ...wkList.results[0], title: 'Software Engineer Intern' }] }; // no nextPage
        const getJson = vi.fn(async (url) => (url.endsWith('/jobs') ? list : wkDetail));
        const out = await wk.fetchAll({ boardToken: 'leena-ai' }, { getJson });
        expect(getJson.mock.calls[1][0]).toBe('https://apply.workable.com/api/v2/accounts/leena-ai/jobs/D2E4D92832');
        expect(out.jobs[0].descriptionText).toContain('About the Role');
    });
});
