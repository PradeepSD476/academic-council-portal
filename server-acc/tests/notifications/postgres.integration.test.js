import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';

const state = vi.hoisted(() => ({ db: null }));
vi.mock('../../config/db.js', () => ({ default: new Proxy({}, { get(_target, key) { const value = state.db?.[key]; return typeof value === 'function' ? value.bind(state.db) : value; } }) }));
import { saveNotificationSettings, getNotificationSettings, DEFAULT_NOTIFICATION_SETTINGS } from '../../services/notifications/preferences.js';
import { enqueueJobPublication, preparePublicationAudience, runPublicationNotifications } from '../../services/careers/notifications/publicationQueue.js';
import { approvePosting, bulkApprove, createManualPosting, reopenPosting, editPosting } from '../../services/careers/postings/reviewService.js';
import { clearSettingsCache } from '../../services/careers/settings.js';
import { runAlerts } from '../../services/careers/alerts/runAlerts.js';

// Destructive fixture resets are restricted to a disposable local database with this exact name.
const url = process.env.NOTIFICATIONS_TEST_DATABASE_URL;
describe.skipIf(!url)('notification preferences and publication queue on PostgreSQL', () => {
    let db; let other; let user; let company; let clock;
    const logger = { info() {}, error() {} };
    const run = (overrides = {}) => runPublicationNotifications({ db, configured: true, clientUrl: 'https://portal.example.org', readSetting: async () => true, pauseMs: 0, logger, now: () => clock, ...overrides });
    beforeAll(() => {
        const parsed = new URL(url);
        if (!['localhost', '127.0.0.1'].includes(parsed.hostname) || parsed.pathname !== '/notifications_test') throw new Error('Use only a disposable localhost /notifications_test database');
        db = new PrismaClient({ datasourceUrl: url }); other = new PrismaClient({ datasourceUrl: url }); state.db = db;
    });
    beforeEach(async () => {
        await db.$executeRawUnsafe('TRUNCATE TABLE "User", "Posting", "Company", "Source", "AppSetting" RESTART IDENTITY CASCADE');
        clearSettingsCache();
        clock = new Date('2030-01-01T00:00:00Z');
        user = await db.user.create({ data: { email: 'one@example.org', displayName: 'One', createdAt: new Date('2020-01-01') } });
        company = await db.company.create({ data: { name: 'Example Co', slug: 'example', normalizedName: 'example', status: 'ACTIVE' } });
        await db.appSetting.create({ data: { key: 'careers.visibleToStudents', value: true } });
    });
    afterEach(() => vi.restoreAllMocks());
    afterAll(async () => { await db?.$disconnect(); await other?.$disconnect(); });
    async function posting(data = {}) {
        return db.posting.create({ data: { companyId: company.id, roleTitle: 'Engineer Intern', roleTitleNormalized: 'engineer intern', descriptionText: 'PRIVATE DESCRIPTION', contentFingerprint: '0123456789abcdef', applyUrl: 'https://example.org/apply', extractionTier: 'STRUCTURED', extractionConfidence: 1, skills: [], eligibleBranches: [], eligibleYears: [], eligibleGradYears: [], uncertainFields: [], ...data } });
    }
    async function publish() { const p = await posting(); await approvePosting(p.id, {}, user.id); return p; }

    it('keeps defaults out of User, lazily creates settings and preserves concurrent partial updates', async () => {
        expect(await getNotificationSettings(user.id, db)).toEqual(DEFAULT_NOTIFICATION_SETTINGS);
        expect(await db.userNotificationSettings.count()).toBe(0);
        await Promise.all([saveNotificationSettings(user.id, { resourcesEnabled: false }, db), saveNotificationSettings(user.id, { jobsInternshipsEnabled: false }, other)]);
        expect(await getNotificationSettings(user.id, db)).toEqual({ ...DEFAULT_NOTIFICATION_SETTINGS, resourcesEnabled: false, jobsInternshipsEnabled: false });
    });
    it('queues individual, bulk and immediately-published manual openings', async () => {
        const single = await publish();
        const bulk = await posting(); expect((await bulkApprove([bulk.id], user.id)).approved).toEqual([bulk.id]);
        await db.source.create({ data: { name: 'Manual', kind: 'MANUAL', boardToken: null } });
        const manual = await createManualPosting({ companyId: company.id, roleTitle: 'Full Time Engineer', descriptionText: 'A separate full-time role', applyUrl: 'https://example.org/full-time', type: 'FULL_TIME', publish: true }, user.id);
        const ids = (await db.jobPublicationNotification.findMany()).map((e) => e.postingId).sort((a, b) => a - b);
        expect(ids).toEqual([single.id, bulk.id, manual.posting.id].sort((a, b) => a - b));
    });
    it('rolls back publication and its event together', async () => {
        const p = await posting();
        await expect(db.$transaction(async (tx) => {
            await tx.posting.update({ where: { id: p.id }, data: { status: 'LIVE' } });
            await enqueueJobPublication(tx, p.id);
            throw new Error('rollback');
        })).rejects.toThrow('rollback');
        expect((await db.posting.findUnique({ where: { id: p.id } })).status).toBe('PENDING_REVIEW');
        expect(await db.jobPublicationNotification.count()).toBe(0);
    });
    it('creates only one event even for concurrent enqueue attempts', async () => {
        const p = await posting({ status: 'LIVE' });
        await Promise.all([db.$transaction((tx) => enqueueJobPublication(tx, p.id)), other.$transaction((tx) => enqueueJobPublication(tx, p.id))]);
        expect(await db.jobPublicationNotification.count()).toBe(1);
    });
    it('does not backfill old live openings or announce drafts/hidden publications', async () => {
        await posting({ status: 'LIVE', publishedAt: new Date() });
        await posting();
        await db.appSetting.update({ where: { key: 'careers.visibleToStudents' }, data: { value: false } });
        await publish();
        const send = vi.fn(); await run({ send });
        expect(await db.jobPublicationNotification.count()).toBe(0); expect(send).not.toHaveBeenCalled();
    });
    it('sends once per registered user and never duplicates on subsequent worker ticks', async () => {
        await db.user.create({ data: { email: 'admin@example.org', role: 'SUPER_ADMIN', createdAt: new Date('2020-01-01') } });
        await publish(); const send = vi.fn(async () => 'id');
        expect((await run({ send })).sent).toBe(2);
        await run({ send }); expect(send).toHaveBeenCalledTimes(2);
        expect(await db.jobPublicationDelivery.count({ where: { status: 'SENT' } })).toBe(2);
        expect(send.mock.calls[0][0].text).not.toContain('PRIVATE DESCRIPTION');
    });
    it('does not rebroadcast edits, reopening or reapproval', async () => {
        const p = await publish(); const send = vi.fn(async () => 'id'); await run({ send });
        await editPosting(p.id, { roleTitle: 'Updated title' }, user.id);
        await db.posting.update({ where: { id: p.id }, data: { status: 'EXPIRED' } });
        await reopenPosting(p.id, user.id);
        await db.posting.update({ where: { id: p.id }, data: { status: 'PENDING_REVIEW', publishedAt: null } });
        await approvePosting(p.id, {}, user.id); await run({ send });
        expect(send).toHaveBeenCalledOnce(); expect(await db.jobPublicationNotification.count()).toBe(1);
    });
    it('excludes opted-out users, invalid emails, and accounts registered after publication', async () => {
        await saveNotificationSettings(user.id, { jobsInternshipsEnabled: false }, db);
        await db.user.create({ data: { email: 'invalid', createdAt: new Date('2020-01-01') } });
        const p = await publish();
        await db.user.create({ data: { email: 'new@example.org', createdAt: new Date('2031-01-01') } });
        const send = vi.fn(); await run({ send }); expect(send).not.toHaveBeenCalled();
        expect(await db.jobPublicationDelivery.count({ where: { postingId: p.id } })).toBe(2);
        expect((await db.jobPublicationDelivery.findMany()).map((d) => d.status).sort()).toEqual(['SKIPPED_INVALID_EMAIL', 'SKIPPED_OPT_OUT']);
    });
    it('honours an opt-out after the audience was already queued', async () => {
        const p = await publish(); const event = await db.jobPublicationNotification.findUnique({ where: { postingId: p.id } });
        await preparePublicationAudience(db, event);
        await saveNotificationSettings(user.id, { jobsInternshipsEnabled: false }, db);
        const send = vi.fn(); await run({ send }); expect(send).not.toHaveBeenCalled();
        expect((await db.jobPublicationDelivery.findFirst()).status).toBe('SKIPPED_OPT_OUT');
    });
    it('backs off transient failures, rechecks preferences on retry and caps retries', async () => {
        await publish(); const send = vi.fn(async () => { throw Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' }); });
        await run({ send }); await run({ send }); expect(send).toHaveBeenCalledOnce();
        clock = new Date(+clock + 60_000); await run({ send }); expect(send).toHaveBeenCalledTimes(2);
        clock = new Date(+clock + 300_000); await run({ send }); await run({ send }); expect(send).toHaveBeenCalledTimes(3);
        expect((await db.jobPublicationDelivery.findFirst()).status).toBe('FAILED');
    });
    it('does not retry a failed send after the user opts out', async () => {
        await publish(); const send = vi.fn(async () => { throw new Error('temporary'); });
        await run({ send }); await saveNotificationSettings(user.id, { jobsInternshipsEnabled: false }, db);
        clock = new Date(+clock + 60_000); await run({ send });
        expect(send).toHaveBeenCalledOnce(); expect((await db.jobPublicationDelivery.findFirst()).status).toBe('SKIPPED_OPT_OUT');
    });
    it('does not retry permanent SMTP failures', async () => {
        await publish(); const send = vi.fn(async () => { throw Object.assign(new Error('mailbox rejected'), { responseCode: 550 }); });
        await run({ send }); clock = new Date(+clock + 3600_000); await run({ send });
        expect(send).toHaveBeenCalledOnce(); expect((await db.jobPublicationDelivery.findFirst()).status).toBe('FAILED');
    });
    it('cancels unsent mail when a published opening is taken offline', async () => {
        const p = await publish(); await db.posting.update({ where: { id: p.id }, data: { status: 'REJECTED' } });
        const send = vi.fn(); await run({ send }); expect(send).not.toHaveBeenCalled();
        expect((await db.jobPublicationNotification.findUnique({ where: { postingId: p.id } })).status).toBe('CANCELLED');
    });
    it('pauses hidden jobs without consuming a send attempt', async () => {
        await publish(); const send = vi.fn(); let checks = 0;
        await run({ send, readSetting: async () => ++checks === 1 });
        expect(send).not.toHaveBeenCalled(); expect((await db.jobPublicationDelivery.findFirst()).attempts).toBe(0);
        await run({ send }); expect(send).toHaveBeenCalledOnce();
    });
    it('defers missing SMTP/configuration and respects bounded batches', async () => {
        await publish(); const send = vi.fn(async () => 'id');
        await run({ send, configured: false }); expect(send).not.toHaveBeenCalled();
        await db.user.create({ data: { email: 'two@example.org', createdAt: new Date('2020-01-01') } });
        expect((await run({ send, batchSize: 1 })).sent).toBe(1);
        expect((await run({ send, batchSize: 1 })).sent).toBe(1);
        await run({ send }); expect(send).toHaveBeenCalledTimes(2);
    });
    it('fails closed when a current preference cannot be read', async () => {
        await publish(); const send = vi.fn();
        vi.spyOn(db.user, 'findUnique').mockRejectedValueOnce(new Error('database offline'));
        await run({ send }); expect(send).not.toHaveBeenCalled();
        expect((await db.jobPublicationDelivery.findFirst()).status).toBe('PENDING');
    });
    it('recovers an expired sending claim after restart', async () => {
        const p = await publish(); await preparePublicationAudience(db, await db.jobPublicationNotification.findUnique({ where: { postingId: p.id } }));
        await db.jobPublicationDelivery.updateMany({ data: { status: 'SENDING', attempts: 1, claimToken: 'old', leaseUntil: new Date(+clock - 60_000) } });
        const send = vi.fn(async () => 'id'); await run({ send });
        expect(send).toHaveBeenCalledOnce(); expect((await db.jobPublicationDelivery.findFirst()).attempts).toBe(2);
    });
    it('does not reinterpret an SMTP-success/DB-failure window as a confirmed failure', async () => {
        await publish(); const send = vi.fn(async () => 'id');
        const update = db.jobPublicationDelivery.updateMany.bind(db.jobPublicationDelivery);
        const spy = vi.spyOn(db.jobPublicationDelivery, 'updateMany').mockImplementationOnce(update).mockRejectedValueOnce(new Error('lost DB'));
        await expect(run({ send })).rejects.toThrow('lost DB'); spy.mockRestore();
        expect((await db.jobPublicationDelivery.findFirst()).status).toBe('SENDING');
        clock = new Date(+clock + 16 * 60_000); await run({ send });
        expect(send).toHaveBeenCalledTimes(2); // Explicit delivery-first recovery for uncertain SMTP.
    });
    it('cascades settings/deliveries when an account is removed', async () => {
        await saveNotificationSettings(user.id, { announcementsEnabled: false }, db);
        const p = await publish(); await preparePublicationAudience(db, await db.jobPublicationNotification.findUnique({ where: { postingId: p.id } }));
        await db.user.delete({ where: { id: user.id } });
        expect(await db.userNotificationSettings.count()).toBe(0); expect(await db.jobPublicationDelivery.count()).toBe(0);
    });
    it('applies the jobs master preference to existing saved-search digests without deleting subscriptions', async () => {
        await db.appSetting.create({ data: { key: 'careers.alertEmailsEnabled', value: true } }); clearSettingsCache();
        await saveNotificationSettings(user.id, { jobsInternshipsEnabled: false }, db);
        const alert = await db.savedSearch.create({ data: { userId: user.id, name: 'Internships', token: 'test-token', filters: {}, frequency: 'DAILY' } });
        const transport = { sendMail: vi.fn() };
        const result = await runAlerts({ now: clock, configured: true, clientUrl: 'https://portal.example.org', transport, pauseMs: 0 });
        expect(result.optedOut).toBe(1); expect(transport.sendMail).not.toHaveBeenCalled();
        const saved = await db.savedSearch.findUnique({ where: { id: alert.id } });
        expect(saved.unsubscribedAt).toBeNull(); expect(saved.lastRunAt).toEqual(clock);
    });
});
