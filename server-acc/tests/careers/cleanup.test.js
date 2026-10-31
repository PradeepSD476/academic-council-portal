import { describe, it, expect } from 'vitest';
import { isTestHost, isTestCompanyName, isTestSourceName, cleanupPlan, assertNotProduction } from '../../services/careers/ops/cleanup.js';

describe('test-data cleanup (P8-T3, F-17)', () => {
    it('test hosts: reserved example domains, .test / .invalid / localhost, IP literals, wildcard-DNS hosts', () => {
        for (const u of ['https://example.com/jobs/1', 'http://www.example.org/', 'https://sub.example.net/x', 'http://a.test/', 'http://x.invalid', 'http://localhost:3000/a',
            'http://127.0.0.1/admin', 'http://169.254.169.254/latest/meta-data/', 'http://[::1]/', 'http://10-0-0-1.nip.io/', 'http://1.2.3.4.sslip.io/']) {
            expect(isTestHost(u), u).toBe(true);
        }
        for (const u of ['https://boards.greenhouse.io/stripe/jobs/1', 'https://iiitb.ac.in/summer-internship', 'https://notexample.com/', 'https://example.company.com/', 'not a url', '']) {
            expect(isTestHost(u), u).toBe(false);
        }
    });
    it('test company names end in "Test <run timestamp>"; real names with "Test" in them are kept', () => {
        expect(isTestCompanyName('Acme Robotics Test 1790857879821')).toBe(true);
        expect(isTestCompanyName('Testbook')).toBe(false);
        expect(isTestCompanyName('Test Yantra')).toBe(false);
        expect(isTestCompanyName('Acme Robotics')).toBe(false);
    });
    it('test sources are named "test" or "bogus" as a whole word', () => {
        expect(isTestSourceName('Bogus test board')).toBe(true);
        expect(isTestSourceName('Testbook (lever)')).toBe(false);
        expect(isTestSourceName('Stripe (greenhouse)')).toBe(false);
    });

    const data = {
        companies: [
            { id: 1, name: 'Acme Robotics Test 1790857879821', experiences: 0, sources: 0, inMergeLog: false },
            { id: 2, name: 'Acme Robotics Test 1790857891350', experiences: 1, sources: 0, inMergeLog: false },
            { id: 3, name: 'Acme Robotics Test 1790857863300', experiences: 0, sources: 0, inMergeLog: true },
        ],
        postings: [
            { id: 10, roleTitle: 'Robotics Intern', companyId: 1, applyUrl: 'https://example.com/jobs/1', status: 'EXPIRED' },
            { id: 11, roleTitle: 'Manual Test Intern', companyId: 9, applyUrl: 'https://example.com/jobs/1-3', status: 'EXPIRED' },
            { id: 12, roleTitle: 'SDE Intern', companyId: 2, applyUrl: 'https://boards.greenhouse.io/x/1', status: 'LIVE' },
            { id: 13, roleTitle: 'Real role', companyId: 9, applyUrl: 'https://jobs.lever.co/paytm/1', status: 'LIVE' },
        ],
        sources: [
            { id: 20, name: 'Bogus test board', observations: 0 },
            { id: 21, name: 'Old test board', observations: 4 },
            { id: 22, name: 'Stripe (greenhouse)', observations: 18 },
        ],
        links: [
            { id: 30, url: 'http://127.0.0.1/admin', postingId: null },
            { id: 31, url: 'https://example.com/', postingId: null },
            { id: 32, url: 'https://example.com/p', postingId: 13 },
            { id: 33, url: 'https://iiitb.ac.in/summer-internship', postingId: null },
        ],
    };

    it('plans postings on test hosts or of test companies; keeps everything else', () => {
        const plan = cleanupPlan(data);
        expect(plan.postings.map((p) => p.id)).toEqual([10, 11]);
        expect(plan.companies.map((c) => c.id)).toEqual([1]);
        expect(plan.sources.map((s) => s.id)).toEqual([20]);
        expect(plan.links.map((l) => l.id)).toEqual([30, 31]);
    });
    it('skips (and says why) a test company with experiences or merge history, and a test source with observations', () => {
        const why = Object.fromEntries(cleanupPlan(data).skipped.map((s) => [`${s.kind}${s.id}`, s.why]));
        expect(why.company2).toMatch(/experience/);
        expect(why.company3).toMatch(/merge/);
        expect(why.source21).toMatch(/observation/);
        expect(why.link32).toMatch(/posting/);
        // A posting of a skipped company stays unless its own URL is a test URL.
        expect(cleanupPlan(data).postings.some((p) => p.id === 12)).toBe(false);
    });
    it('refuses to run in production', () => {
        expect(() => assertNotProduction({ NODE_ENV: 'production' })).toThrow(/production/);
        expect(() => assertNotProduction({ NODE_ENV: 'development' })).not.toThrow();
        expect(() => assertNotProduction({})).not.toThrow();
    });
});
