import { describe, it, expect } from 'vitest';
import { waitedText, shouldRemind, reminderMail } from '../../services/careers/ops/reviewReminder.js';
import { computeAlerts } from '../../services/careers/ops/alerts.js';

const now = new Date('2026-10-10T04:30:00Z');

describe('review reminder (F-31)', () => {
    it('describes how long the oldest item waited', () => {
        expect(waitedText(new Date(now - 30 * 3600e3), now)).toBe('30 hours');
        expect(waitedText(new Date(now - 50 * 3600e3), now)).toBe('2 days');
    });
    it('reminds only when something waited more than 24 hours', () => {
        expect(shouldRemind({ postingsOverdue: 0, linksOverdue: 0, postingsWaiting: 12 })).toBe(false);
        expect(shouldRemind({ postingsOverdue: 1, linksOverdue: 0 })).toBe(true);
        expect(shouldRemind({ postingsOverdue: 0, linksOverdue: 2 })).toBe(true);
    });
    it('"12 postings waiting, oldest 2 days", with a link to the queue', () => {
        const m = reminderMail({ postingsWaiting: 12, postingsOverdue: 5, oldestPosting: new Date(now - 50 * 3600e3), linksOverdue: 1 }, { clientUrl: 'https://acc.example/', now });
        expect(m.subject).toBe('Jobs review: 12 waiting, oldest 2 days');
        expect(m.text).toContain('12 postings waiting for review, 5 for more than 24 hours (oldest 2 days).');
        expect(m.text).toContain('1 student link waiting for a person');
        expect(m.text).toContain('https://acc.example/admin/careers/review');
        expect(m.html).toContain('href="https://acc.example/admin/careers/review"');
    });
    it('links only', () => {
        expect(reminderMail({ postingsWaiting: 0, postingsOverdue: 0, oldestPosting: null, linksOverdue: 3 }, { clientUrl: 'x', now }).subject).toBe('Jobs review: 3 student links waiting');
    });
});

describe('ops alerts', () => {
    const base = { worker: {}, sources: { list: [] }, llm: {}, queue: { flagged: 0, submissions: {}, reported: 0 } };
    it('amber REVIEW_WAITING when postings waited more than 48 hours', () => {
        expect(computeAlerts(base).some((a) => a.code === 'REVIEW_WAITING')).toBe(false);
        expect(computeAlerts({ ...base, queue: { ...base.queue, reviewOverdue: 3 } }).find((a) => a.code === 'REVIEW_WAITING')).toMatchObject({ level: 'amber' });
    });
    it('amber REVIEW_REMINDER_FAILING when the last email failed', () => {
        const q = { ...base.queue, reminder: { at: '2026-10-10T04:30:00.000Z', sent: 0, error: 'Email is not configured' } };
        expect(computeAlerts({ ...base, queue: q }).find((a) => a.code === 'REVIEW_REMINDER_FAILING').message).toContain('2026-10-10');
        expect(computeAlerts({ ...base, queue: { ...base.queue, reminder: { at: 'x', sent: 2, error: null } } }).some((a) => a.code === 'REVIEW_REMINDER_FAILING')).toBe(false);
    });
});
