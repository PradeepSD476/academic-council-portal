import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { isBlockedAddress } from '../../services/careers/links/ipGuard.js';
import { canonicalUrl } from '../../services/careers/links/canonicalUrl.js';
import { isBlockedDomain } from '../../services/careers/links/blockedDomains.js';
import { parseAtsLink } from '../../services/careers/links/atsLink.js';
import { extractJsonLd } from '../../services/careers/links/jsonLd.js';
import { checkUrl, makeGuardedLookup } from '../../services/careers/links/safeFetch.js';
import { parseCompensation } from '../../services/careers/text/compensation.js';

describe('ipGuard: every blocked range (Architecture 7a)', () => {
    it.each([
        ['0.0.0.0/8', '0.1.2.3'], ['10/8', '10.0.0.1'], ['10/8 top', '10.255.255.255'], ['100.64/10', '100.64.0.1'], ['100.64/10 top', '100.127.255.254'],
        ['127/8', '127.0.0.1'], ['127/8 other', '127.53.1.1'], ['169.254/16 metadata', '169.254.169.254'], ['172.16/12', '172.16.0.5'], ['172.16/12 top', '172.31.255.255'],
        ['192.0.0/24', '192.0.0.8'], ['192.168/16', '192.168.1.1'], ['198.18/15', '198.18.0.1'], ['198.18/15 top', '198.19.255.255'],
        ['224/4 multicast', '224.0.0.1'], ['240/4 reserved', '240.0.0.1'], ['broadcast', '255.255.255.255'],
        ['::', '::'], ['::1', '::1'], ['fc00::/7', 'fc00::1'], ['fd00::/8', 'fd12:3456::1'], ['fe80::/10', 'fe80::1'], ['fe80 with zone', 'fe80::1%eth0'],
        ['mapped 127', '::ffff:127.0.0.1'], ['mapped 10 (hex)', '::ffff:a00:1'], ['mapped metadata', '::ffff:169.254.169.254'], ['compatible 10', '::10.0.0.1'],
        ['ff00::/8 multicast', 'ff02::1'], ['not an IP', 'localhost'], ['empty', ''],
    ])('blocks %s (%s)', (_, ip) => {
        expect(isBlockedAddress(ip)).toBe(true);
    });
    it.each([
        ['public v4', '8.8.8.8'], ['just below 10/8', '9.255.255.255'], ['just outside 172.16/12', '172.32.0.1'], ['just outside 100.64/10', '100.128.0.1'],
        ['public 169.x', '169.253.1.1'], ['192.0.2 (docs, not listed)', '192.0.2.1'], ['public v6', '2606:4700:4700::1111'], ['mapped public', '::ffff:8.8.8.8'],
    ])('allows %s (%s)', (_, ip) => {
        expect(isBlockedAddress(ip)).toBe(false);
    });
});

describe('safeFetch URL checks (no network)', () => {
    it.each([
        ['http://127.0.0.1/', 'BLOCKED_ADDRESS'], ['http://169.254.169.254/latest/meta-data/', 'BLOCKED_ADDRESS'], ['http://[::1]/', 'BLOCKED_ADDRESS'],
        ['http://10.1.2.3/', 'BLOCKED_ADDRESS'], ['ftp://example.com/x', 'BLOCKED_URL'], ['file:///etc/passwd', 'BLOCKED_URL'],
        ['http://example.com:8080/', 'BLOCKED_URL'], ['https://user:pw@example.com/', 'BLOCKED_URL'], [`https://example.com/${'a'.repeat(2100)}`, 'BLOCKED_URL'],
    ])('%s -> %s', (url, code) => {
        expect(() => checkUrl(url)).toThrow(expect.objectContaining({ code }));
    });
    it('a public https URL passes', () => {
        expect(checkUrl('https://example.com/jobs/1').hostname).toBe('example.com');
    });
});

describe('guarded DNS lookup (rebinding-safe: checked at connect time)', () => {
    const fakeResolver = (answers) => (host, opts, cb) => cb(null, answers[host] ?? []);
    const resolver = fakeResolver({
        'internal.example': [{ address: '10.0.0.7', family: 4 }],
        'mixed.example': [{ address: '93.184.216.34', family: 4 }, { address: '192.168.0.10', family: 4 }],
        'ok.example': [{ address: '93.184.216.34', family: 4 }],
    });
    const lookup = makeGuardedLookup(resolver);
    const run = (host, opts) => new Promise((resolve) => lookup(host, opts, (err, address, family) => resolve({ err, address, family })));

    it('refuses a hostname resolving to 10.x', async () => {
        const { err } = await run('internal.example', {});
        expect(err.code).toBe('BLOCKED_ADDRESS');
    });
    it('refuses when any resolved address is private', async () => {
        expect((await run('mixed.example', {})).err.code).toBe('BLOCKED_ADDRESS');
    });
    it('passes a public address (single and all:true forms)', async () => {
        expect(await run('ok.example', {})).toMatchObject({ err: null, address: '93.184.216.34', family: 4 });
        expect((await run('ok.example', { all: true })).address).toEqual([{ address: '93.184.216.34', family: 4 }]);
    });
});

