import { describe, it, expect, vi } from 'vitest';
import { config, workbookBytes, users, mode, env, memoryStore, logger } from './helpers.js';
import { parseWorkbook } from '../../services/exams/workbook.js';
import { qualityReport } from '../../services/exams/schedule.js';
import { runReminder } from '../../services/exams/run.js';
import { deliveryMode } from '../../services/exams/config.js';
import { examReminderTick } from '../../services/exams/jobs.js';

async function setup() {
    const c = config(); const model = await parseWorkbook(await workbookBytes(), c);
    return { config: c, date: '2026-11-21', mode, env, store: memoryStore(), logger, pause: async () => {}, now: () => new Date('2026-11-21T02:00:00Z'), loader: async () => ({ model, report: qualityReport(model, c), metadata: { source: 'xlsx' } }) };
}
const studentCalls = (mock) => mock.mock.calls.filter(([to]) => to !== env.EXAM_REMINDERS_ADMIN_EMAIL);
describe('exam reminder delivery lifecycle', () => {
    it('sends one combined email per roll and suppresses confirmed successes on rerun', async () => {
        const options = await setup(); const sendMail = vi.fn(async () => 'message-id');
        expect((await runReminder({ ...options, sendMail })).counts.sent).toBe(3);
        const again = await runReminder({ ...options, sendMail });
        expect(again.counts.sent).toBe(0); expect(again.counts.alreadySent).toBe(3);
        expect(studentCalls(sendMail)).toHaveLength(3);
        expect(studentCalls(sendMail)[0][1].text).toContain('Evening');
        expect(sendMail.mock.calls.filter(([to]) => to === env.EXAM_REMINDERS_ADMIN_EMAIL)).toHaveLength(2);
    });
    it('dry run generates every email without SMTP or delivery/run writes', async () => {
        const options = await setup(); const sendMail = vi.fn(); const preview = vi.fn();
        const result = await runReminder({ ...options, mode: { ...mode, dryRun: true }, sendMail, onPreview: preview });
        expect(result.counts.wouldSend).toBe(3); expect(preview).toHaveBeenCalledTimes(3);
        expect(sendMail).not.toHaveBeenCalled(); expect(options.store.records.size).toBe(0); expect(options.store.runs.size).toBe(0);
    });
    it('concurrent runs cannot both deliver and a different dataset gets independent keys', async () => {
        const options = await setup(); const sendMail = vi.fn(async () => 'id');
        const results = await Promise.all([runReminder({ ...options, sendMail }), runReminder({ ...options, sendMail })]);
        expect(results.some((r) => r.outcome === 'SKIPPED_LOCKED_OR_COMPLETE')).toBe(true);
        expect(studentCalls(sendMail)).toHaveLength(3);
        await runReminder({ ...options, config: { ...options.config, id: 'another-semester' }, sendMail });
        expect(studentCalls(sendMail)).toHaveLength(6);
    });
    it('backs off transient/uncertain sends, retries later, and limits attempts', async () => {
        const options = await setup(); options.users = [users[0]];
        let time = new Date('2026-11-21T02:00:00Z'); options.now = () => time;
        const sendMail = vi.fn(async (to) => { if (to !== env.EXAM_REMINDERS_ADMIN_EMAIL) throw Object.assign(new Error('SMTP timeout'), { code: 'ETIMEDOUT' }); return 'admin-id'; });
        const first = await runReminder({ ...options, sendMail }); expect(first.outcome).toBe('RETRY_PENDING');
        await runReminder({ ...options, sendMail }); expect(studentCalls(sendMail)).toHaveLength(1);
        time = new Date(+time + 60_000); await runReminder({ ...options, sendMail }); expect(studentCalls(sendMail)).toHaveLength(2);
        time = new Date(+time + 5 * 60_000); await runReminder({ ...options, sendMail }); expect(studentCalls(sendMail)).toHaveLength(3);
        await runReminder({ ...options, sendMail }); expect(studentCalls(sendMail)).toHaveLength(3);
        expect([...options.store.records.values()][0].status).toBe('EXHAUSTED');
    });
    it('does not retry permanent SMTP rejections', async () => {
        const options = await setup(); options.users = [users[0]];
        const sendMail = vi.fn(async (to) => { if (to !== env.EXAM_REMINDERS_ADMIN_EMAIL) throw Object.assign(new Error('Mailbox unavailable'), { responseCode: 550 }); });
        await runReminder({ ...options, sendMail }); await runReminder({ ...options, sendMail });
        expect(studentCalls(sendMail)).toHaveLength(1);
    });
    it('recovers stale SENDING claims after restart according to delivery-first policy', async () => {
        const options = await setup(); options.users = [users[0]];
        const key = { datasetId: options.config.id, roll: '2601CS01', examDate: options.date };
        await options.store.claimDelivery(key, users[0].email, 3, new Date('2026-11-21T01:00:00Z'));
        const sendMail = vi.fn(async () => 'id');
        await runReminder({ ...options, sendMail });
        expect(studentCalls(sendMail)).toHaveLength(1);
        expect([...options.store.records.values()][0].attempts).toBe(2);
    });
    it('does not reinterpret a DB write failure after SMTP success as a safe send failure', async () => {
        const options = await setup(); options.users = [users[0]];
        options.store.completeDelivery = async () => { throw new Error('DB disconnected'); };
        const sendMail = vi.fn(async () => 'accepted');
        const result = await runReminder({ ...options, sendMail });
        expect(result.outcome).toBe('FAILED');
        expect([...options.store.records.values()][0].status).toBe('SENDING');
        expect(studentCalls(sendMail)).toHaveLength(1);
    });
    it.each([['2026-11-24', 'HOLIDAY'], ['2026-12-10', 'NO_EXAMS']])('no student emails for %s', async (date, outcome) => {
        const options = await setup(); const sendMail = vi.fn(async () => 'id');
        expect((await runReminder({ ...options, date, sendMail })).outcome).toBe(outcome);
        expect(studentCalls(sendMail)).toHaveLength(0);
    });
    it('alerts admin if every data source fails and preserves admin mail failure', async () => {
        const options = await setup(); const sendMail = vi.fn(async () => { throw new Error('SMTP down'); });
        const result = await runReminder({ ...options, loader: async () => { throw new Error("tab 'Course Wise List' not found"); }, sendMail });
        expect(result.outcome).toBe('FAILED'); expect(result.adminError).toBe('SMTP down');
        expect(studentCalls(sendMail)).toHaveLength(0);
        expect([...options.store.runs.values()][0].adminError).toBe('SMTP down');
    });
    it('does not send outside an allowlist', async () => {
        const options = await setup(); const sendMail = vi.fn(async () => 'id');
        await runReminder({ ...options, mode: { ...mode, test: true, emails: ['two@example.org'] }, sendMail });
        expect(studentCalls(sendMail).map(([to]) => to)).toEqual(['two@example.org']);
    });
    it('skips scheduled catchup after the first slot begins and completes scheduled dry runs once', async () => {
        const options = await setup(); const sendMail = vi.fn(async () => 'id');
        const late = await runReminder({ ...options, scheduled: true, now: () => new Date('2026-11-21T05:00:00Z'), sendMail });
        expect(late.outcome).toBe('MISSED_SEND_WINDOW'); expect(studentCalls(sendMail)).toHaveLength(0);
        const dry = { ...options, scheduled: true, mode: { ...mode, dryRun: true }, sendMail };
        expect((await runReminder(dry)).counts.wouldSend).toBe(3);
        expect((await runReminder(dry)).outcome).toBe('SKIPPED_LOCKED_OR_COMPLETE');
    });
    it('safe defaults, live guard, and nonempty test allowlist', async () => {
        expect(deliveryMode({ env: {} }).dryRun).toBe(true);
        expect(() => deliveryMode({ send: true, env: {} })).toThrow(/disabled/);
        expect(() => deliveryMode({ test: true, env: {} })).toThrow(/allowlist/);
        await expect(runReminder({ ...await setup(), env: {} })).rejects.toThrow(/Sending requires/);
    });
});

