// The daily job-alert run (P7-T1): for every due alert, find the LIVE postings published since its
// last run and email a digest. Nothing is sent while the feature is hidden from students or the admin
// switch is off. A digest with no postings is not sent (the window still moves on). A failed send
// leaves lastRunAt alone, so the next run retries with the same window, and records lastError (shown
// to the student and as an ops alert).
import prisma from '../../../config/db.js';
import { getSetting } from '../settings.js';
import { eligibilityProfile } from '../postings/eligibility.js';
import { eligibilityWhere } from '../postings/query.js';
import { cardFields } from '../postings/cards.js';
import { isDue, alertWindow, alertParams, alertPostingsWhere, DIGEST_LIMIT } from './savedSearch.js';
import { digestMail } from './digestMail.js';
import { sendCareersMail, mailConfigured } from '../mail/careersMail.js';

const PAUSE_MS = 300; // between emails, like upstream's mailers
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runAlerts({ now = new Date(), transport, configured = mailConfigured(), clientUrl = process.env.CLIENT_URL, pauseMs = PAUSE_MS, onlyIds } = {}) {
    if (!(await getSetting('careers.visibleToStudents'))) return { skipped: 'the jobs feature is hidden from students' };
    if (!(await getSetting('careers.alertEmailsEnabled'))) return { skipped: 'job-alert emails are switched off (careers.alertEmailsEnabled)' };

    const alerts = await prisma.savedSearch.findMany({
        where: { unsubscribedAt: null, ...(onlyIds ? { id: { in: onlyIds } } : {}) },
        include: { user: { select: { email: true, branchName: true, admissionYear: true, cpi: true } } },
        orderBy: { id: 'asc' },
    });
    const due = alerts.filter((a) => isDue(a, now));
    const summary = { due: due.length, sent: 0, empty: 0, failed: 0 };

    if (due.length && (!configured || !clientUrl)) {
        const error = !configured ? 'Email is not configured on the server (SMTP_HOST / SMTP_USER).' : 'CLIENT_URL is not set, so the email links cannot be built.';
        await prisma.savedSearch.updateMany({ where: { id: { in: due.map((a) => a.id) } }, data: { lastError: error } });
        console.error(`[careers] job alerts: ${error} ${due.length} alert(s) waiting.`);
        return { ...summary, failed: due.length, error };
    }

    for (const alert of due) {
        try {
            const params = alertParams(alert.filters);
            const window = alertWindow(alert, now);
            const eligibility = params.eligibleOnly ? eligibilityWhere(eligibilityProfile(alert.user, now)) : null;
            const where = alertPostingsWhere(params, window, eligibility, alert.userId);
            const [total, postings] = await Promise.all([
                prisma.posting.count({ where }),
                prisma.posting.findMany({ where, select: cardFields, orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }], take: DIGEST_LIMIT }),
            ]);
            if (!total) {
                await prisma.savedSearch.update({ where: { id: alert.id }, data: { lastRunAt: now, lastError: null } });
                summary.empty += 1;
                continue;
            }
            const mail = digestMail({ alert, postings, total, clientUrl });
            await sendCareersMail({
                to: alert.user.email, subject: mail.subject, text: mail.text, html: mail.html,
                headers: { 'List-Unsubscribe': `<${mail.unsubscribeUrl}>` },
            }, transport);
            await prisma.savedSearch.update({ where: { id: alert.id }, data: { lastRunAt: now, lastSentAt: now, lastSentCount: total, lastError: null } });
            summary.sent += 1;
            if (pauseMs) await sleep(pauseMs);
        } catch (err) {
            summary.failed += 1;
            console.error(`[careers] job alert #${alert.id} failed`, err);
            await prisma.savedSearch.update({ where: { id: alert.id }, data: { lastError: String(err?.message ?? err).slice(0, 300) } })
                .catch((e) => console.error('[careers] could not record the job-alert error', e));
        }
    }
    console.info(`[careers] job alerts: ${JSON.stringify(summary)}`);
    return summary;
}
