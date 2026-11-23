import { randomUUID } from 'node:crypto';
import prisma from '../../../config/db.js';
import { getSetting } from '../settings.js';
import { sendCareersMail, mailConfigured } from '../mail/careersMail.js';
import { effectiveNotificationSettings, validNotificationEmail } from '../../notifications/preferences.js';
import jobPublishedTemplate, { jobPublicationUrl } from '../../../templates/jobPublishedTemplate.js';

const MAX_ATTEMPTS = 3;
const LEASE_MS = 15 * 60_000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const keyOf = ({ postingId, userId }) => ({ postingId, userId });
const permanentFailure = (err) => err.permanent || (err.responseCode >= 500 && err.responseCode < 600) || ['EAUTH', 'EENVELOPE'].includes(err.code);
const unfinished = ['PENDING', 'SENDING'];

// Called INSIDE the publishing transaction. A rolled-back approval never creates a broadcast.
export async function enqueueJobPublication(tx, postingId) {
    const visibility = await tx.appSetting.findUnique({ where: { key: 'careers.visibleToStudents' }, select: { value: true } });
    if (visibility?.value !== true) return;
    // Native conflict-ignore also covers simultaneous approvals and Undo/re-approval.
    await tx.jobPublicationNotification.createMany({ data: [{ postingId }], skipDuplicates: true });
}

export async function preparePublicationAudience(db, event, batchSize = 100) {
    if (event.audienceComplete) return;
    await db.$transaction(async (tx) => {
        const users = await tx.user.findMany({
            where: { id: { gt: event.audienceCursor }, createdAt: { lte: event.createdAt } },
            select: { id: true, email: true, notificationSettings: { select: { jobsInternshipsEnabled: true } } },
            orderBy: { id: 'asc' }, take: batchSize,
        });
        if (users.length) await tx.jobPublicationDelivery.createMany({ data: users.map((user) => ({
            postingId: event.postingId, userId: user.id,
            status: !effectiveNotificationSettings(user.notificationSettings).jobsInternshipsEnabled ? 'SKIPPED_OPT_OUT' : !validNotificationEmail(user.email) ? 'SKIPPED_INVALID_EMAIL' : 'PENDING',
        })), skipDuplicates: true });
        await tx.jobPublicationNotification.updateMany({
            where: { postingId: event.postingId, status: 'PENDING', audienceCursor: event.audienceCursor },
            data: { audienceCursor: users.at(-1)?.id ?? event.audienceCursor, audienceComplete: users.length < batchSize },
        });
    });
}

async function cancelEvent(db, postingId) {
    await db.$transaction(async (tx) => {
        await tx.jobPublicationNotification.updateMany({ where: { postingId, status: 'PENDING' }, data: { status: 'CANCELLED' } });
        await tx.jobPublicationDelivery.updateMany({ where: { postingId, status: { in: unfinished } }, data: { status: 'CANCELLED', claimToken: null, leaseUntil: null } });
    });
}

export async function claimPublicationDelivery(db, row, now) {
    const where = { ...keyOf(row), status: row.status, attempts: row.attempts, claimToken: row.claimToken, ...(row.status === 'SENDING' ? { leaseUntil: { lte: now } } : { nextAttemptAt: { lte: now } }) };
    if (row.attempts >= MAX_ATTEMPTS) {
        await db.jobPublicationDelivery.updateMany({ where, data: { status: 'FAILED', leaseUntil: null, claimToken: null, lastError: 'Maximum delivery attempts reached; last outcome may be uncertain.' } });
        return null;
    }
    const claimToken = randomUUID();
    const result = await db.jobPublicationDelivery.updateMany({ where, data: { status: 'SENDING', attempts: { increment: 1 }, claimToken, leaseUntil: new Date(+now + LEASE_MS) } });
    return result.count ? { ...keyOf(row), claimToken, attempts: row.attempts + 1 } : null;
}

async function finishDelivery(db, claim, data) {
    const result = await db.jobPublicationDelivery.updateMany({ where: { ...keyOf(claim), status: 'SENDING', claimToken: claim.claimToken }, data: { ...data, claimToken: null, leaseUntil: null } });
    if (!result.count) throw new Error('Publication email claim was lost while recording its outcome.');
}