describe('worker scheduling and hot config reload', () => {
    it('does nothing by default', async () => {
        const readRegistry = vi.fn();
        expect(await examReminderTick({ env: {}, readRegistry })).toEqual({ skipped: 'disabled' });
        expect(readRegistry).not.toHaveBeenCalled();
    });
    it('uses dataset timezone and send time, reloading configuration on each tick', async () => {
        const c = config(); const readRegistry = vi.fn(async () => ({ activeDatasets: [c.id], datasets: [c] }));
        const runner = vi.fn(); const store = memoryStore();
        const args = { env: { EXAM_REMINDERS_ENABLED: 'true' }, store, readRegistry, runner, logger };
        await examReminderTick({ ...args, now: () => new Date('2026-11-21T01:59:00Z') }); expect(runner).not.toHaveBeenCalled();
        await examReminderTick({ ...args, now: () => new Date('2026-11-21T02:00:00Z') }); expect(runner).toHaveBeenCalledOnce();
        expect(runner.mock.calls[0][0]).toMatchObject({ date: '2026-11-21', mode: { dryRun: true } });
        c.sendAt = '08:00';
        await examReminderTick({ ...args, now: () => new Date('2026-11-21T02:00:00Z') }); expect(runner).toHaveBeenCalledOnce();
        expect(readRegistry).toHaveBeenCalledTimes(3);
    });
});