describe('canonicalUrl', () => {
    it('drops tracking params, fragments, trailing slashes; lower-cases the host; sorts params', () => {
        expect(canonicalUrl(' HTTPS://Careers.Example.COM/jobs/42/?utm_source=x&b=2&a=1&gclid=z#apply ')).toBe('https://careers.example.com/jobs/42?a=1&b=2');
    });
    it('keeps meaningful params (e.g. gh_jid)', () => {
        expect(canonicalUrl('https://stripe.com/jobs/search?gh_jid=8031833&gh_src=abc')).toBe('https://stripe.com/jobs/search?gh_jid=8031833');
    });
    it.each(['javascript:alert(1)', 'mailto:a@b.c', 'not a url', '', 'https://user:pw@example.com'])('rejects %s', (u) => {
        expect(canonicalUrl(u)).toBeNull();
    });
});

describe('blockedDomains', () => {
    it.each(['www.linkedin.com', 'in.linkedin.com', 'lnkd.in', 'www.naukri.com', 'in.indeed.com', 'www.indeed.co.uk', 'glassdoor.co.in', 'internshala.com', 'unstop.com'])('store-only: %s', (h) => {
        expect(isBlockedDomain(h)).toBe(true);
    });
    it.each(['boards.greenhouse.io', 'careers.google.com', 'notlinkedin.com'])('fetchable: %s', (h) => {
        expect(isBlockedDomain(h)).toBe(false);
    });
});

describe('parseAtsLink', () => {
    it.each([
        ['https://boards.greenhouse.io/stripe/jobs/8031833', { kind: 'GREENHOUSE', boardToken: 'stripe', jobId: '8031833' }],
        ['https://job-boards.greenhouse.io/rubrik/jobs/8166537?gh_src=x', { kind: 'GREENHOUSE', boardToken: 'rubrik', jobId: '8166537' }],
        ['https://boards.greenhouse.io/embed/job_app?for=groww&token=7000001', { kind: 'GREENHOUSE', boardToken: 'groww', jobId: '7000001' }],
        ['https://jobs.lever.co/paytm/88e8b698-8f03-4e09-9581-168f831fb3af/apply', { kind: 'LEVER', boardToken: 'paytm', jobId: '88e8b698-8f03-4e09-9581-168f831fb3af' }],
        ['https://jobs.ashbyhq.com/sarvam/3F2504E0-4F89-11D3-9A0C-0305E82C3301', { kind: 'ASHBY', boardToken: 'sarvam', jobId: '3f2504e0-4f89-11d3-9a0c-0305e82c3301' }],
    ])('%s', (url, expected) => {
        expect(parseAtsLink(url)).toEqual(expected);
    });
    it.each(['https://boards.greenhouse.io/stripe', 'https://jobs.lever.co/paytm', 'https://stripe.com/jobs/search?gh_jid=1', 'https://example.com/jobs/1'])('not a single-job ATS link: %s', (url) => {
        expect(parseAtsLink(url)).toBeNull();
    });
});

describe('JSON-LD JobPosting (HTML fixture)', () => {
    const html = readFileSync(new URL('./fixtures/jobposting.html', import.meta.url), 'utf8');
    const raw = extractJsonLd(html, 'https://careers.acme.example/jobs/ds-2027-04?ref=x');
    it('finds the JobPosting inside @graph, skipping a broken block', () => {
        expect(raw).toMatchObject({
            externalId: 'DS-2027-04', title: 'Data Science Intern', companyName: 'Acme Robotics Pvt Ltd',
            locationText: 'Bengaluru, KA, IN; Pune, India', url: 'https://careers.acme.example/jobs/ds-2027-04',
            employmentTypeText: 'internship', postedAt: '2026-09-20', deadline: '2026-10-31T23:59:59+05:30',
        });
    });
    it('turns the HTML description into text', () => {
        expect(raw.descriptionText).toBe('Join our perception team.\n- Python\n- PyTorch\nDuration: 6 months.');
    });
    it('baseSalary becomes pay text the compensation parser reads as a monthly range', () => {
        expect(raw.compensationText).toBe('INR 40000 - 60000 per month');
        expect(parseCompensation(raw.compensationText)).toMatchObject({ min: 40000, max: 60000, disclosure: 'RANGE' });
    });
    it('remote jobs (TELECOMMUTE) are marked remote with the allowed region', () => {
        const page = `<script type="application/ld+json">${JSON.stringify({ '@type': 'JobPosting', title: 'SWE Intern', jobLocationType: 'TELECOMMUTE', applicantLocationRequirements: { '@type': 'Country', name: 'India' } })}</script>`;
        expect(extractJsonLd(page, 'https://x.example/j')).toMatchObject({ locationText: 'Remote - India', workplaceText: 'remote', url: 'https://x.example/j' });
    });
    it('no JobPosting -> null', () => {
        expect(extractJsonLd('<html><script type="application/ld+json">{"@type":"Organization"}</script></html>', 'https://x.example')).toBeNull();
    });
});
