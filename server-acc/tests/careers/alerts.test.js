import { describe, it, expect } from 'vitest';
import {
    cleanFilters, alertParams, alertBody, alertUpdateBody, isDue, alertWindow, alertPostingsWhere, filterSummary,
} from '../../services/careers/alerts/savedSearch.js';
import { digestMail, pageParams } from '../../services/careers/alerts/digestMail.js';
import { mailConfigured } from '../../services/careers/mail/careersMail.js';
import { computeAlerts } from '../../services/careers/ops/alerts.js';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

describe('job alert filters (F-19)', () => {
    it('keeps only the jobs-page filters, as strings', () => {
        expect(cleanFilters({ type: 'INTERNSHIP', eligibleOnly: true, page: '3', sort: 'deadline', postedWithin: '7', showHidden: 'true', q: '' }))
            .toEqual({ type: 'INTERNSHIP', eligibleOnly: 'true' });
    });
    it('keeps the company label next to companyId', () => {
        expect(cleanFilters({ companyId: '37', companyName: 'Paytm' })).toEqual({ companyId: '37', companyName: 'Paytm' });
        expect(alertParams({ companyId: '37', companyName: 'Paytm' }).companyId).toBe(37);
    });
    it('rejects filters the jobs page would reject', () => {
        expect(() => cleanFilters({ type: 'PART_TIME' })).toThrow(/not valid/);
        expect(() => cleanFilters({ minStipend: '-5' })).toThrow();
    });
    it('the body needs a name and accepts DAILY / WEEKLY (default WEEKLY)', () => {
        expect(alertBody.parse({ name: ' Remote interns ', filters: {} })).toEqual({ name: 'Remote interns', frequency: 'WEEKLY', filters: {} });
        expect(() => alertBody.parse({ name: '', filters: {} })).toThrow();
        expect(() => alertBody.parse({ name: 'x', frequency: 'HOURLY' })).toThrow();
        expect(() => alertBody.parse({ name: 'x', userId: 2 })).toThrow();
    });
    it('an update must change something', () => {
        expect(() => alertUpdateBody.parse({})).toThrow();
        expect(alertUpdateBody.parse({ paused: true })).toEqual({ paused: true });
    });
});

describe('when a digest is due', () => {
    const now = new Date('2026-10-10T03:30:00Z');
    it('a new alert is due; a paused one never', () => {
        expect(isDue({ frequency: 'DAILY', lastRunAt: null }, now)).toBe(true);
        expect(isDue({ frequency: 'DAILY', lastRunAt: null, unsubscribedAt: now }, now)).toBe(false);
    });
    it('daily: at most once a day (a run a little early still counts)', () => {
        expect(isDue({ frequency: 'DAILY', lastRunAt: new Date(now - 12 * HOUR) }, now)).toBe(false);
        expect(isDue({ frequency: 'DAILY', lastRunAt: new Date(now - 23 * HOUR) }, now)).toBe(true);
    });
    it('weekly: at most once a week', () => {
        expect(isDue({ frequency: 'WEEKLY', lastRunAt: new Date(now - 3 * DAY) }, now)).toBe(false);
        expect(isDue({ frequency: 'WEEKLY', lastRunAt: new Date(now - 7 * DAY + HOUR) }, now)).toBe(true);
    });
    it('the window starts at the last run, or when the alert was made, and ends now', () => {
        const createdAt = new Date('2026-10-01T00:00:00Z');
        expect(alertWindow({ createdAt, lastRunAt: null }, now)).toEqual({ since: createdAt, until: now });
        expect(alertWindow({ createdAt, lastRunAt: new Date(now - DAY) }, now).since).toEqual(new Date(now - DAY));
    });
});

