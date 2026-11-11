import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/db.js', () => ({ default: {} }));

const { siteOf, linkTrust } = await import('../../services/careers/links/linkTrust.js');
const { linkPostingData } = await import('../../services/careers/links/processSubmission.js');

describe('siteOf', () => {
    it.each([
        ['careers.acme.com', 'acme.com'],
        ['acme.com', 'acme.com'],
        ['www.flipkart.co.in', 'flipkart.co.in'],
        ['iitp.ac.in', 'iitp.ac.in'],
        ['jobs.lever.co', 'lever.co'],
        ['Boards.Greenhouse.io.', 'greenhouse.io'],
        ['localhost', 'localhost'],
    ])('%s -> %s', (host, site) => {
        expect(siteOf(host)).toBe(site);
    });
});

describe('linkTrust (B-02: a shared page must not vouch for itself)', () => {
    const named = { companyId: 1, uncertain: false, fromHost: false, website: null };

    it('the phishing case: Google named on an unrelated page, apply link on a third site', () => {
        const t = linkTrust({ pageUrl: 'https://jobs-portal.example/google-intern', applyUrl: 'https://login-google.evil.example/apply', company: { ...named, website: 'https://www.google.com' } });
        expect(t).toEqual({ applyUrl: 'https://jobs-portal.example/google-intern', applyUrlUncertain: true, companyUncertain: true });
    });
    it('keeps an apply link on the same site as the page (subdomains count)', () => {
        const t = linkTrust({ pageUrl: 'https://www.acme.com/careers/1', applyUrl: 'https://apply.acme.com/1', company: { ...named, website: 'https://acme.com' } });
        expect(t).toEqual({ applyUrl: 'https://apply.acme.com/1', applyUrlUncertain: false, companyUncertain: false });
    });
    it.each(['https://jobs.lever.co/acme/123', 'https://boards.greenhouse.io/acme/jobs/9', 'https://jobs.ashbyhq.com/acme/x'])('keeps an apply link on a known ATS: %s', (applyUrl) => {
        expect(linkTrust({ pageUrl: 'https://acme.com/careers/1', applyUrl, company: named }).applyUrlUncertain).toBe(false);
    });
    it('keeps an apply link on the company website, which also confirms the company', () => {
        const t = linkTrust({ pageUrl: 'https://peerlist.io/company/google/careers/x', applyUrl: 'https://careers.google.com/jobs/1', company: { ...named, website: 'https://google.com' } });
        expect(t).toEqual({ applyUrl: 'https://careers.google.com/jobs/1', applyUrlUncertain: false, companyUncertain: false });
    });
    it('no apply link -> the page itself, nothing flagged for the link', () => {
        expect(linkTrust({ pageUrl: 'https://acme.com/c/1', applyUrl: null, company: { ...named, website: 'https://acme.com' } }))
            .toEqual({ applyUrl: 'https://acme.com/c/1', applyUrlUncertain: false, companyUncertain: false });
    });
    it('an unreadable or non-http apply link -> the page, flagged', () => {
        for (const applyUrl of ['not a url', 'javascript:alert(1)']) {
            expect(linkTrust({ pageUrl: 'https://acme.com/c/1', applyUrl, company: named })).toMatchObject({ applyUrl: 'https://acme.com/c/1', applyUrlUncertain: true });
        }
    });
    it('a company named on the page with no website on record cannot be confirmed', () => {
        expect(linkTrust({ pageUrl: 'https://acme.com/c/1', applyUrl: null, company: named }).companyUncertain).toBe(true);
    });
    it('a company worked out from the page host itself needs no confirmation', () => {
        expect(linkTrust({ pageUrl: 'https://careers.acme-robotics.com/1', applyUrl: null, company: { ...named, fromHost: true } }).companyUncertain).toBe(false);
    });
    it('a malformed company website counts as no website', () => {
        expect(linkTrust({ pageUrl: 'https://acme.com/c/1', applyUrl: null, company: { ...named, website: 'acme' } }).companyUncertain).toBe(true);
    });
});

describe('linkPostingData (JSON-LD from a shared page)', () => {
    const raw = {
        externalId: 'x', title: 'Software Engineering Intern', companyName: 'Google', locationText: 'Bengaluru',
        url: 'https://login-google.evil.example/apply', descriptionText: 'Intern role', workplaceText: null,
        employmentTypeText: 'internship', compensationText: null, postedAt: null, deadline: null,
    };
    const google = { companyId: 1, uncertain: false, fromHost: false, website: 'https://google.com' };

    it('page JSON-LD naming Google with an off-site apply link -> page URL, company + link flagged, lower confidence', () => {
        const { raw: saved, data } = linkPostingData(raw, google, 'JSON_LD', 'https://jobs-portal.example/google');
        expect(data.applyUrl).toBe('https://jobs-portal.example/google');
        expect(saved.url).toBe('https://jobs-portal.example/google');
        expect(data.uncertainFields).toEqual(expect.arrayContaining(['company', 'applyUrl']));
        expect(data.extractionConfidence).toBeLessThan(0.8);
    });
    it('ATS data (no pageUrl) is trusted as before', () => {
        const { data } = linkPostingData({ ...raw, url: 'https://stripe.com/jobs/search?gh_jid=1' }, google, 'STRUCTURED');
        expect(data.applyUrl).toBe('https://stripe.com/jobs/search?gh_jid=1');
        expect(data.uncertainFields).not.toContain('company');
        expect(data.uncertainFields).not.toContain('applyUrl');
    });
});
