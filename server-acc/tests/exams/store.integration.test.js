import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { prismaExamStore } from '../../services/exams/store.js';
import { runReminder } from '../../services/exams/run.js';
import { parseWorkbook } from '../../services/exams/workbook.js';
import { qualityReport } from '../../services/exams/schedule.js';
import { config, workbookBytes, users, mode, env, logger } from './helpers.js';

// Optional real-PostgreSQL tests. This must be a disposable localhost database named exam_test,
// with the exam migration applied. Never use the portal database: tables are reset per test.
const url = process.env.EXAM_TEST_DATABASE_URL;
describe.skipIf(!url)('PostgreSQL exam persistence and competing worker connections', () => {
    let db; let other; let store; let second;
    const time = new Date('2026-11-21T02:00:00Z');
    const key = { datasetId: 'test', roll: '2601CS01', examDate: '2026-11-21' };
    beforeAll(async () => {
        const parsed = new URL(url);
        if (!['localhost', '127.0.0.1'].includes(parsed.hostname) || parsed.pathname !== '/exam_test') throw new Error('Integration tests require a disposable localhost /exam_test database');
        db = new PrismaClient({ datasourceUrl: url }); other = new PrismaClient({ datasourceUrl: url });
        store = prismaExamStore(db); second = prismaExamStore(other);
    });
    beforeEach(async () => {
        await db.examReminderDelivery.deleteMany(); await db.examReminderRun.deleteMany(); await db.examWorkbookCache.deleteMany();
    });
    afterAll(async () => { await db?.$disconnect(); await other?.$disconnect(); });
    const runArgs = (id) => ({ id, datasetId: 'test', examDate: '2026-11-21', mode: 'LIVE' });

    it('allows only one global run across separate clients', async () => {
        const outcomes = await Promise.all([store.claimRun(runArgs('one'), time), second.claimRun(runArgs('two'), time)]);
        expect(outcomes.filter(Boolean)).toHaveLength(1);
        expect(await db.examReminderRun.count({ where: { status: 'RUNNING' } })).toBe(1);
    });
    it('revokes expired run owners before another worker takes the pipeline', async () => {
        const old = await store.claimRun(runArgs('old'), time);
        const later = new Date(+time + 16 * 60_000);
        const current = await second.claimRun(runArgs('new'), later);
        expect(current).toBeTruthy();
        await expect(store.renewRun(old, later)).rejects.toThrow(/lease lost/);
        await expect(store.finishRun(old, {})).rejects.toThrow(/lease lost/);
        await second.renewRun(current, later);
    });
    it('atomically claims a recipient across separate clients', async () => {
        const claims = await Promise.all([store.claimDelivery(key, 'one@example.org', 3, time), second.claimDelivery(key, 'one@example.org', 3, time)]);
        expect(claims.filter((c) => c.claimToken)).toHaveLength(1);
        expect((await db.examReminderDelivery.findFirst()).attempts).toBe(1);
    });
    it('recovers expired delivery claims and rejects a late write by the old owner', async () => {
        const old = await store.claimDelivery(key, 'one@example.org', 3, time);
        const later = new Date(+time + 16 * 60_000);
        const current = await second.claimDelivery(key, 'one@example.org', 3, later);
        expect(current.attempts).toBe(2);
        await expect(store.completeDelivery(old, { status: 'SENT' })).rejects.toThrow(/lease lost/);
        await second.completeDelivery(current, { status: 'SENT', sentAt: later });
        expect((await store.claimDelivery(key, 'one@example.org', 3, later)).skipped).toBe('SENT');
    });
    it('enforces persisted backoff, attempt cap, and permanent failures', async () => {
        const claim = await store.claimDelivery(key, 'one@example.org', 2, time);
        const retryAt = new Date(+time + 60_000);
        await store.completeDelivery(claim, { status: 'RETRY', nextRetryAt: retryAt });
        expect((await second.claimDelivery(key, 'one@example.org', 2, time)).skipped).toBe('BACKOFF');
        const final = await second.claimDelivery(key, 'one@example.org', 2, retryAt);
        await second.completeDelivery(final, { status: 'RETRY', nextRetryAt: null });
        expect((await store.claimDelivery(key, 'one@example.org', 2, retryAt)).skipped).toBe('EXHAUSTED');
        const otherKey = { ...key, roll: '2601CS02' };
        const permanent = await store.claimDelivery(otherKey, 'two@example.org', 3, time);
        await store.completeDelivery(permanent, { status: 'PERMANENT_FAILURE' });
        expect((await second.claimDelivery(otherKey, 'two@example.org', 3, retryAt)).skipped).toBe('PERMANENT_FAILURE');
    });
    it('stores cache bytes durably and separates source identities', async () => {
        await store.cache.put('test', 'url-hash', Buffer.from('workbook bytes'), time);
        expect(Buffer.from((await second.cache.get('test', 'url-hash')).workbook).toString()).toBe('workbook bytes');
        expect(await second.cache.get('test', 'different-url')).toBeNull();
    });
    it('runs the real delivery workflow twice and sends each student once', async () => {
        const c = config(); const model = await parseWorkbook(await workbookBytes(), c);
        const sent = [];
        const options = { config: c, date: '2026-11-21', mode, env, store, users, logger, now: () => time, pause: async () => {}, loader: async () => ({ model, report: qualityReport(model, c), metadata: { source: 'test' } }), sendMail: async (to) => { sent.push(to); return 'smtp-accepted'; } };
        expect((await runReminder(options)).counts.sent).toBe(3);
        expect((await runReminder({ ...options, store: second })).counts.alreadySent).toBe(3);
        expect(sent.filter((to) => to !== env.EXAM_REMINDERS_ADMIN_EMAIL)).toHaveLength(3);
        expect(await db.examReminderDelivery.count({ where: { status: 'SENT' } })).toBe(3);
    });
});
