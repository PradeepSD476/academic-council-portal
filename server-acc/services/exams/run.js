import { randomUUID } from 'node:crypto';
import { DateTime } from 'luxon';
import { loadDataset, digest } from './source.js';
import { buildIndex, planRecipients, validEmail } from './schedule.js';
import { reminderMail, summaryMail, sendExamMail } from './mail.js';
import { targetDate } from './normalise.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const errorText = (err) => String(err?.message || err).slice(0, 1000);
const isPermanent = (err) => err.permanent || (Number(err.responseCode) >= 500 && Number(err.responseCode) < 600) || ['EENVELOPE', 'EAUTH'].includes(err.code);

export function firstExamStart(date, model, config) {
    const starts = model.timetable.filter((e) => e.date === date).map((e) => config.slots.find((s) => s.id === e.slotId).start).sort();
    return starts.length ? DateTime.fromISO(`${date}T${starts[0]}`, { zone: config.timezone }).toJSDate() : null;
}

// Dependencies are injected for tests. Dry runs never claim deliveries or send mail;
// scheduled dry runs keep only a run record to avoid rebuilding the same previews each minute.
export async function runReminder({ config, date: requestedDate, mode, scheduled = false, runId, store, users, loader = loadDataset, sendMail = sendExamMail, env = process.env, now = () => new Date(), pause = sleep, logger = console, onPreview = async () => {} }) {
    const date = targetDate(requestedDate, config.timezone);
    const modeName = mode.dryRun ? 'DRY_RUN' : mode.test ? 'TEST' : 'LIVE';
    const summary = { datasetId: config.id, date, mode: modeName, outcome: 'STARTED', counts: { sent: 0, failed: 0, alreadySent: 0, exhausted: 0, permanentFailure: 0, waiting: 0, wouldSend: 0 } };
    if (!mode.dryRun && (env.EXAM_REMINDERS_SEND_ENABLED !== 'true' || !validEmail(env.EXAM_REMINDERS_ADMIN_EMAIL) || !validEmail(env.EXAM_REMINDERS_FROM || env.SMTP_USER))) throw new Error('Sending requires EXAM_REMINDERS_SEND_ENABLED=true, a valid admin email, and a valid sender address');
    if (!mode.dryRun && !store) throw new Error('A persistent database store is required for sending');
    if (mode.test && !mode.rolls.length && !mode.emails.length) throw new Error('Test mode requires a nonempty allowlist');
    let run;
    let activeClaim;
    let heartbeatError;
    let heartbeat;
    let nextRunAt = null;
    const retryTimes = [];
    const previews = [];
    try {
        if (!mode.dryRun || (scheduled && store)) {
            const id = runId || (scheduled ? `scheduled:${config.id}:${date}:${modeName}` : randomUUID());
            run = await store.claimRun({ id, datasetId: config.id, examDate: date, mode: modeName }, now());
            if (!run) return { ...summary, outcome: 'SKIPPED_LOCKED_OR_COMPLETE' };
            summary.runId = id;
            let renewing = false;
            heartbeat = setInterval(async () => {
                if (renewing) return;
                renewing = true;
                try {
                    await store.renewRun(run, now());
                    const claim = activeClaim;
                    if (claim) {
                        try { await store.renewDelivery(claim, now()); }
                        catch (err) {
                            // The send can complete while its renewal query is in flight.
                            if (activeClaim === claim) throw err;
                        }
                    }
                } catch (err) { heartbeatError = err; }
                finally { renewing = false; }
            }, 60_000);
            heartbeat.unref?.();
        }
        const loaded = await loader(config, { cache: store?.cache, logger });
        const { model, report, metadata } = loaded;
        summary.source = metadata; summary.quality = report;
        const cutoff = firstExamStart(date, model, config);
        if (scheduled && cutoff && now() >= cutoff) {
            summary.outcome = 'MISSED_SEND_WINDOW';
        } else if (model.holidays.has(date) || !cutoff) {
            summary.outcome = model.holidays.has(date) ? 'HOLIDAY' : 'NO_EXAMS';
        } else {
            const index = buildIndex(model);
            const planned = planRecipients(users || await store.users(), date, model, config, mode, index);
            Object.assign(summary.counts, planned.summary);
            summary.duplicateUsers = planned.duplicates; summary.invalidUsers = planned.invalidUsers;
            summary.counts.eligible = planned.recipients.length;
            const interval = 60_000 / config.delivery.maxPerMinute;
            let sentInBatch = 0;
            let lastAttemptAt = null;
            for (const recipient of planned.recipients) {
                if (heartbeatError) throw heartbeatError;
                const message = reminderMail(recipient, date, config);
                if (mode.dryRun) {
                    summary.counts.wouldSend++;
                    await onPreview({ to: recipient.email, roll: recipient.roll, ...message });
                    previews.push({ roll: recipient.roll, exams: recipient.exams.length });
                    continue;
                }
                if (lastAttemptAt !== null) await pause(Math.max(0, interval - (now().getTime() - lastAttemptAt)));
                if (scheduled && now() >= cutoff) { summary.counts.waiting++; summary.outcome = 'MISSED_SEND_WINDOW'; continue; }
                const key = { datasetId: config.id, roll: recipient.roll, examDate: date };
                const claim = await store.claimDelivery(key, recipient.email, config.delivery.maxAttempts, now());
                if (claim.skipped) {
                    if (claim.skipped === 'SENT') summary.counts.alreadySent++;
                    else if (claim.skipped === 'EXHAUSTED') summary.counts.exhausted++;
                    else if (claim.skipped === 'PERMANENT_FAILURE') summary.counts.permanentFailure++;
                    else { summary.counts.waiting++; if (claim.retryAt) retryTimes.push(claim.retryAt); }
                    continue;
                }
                activeClaim = claim;
                if (heartbeatError) throw heartbeatError;
                await store.renewRun(run, now());
                lastAttemptAt = now().getTime();
                let messageId;
                try {
                    // Stable Message-ID can help provider diagnostics; SMTP does not promise deduplication.
                    messageId = await sendMail(recipient.email, message, { env, messageId: `<exam-${digest(`${config.id}|${recipient.roll}|${date}`)}@acc.iitp.ac.in>` });
                } catch (err) {
                    const permanent = isPermanent(err);
                    const exhausted = claim.attempts >= config.delivery.maxAttempts;
                    const retryAt = permanent || exhausted ? null : new Date(now().getTime() + config.delivery.retryMinutes[Math.min(claim.attempts - 1, config.delivery.retryMinutes.length - 1)] * 60_000);
                    await store.completeDelivery(claim, { status: permanent ? 'PERMANENT_FAILURE' : exhausted ? 'EXHAUSTED' : 'RETRY', nextRetryAt: retryAt, lastError: errorText(err), uncertain: !permanent });
                    summary.counts.failed++;
                    if (retryAt) retryTimes.push(retryAt);
                    activeClaim = null;
                    logger.error(`[exams] ${config.id}: delivery failed (attempt ${claim.attempts}, permanent=${Boolean(permanent)})`);
                    continue;
                }
                // A DB error after SMTP acceptance is uncertain, not a confirmed SMTP failure.
                // Leave the SENDING claim to expire; the recovery policy explicitly allows retry.
                await store.completeDelivery(claim, { status: 'SENT', sentAt: now(), messageId, nextRetryAt: null, lastError: null });
                activeClaim = null;
                summary.counts.sent++;
                if (++sentInBatch >= config.delivery.batchSize) { sentInBatch = 0; await pause(0); }
            }
            if (summary.outcome === 'STARTED') summary.outcome = mode.dryRun ? 'DRY_RUN' : retryTimes.length ? 'RETRY_PENDING' : summary.counts.failed + summary.counts.exhausted + summary.counts.permanentFailure > 0 ? 'COMPLETE_WITH_FAILURES' : 'COMPLETE';
        }
        if (retryTimes.length && summary.outcome !== 'MISSED_SEND_WINDOW') nextRunAt = new Date(Math.min(...retryTimes.map((d) => d.getTime())));
    } catch (err) {
        summary.outcome = 'FAILED'; summary.error = errorText(err);
        logger.error(`[exams] ${config.id}: ${summary.error}`);
        if (run && (run.attempts || 1) < 3) nextRunAt = new Date(now().getTime() + 5 * 60_000);
    }
    try {
        if (run) {
            const deliveries = await store.deliveries(config.id, date);
            summary.deliveryTotals = Object.fromEntries(['SENT', 'RETRY', 'SENDING', 'EXHAUSTED', 'PERMANENT_FAILURE'].map((status) => [status, deliveries.filter((d) => d.status === status).length]));
            // Keep the run lease until the admin summary finishes as well.
            if (!mode.dryRun) {
                try {
                    // The admin summary uses the same provider allowance as student messages.
                    await pause(60_000 / config.delivery.maxPerMinute);
                    await sendMail(env.EXAM_REMINDERS_ADMIN_EMAIL, summaryMail(summary), { env });
                    await store.adminResult(run.id, null);
                } catch (err) {
                    summary.adminError = errorText(err);
                    logger.error(`[exams] ${config.id}: admin summary failed: ${summary.adminError}`);
                    await store.adminResult(run.id, summary.adminError);
                }
            }
            await store.finishRun(run, summary, nextRunAt);
        }
        logger.info(`[exams] ${config.id} ${date}: ${summary.outcome} ${JSON.stringify(summary.counts)}`);
        return { ...summary, ...(mode.dryRun ? { previews } : {}) };
    } finally {
        clearInterval(heartbeat);
    }
}