describe('alertPostingsWhere', () => {
    const since = new Date('2026-10-09T03:30:00Z');
    const until = new Date('2026-10-10T03:30:00Z');
    it('LIVE, the saved filters, published inside the window, not hidden by the student', () => {
        const where = alertPostingsWhere(alertParams({ type: 'INTERNSHIP' }), { since, until }, null, 7);
        expect(where.AND).toEqual([
            { status: 'LIVE' },
            { type: 'INTERNSHIP' },
            { OR: [{ publishedAt: { gt: since, lte: until } }, { publishedAt: null, firstSeenAt: { gt: since, lte: until } }] },
            { hiddenBy: { none: { userId: 7 } } },
        ]);
    });
    it('adds the eligibility clause when given', () => {
        const elig = { AND: [{ x: 1 }] };
        expect(alertPostingsWhere(alertParams({}), { since, until }, elig, 7).AND.at(-1)).toBe(elig);
    });
});

describe('filterSummary', () => {
    it('describes the saved filters', () => {
        expect(filterSummary({ q: 'react', type: 'INTERNSHIP', workMode: 'REMOTE', eligibleOnly: 'true', companyId: '3', companyName: 'Razorpay' }))
            .toBe('“react” · Internships · Remote · Razorpay · Eligible for me');
        expect(filterSummary({})).toBe('All new openings');
    });
});

describe('digestMail', () => {
    const alert = { name: 'Remote <b>interns</b>', frequency: 'WEEKLY', token: 'tok_abc', filters: { workMode: 'REMOTE' } };
    const postings = [
        { id: 11, roleTitle: 'SDE Intern', type: 'INTERNSHIP', workMode: 'REMOTE', location: 'Bengaluru', company: { name: 'Acme & Co' }, deadlineStated: new Date('2026-10-20T00:00:00Z') },
        { id: 12, roleTitle: 'Data Intern', type: 'INTERNSHIP', workMode: null, location: null, company: null, deadlineStated: null },
    ];
    const mail = digestMail({ alert, postings, total: 5, clientUrl: 'https://acc.example/' });
    it('subject counts all matches; links go to the portal', () => {
        expect(mail.subject).toBe('5 new openings for “Remote <b>interns</b>”');
        expect(mail.text).toContain('https://acc.example/dashboard/career-vault/jobs/11');
        expect(mail.text).toContain('…and 3 more: https://acc.example/dashboard/career-vault/jobs?workMode=REMOTE');
        expect(mail.unsubscribeUrl).toBe('https://acc.example/alerts/unsubscribe?token=tok_abc');
    });
    it('the "more" link uses the jobs-page params (CTC in LPA)', () => {
        expect(pageParams({ minCtc: '1200000', type: 'FULL_TIME' }).toString()).toBe('minCtcLpa=12&type=FULL_TIME');
    });
    it('escapes database text in the HTML and says unknowns honestly', () => {
        expect(mail.html).toContain('Remote &lt;b&gt;interns&lt;/b&gt;');
        expect(mail.html).toContain('SDE Intern at Acme &amp; Co');
        expect(mail.html).not.toContain('<b>interns</b>');
        expect(mail.text).toContain('Data Intern at Company not stated');
        expect(mail.text).toContain('Deadline stated by source: 20 Oct 2026');
    });
});

describe('mail and ops', () => {
    it('mail counts as configured only with SMTP_HOST and SMTP_USER', () => {
        expect(mailConfigured({})).toBe(false);
        expect(mailConfigured({ SMTP_HOST: 'h', SMTP_USER: 'u' })).toBe(true);
    });
    it('amber ALERT_EMAILS_FAILING when digests could not be sent', () => {
        const base = { worker: {}, sources: { list: [] }, llm: {}, queue: { flagged: 0, submissions: {}, reported: 0 } };
        expect(computeAlerts(base).some((a) => a.code === 'ALERT_EMAILS_FAILING')).toBe(false);
        const alerts = computeAlerts({ ...base, queue: { ...base.queue, alertEmailsFailing: 2 } });
        expect(alerts.find((a) => a.code === 'ALERT_EMAILS_FAILING')).toMatchObject({ level: 'amber' });
    });
});
