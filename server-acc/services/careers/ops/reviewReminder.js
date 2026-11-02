// Review reminders (P7-T5, F-31): postings only help while they are fresh. Ops shows an amber alert
// when a posting has waited for review more than 48 hours; once a day, career admins get an email
// when something has waited more than 24 hours (only when the admin switch is on, and never when
// nothing is waiting). Pure parts first; runReviewReminder is the thin DB / mail wrapper.
import prisma from '../../../config/db.js';
import { getSetting, setSetting, clearSettingsCache } from '../settings.js';
import { istDayStart } from '../istDate.js';
import { needsPersonWhere, aiTierUsable } from '../links/waiting.js';
import { sendCareersMail, mailConfigured } from '../mail/careersMail.js';

const HOUR_MS = 60 * 60 * 1000;
export const REMIND_AFTER_HOURS = 24;
export const ALERT_AFTER_HOURS = 48;

// Pure. "2 days" / "30 hours".
export function waitedText(oldest, now = new Date()) {
    const hours = Math.floor((now.getTime() - new Date(oldest).getTime()) / HOUR_MS);
    return hours >= 48 ? `${Math.floor(hours / 24)} days` : `${hours} hours`;
}

// Pure. summary: { postingsWaiting, postingsOverdue, oldestPosting, linksOverdue }.
export const shouldRemind = (s) => s.postingsOverdue > 0 || s.linksOverdue > 0;

// Pure: the email body. Counts only; no student names, no link notes.
export function reminderMail(s, { clientUrl, now = new Date() }) {
    const base = String(clientUrl ?? '').replace(/\/+$/, '');
    const lines = [];
    if (s.postingsOverdue > 0) {
        lines.push(`${s.postingsWaiting} posting${s.postingsWaiting === 1 ? '' : 's'} waiting for review, ${s.postingsOverdue} for more than ${REMIND_AFTER_HOURS} hours (oldest ${waitedText(s.oldestPosting, now)}).`);
    }
    if (s.linksOverdue > 0) {
        lines.push(`${s.linksOverdue} student link${s.linksOverdue === 1 ? '' : 's'} waiting for a person for more than ${REMIND_AFTER_HOURS} hours.`);
    }
    const subject = s.postingsOverdue > 0
        ? `Jobs review: ${s.postingsWaiting} waiting, oldest ${waitedText(s.oldestPosting, now)}`
        : `Jobs review: ${s.linksOverdue} student link${s.linksOverdue === 1 ? '' : 's'} waiting`;
    const url = `${base}/admin/careers/review`;
    const text = [...lines, '', `Open the review queue: ${url}`, '', 'Students only see an opening after it is approved, so a long queue means stale or missing roles.',
        'You get this because you are a career admin. It is sent at most once a day and only while something waits; an admin can turn it off under Operations → Feature flags.'].join('\n');
    const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#0f172a;max-width:600px">
      ${lines.map((l) => `<p>${l}</p>`).join('')}
      <p><a href="${url}" style="color:#1d4ed8;font-weight:600">Open the review queue</a></p>
      <p style="color:#475569;font-size:12px">Students only see an opening after it is approved. Sent at most once a day while something waits; it can be turned off under Operations → Feature flags.</p>
    </body></html>`;
    return { subject, text, html };
}

export async function waitingSummary(db = prisma, now = new Date()) {
    const remindBefore = new Date(now.getTime() - REMIND_AFTER_HOURS * HOUR_MS);
    const pending = { status: 'PENDING_REVIEW' };
    const linksWhere = needsPersonWhere(await aiTierUsable());
    const [postingsWaiting, postingsOverdue, oldest, linksOverdue] = await Promise.all([
        db.posting.count({ where: pending }),
        db.posting.count({ where: { ...pending, firstSeenAt: { lt: remindBefore } } }),
        db.posting.findFirst({ where: pending, orderBy: { firstSeenAt: 'asc' }, select: { firstSeenAt: true } }),
        db.linkSubmission.count({ where: { ...linksWhere, createdAt: { lt: remindBefore } } }),
    ]);
    return { postingsWaiting, postingsOverdue, oldestPosting: oldest?.firstSeenAt ?? null, linksOverdue };
}

// The daily run. Records what happened in careers.reviewReminderStatus, which Ops reads.
export async function runReviewReminder({ now = new Date(), transport, configured = mailConfigured(), clientUrl = process.env.CLIENT_URL, force = false } = {}) {
    clearSettingsCache();
    if (!(await getSetting('careers.reviewReminderEmails'))) return { skipped: 'review reminder emails are switched off (careers.reviewReminderEmails)' };
    const last = await getSetting('careers.reviewReminderStatus');
    if (!force && last?.sent > 0 && new Date(last.at) >= istDayStart(now)) return { skipped: 'already sent today' };

    const summary = await waitingSummary(prisma, now);
    if (!shouldRemind(summary)) return { skipped: 'nothing has waited more than 24 hours', summary };

    const record = (data) => setSetting('careers.reviewReminderStatus', { at: now.toISOString(), ...data });
    if (!configured || !clientUrl) {
        const error = !configured ? 'Email is not configured on the server (SMTP_HOST / SMTP_USER).' : 'CLIENT_URL is not set.';
        await record({ sent: 0, error });
        console.error(`[careers] review reminder: ${error}`);
        return { sent: 0, error, summary };
    }
    // Only the CAREER_ADMIN role: super admins and faculty can open the queue but did not sign up for mail.
    const admins = await prisma.user.findMany({ where: { role: 'CAREER_ADMIN' }, select: { email: true } });
    if (!admins.length) {
        await record({ sent: 0, error: 'There is no user with the CAREER_ADMIN role to email.' });
        return { sent: 0, error: 'no career admins', summary };
    }
    const mail = reminderMail(summary, { clientUrl, now });
    let sent = 0;
    const failures = [];
    for (const admin of admins) {
        try {
            await sendCareersMail({ to: admin.email, ...mail }, transport);
            sent += 1;
        } catch (err) {
            failures.push(String(err?.message ?? err).slice(0, 200));
            console.error('[careers] review reminder: send failed', err);
        }
    }
    await record({ sent, error: failures.length ? `${failures.length} of ${admins.length} emails failed: ${failures[0]}` : null });
    return { sent, failed: failures.length, summary };
}
