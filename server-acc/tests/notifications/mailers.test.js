import { describe, it, expect, vi, afterEach } from 'vitest';
vi.mock('../../config/db.js', () => ({ default: {} }));
vi.mock('../../utils/mail/transporter.js', () => ({ default: { sendMail: vi.fn() } }));
import notifyOnResourceUpdate from '../../utils/mail/sendResourceUpdate.js';
import notifyOnNewPost from '../../utils/mail/sendExperiencePost.js';
import jobPublishedTemplate, { jobPublicationUrl } from '../../templates/jobPublishedTemplate.js';
import { validNotificationEmail } from '../../services/notifications/preferences.js';

afterEach(() => vi.restoreAllMocks());
describe('existing publication mailers honour per-user preferences', () => {
    it.each([
        ['resourcesEnabled', notifyOnResourceUpdate, { academicYear: 2, allowedBranches: ['AI'], resourceTitle: 'Notes', courseCode: 'AI2101' }],
        ['careerVaultExperiencesEnabled', notifyOnNewPost, { experienceTitle: 'Experience', displayName: 'Author' }],
    ])('checks %s immediately before SMTP', async (category, notify, input) => {
        const db = { user: { findMany: vi.fn(async () => [{ id: 1, email: 'one@example.org' }, { id: 2, email: 'two@example.org' }, { id: 3, email: 'invalid' }]) } };
        const send = vi.fn(async () => 'id'); const allowed = vi.fn(async (id) => id !== 2);
        const result = await notify(input, { db, send, allowed, pauseMs: 0 });
        expect(result).toEqual({ sent: 1, skipped: 2, failed: 0 });
        expect(send.mock.calls[0][0].to).toBe('one@example.org');
        expect(allowed).toHaveBeenCalledWith(2, category, db);
        expect(db.user.findMany.mock.calls[0][0].where.OR[0]).toEqual({ notificationSettings: { is: null } });
        if (category === 'resourcesEnabled') expect(db.user.findMany.mock.calls[0][0].where.branchName).toEqual({ in: ['AI'] });
    });
    it('sends no email when preferences cannot be checked', async () => {
        const db = { user: { findMany: async () => [{ id: 1, email: 'one@example.org' }] } };
        const send = vi.fn(); const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const result = await notifyOnNewPost({}, { db, send, allowed: async () => { throw new Error('offline'); }, pauseMs: 0 });
        expect(result.failed).toBe(1); expect(send).not.toHaveBeenCalled(); spy.mockRestore();
    });
});

describe('new job opening template', () => {
    it.each([['INTERNSHIP', 'internship'], ['FULL_TIME', 'full-time'], ['UNKNOWN', 'job']])('uses the existing Career Vault visual design for %s', (type, label) => {
        const url = jobPublicationUrl('https://portal.example.org/', 42);
        const mail = jobPublishedTemplate({ title: 'Engineer <script>x</script>', type, url, description: 'MUST NOT APPEAR', publisher: 'SECRET PUBLISHER' });
        expect(mail.subject).toContain(label); expect(mail.text).toContain(url);
        expect(mail.html).toContain('background-color:#f4f6f8'); expect(mail.html).toContain('border-left:4px solid #0b5ed7');
        expect(mail.html).toContain('Engineer &lt;script&gt;x&lt;/script&gt;');
        expect(mail.html).not.toContain('<script>');
        expect(JSON.stringify(mail)).not.toContain('MUST NOT APPEAR'); expect(JSON.stringify(mail)).not.toContain('SECRET PUBLISHER');
        expect(mail.html).toContain('/dashboard/career-vault/jobs/42'); expect(mail.text).toContain('Engineer');
    });
    it('requires a safe configured portal URL and permits just a single mailbox', () => {
        expect(() => jobPublicationUrl('javascript:alert(1)', 1)).toThrow();
        expect(() => jobPublicationUrl('https://user:password@example.org', 1)).toThrow();
        expect(validNotificationEmail('one,two@example.org')).toBe(false);
        expect(validNotificationEmail('one@example.org\n')).toBe(false);
        expect(validNotificationEmail('one@example.org')).toBe(true);
    });
});
