import { DateTime } from 'luxon';
import { loadRegistry, deliveryMode, getDataset } from './config.js';
import { runReminder } from './run.js';
import { prismaExamStore } from './store.js';
import { sendExamMail, summaryMail } from './mail.js';

export async function examReminderTick({ env = process.env, now = () => new Date(), store, readRegistry = loadRegistry, runner = runReminder, logger = console } = {}) {
    if (env.EXAM_REMINDERS_ENABLED !== 'true') return { skipped: 'disabled' };
    if (!store) {
        const { default: prisma } = await import('../../config/db.js');
        store = prismaExamStore(prisma);
    }
    const results = [];
    try {
        const registry = await readRegistry(env.EXAM_REMINDERS_CONFIG, env);
        const mode = deliveryMode({ send: env.EXAM_REMINDERS_DRY_RUN === 'false', test: env.EXAM_REMINDERS_TEST_MODE === 'true', env });
        for (const id of registry.activeDatasets) {
            const config = getDataset(registry, id);
            const local = DateTime.fromJSDate(now(), { zone: config.timezone });
            if (local.toFormat('HH:mm') < config.sendAt) continue;
            const date = local.toISODate();
            const name = mode.dryRun ? 'DRY_RUN' : mode.test ? 'TEST' : 'LIVE';
            const due = await store.dueRuns(config.id, date, name, now());
            for (const run of due) results.push(await runner({ config, date, mode, scheduled: true, runId: run.id, store, env, now, logger }));
            results.push(await runner({ config, date, mode, scheduled: true, store, env, now, logger }));
        }
    } catch (err) {
        logger.error(`[exams] scheduler/configuration failure: ${err.message}`);
        // Configuration errors cannot use a dataset. Alert once per day rather than every minute.
        if (env.EXAM_REMINDERS_SEND_ENABLED === 'true' && env.EXAM_REMINDERS_DRY_RUN === 'false' && env.EXAM_REMINDERS_ADMIN_EMAIL) {
            const date = DateTime.fromJSDate(now(), { zone: 'Asia/Kolkata' }).toISODate();
            const run = await store.claimRun({ id: `config-error:${date}`, datasetId: '_configuration', examDate: date, mode: 'LIVE' }, now());
            if (run) {
                const summary = { datasetId: '_configuration', date, mode: 'LIVE', outcome: 'FAILED', error: err.message };
                try { await sendExamMail(env.EXAM_REMINDERS_ADMIN_EMAIL, summaryMail(summary), { env }); await store.adminResult(run.id, null); }
                catch (mailError) { await store.adminResult(run.id, mailError.message); }
                await store.finishRun(run, summary);
            }
        }
        return { error: err.message, results };
    }
    return { results };
}