// Worker entrypoint; jobs.js holds the existing transaction-scoped advisory job lock.
// Per-recipient claims and successful writes are independently committed so a restart cannot
// roll back accepted-email records with the enclosing job-lock transaction.
export async function runPublicationNotifications({ db = prisma, readSetting = getSetting, configured = mailConfigured(), clientUrl = process.env.CLIENT_URL, send = sendCareersMail, pause = sleep, pauseMs = 300, batchSize = 25, now = () => new Date(), budgetMs = 30_000, logger = console } = {}) {
    if (!(await readSetting('careers.visibleToStudents'))) return { skipped: 'Jobs & Internships is hidden from students.' };
    const events = await db.jobPublicationNotification.findMany({ where: { status: 'PENDING' }, orderBy: { createdAt: 'asc' }, take: 5 });
    const summary = { sent: 0, failed: 0, skipped: 0, claimed: 0 };
    if (!events.length) return summary;
    if (!configured || !clientUrl) {
        logger.error('[careers] Publication emails waiting: configure SMTP_HOST, SMTP_USER and CLIENT_URL.');
        return { ...summary, deferred: 'Mail or portal URL is not configured.' };
    }
    // Validate before consuming any delivery attempts.
    jobPublicationUrl(clientUrl, events[0].postingId);
    const started = +now();
    let lastSendAt = null;
    for (const event of events) {
        const posting = await db.posting.findUnique({ where: { id: event.postingId }, select: { status: true, company: { select: { status: true } } } });
        if (!posting || posting.status !== 'LIVE' || posting.company.status !== 'ACTIVE') { await cancelEvent(db, event.postingId); continue; }
        await preparePublicationAudience(db, event);
        const rows = await db.jobPublicationDelivery.findMany({
            where: { postingId: event.postingId, OR: [{ status: 'PENDING', nextAttemptAt: { lte: now() } }, { status: 'SENDING', leaseUntil: { lte: now() } }] },
            orderBy: { userId: 'asc' }, take: batchSize - summary.claimed,
        });
        for (const row of rows) {
            if (+now() - started >= budgetMs || summary.claimed >= batchSize) break;
            if (lastSendAt !== null) await pause(Math.max(0, pauseMs - (+now() - lastSendAt)));
            const claim = await claimPublicationDelivery(db, row, now());
            if (!claim) continue;
            summary.claimed++;
            let accepted = false;
            try {
                const [user, current] = await Promise.all([
                    db.user.findUnique({ where: { id: row.userId }, select: { email: true, notificationSettings: { select: { jobsInternshipsEnabled: true } } } }),
                    db.posting.findUnique({ where: { id: event.postingId }, select: { roleTitle: true, type: true, status: true, company: { select: { status: true } } } }),
                ]);
                if (!current || current.status !== 'LIVE' || current.company.status !== 'ACTIVE') { await cancelEvent(db, event.postingId); break; }
                if (!(await readSetting('careers.visibleToStudents'))) {
                    await finishDelivery(db, claim, { status: 'PENDING', attempts: { decrement: 1 } });
                    return { ...summary, deferred: 'Jobs & Internships was hidden during this batch.' };
                }
                if (!user) { summary.skipped++; continue; } // Account deletion cascades its delivery row.
                if (!effectiveNotificationSettings(user.notificationSettings).jobsInternshipsEnabled || !validNotificationEmail(user.email)) {
                    await finishDelivery(db, claim, { status: !validNotificationEmail(user.email) ? 'SKIPPED_INVALID_EMAIL' : 'SKIPPED_OPT_OUT' });
                    summary.skipped++; continue;
                }
                const message = jobPublishedTemplate({ title: current.roleTitle, type: current.type, url: jobPublicationUrl(clientUrl, event.postingId) });
                lastSendAt = +now();
                await send({ to: user.email.trim(), ...message });
                accepted = true;
                await finishDelivery(db, claim, { status: 'SENT', sentAt: now(), lastError: null });
                summary.sent++;
            } catch (err) {
                if (accepted) {
                    // Leave SENDING to expire: SMTP acceptance and a DB commit are not atomic.
                    logger.error('[careers] Publication email accepted but its result could not be saved; recovery may retry it.');
                    throw err;
                }
                const retry = !permanentFailure(err) && claim.attempts < MAX_ATTEMPTS;
                await finishDelivery(db, claim, { status: retry ? 'PENDING' : 'FAILED', nextAttemptAt: new Date(+now() + (claim.attempts === 1 ? 60_000 : 300_000)), lastError: String(err.message || err).slice(0, 1000) });
                summary.failed++;
                logger.error(`[careers] Publication #${event.postingId} delivery failed (attempt ${claim.attempts}).`);
            }
        }
        const latest = await db.jobPublicationNotification.findUnique({ where: { postingId: event.postingId } });
        if (latest?.status === 'PENDING' && latest.audienceComplete && !(await db.jobPublicationDelivery.count({ where: { postingId: event.postingId, status: { in: unfinished } } }))) {
            await db.jobPublicationNotification.updateMany({ where: { postingId: event.postingId, status: 'PENDING' }, data: { status: 'COMPLETE' } });
        }
        if (summary.claimed >= batchSize || +now() - started >= budgetMs) break;
    }
    logger.info(`[careers] Publication emails: ${JSON.stringify(summary)}`);
    return summary;
}
