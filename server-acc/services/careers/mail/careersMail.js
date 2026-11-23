// Careers digests, admin reminders and publication announcements share the existing transporter.
// Callers select their audience and enforce the relevant per-user notification preferences.
import transporter from '../../../utils/mail/transporter.js';

export const mailConfigured = (env = process.env) => Boolean(env.SMTP_HOST && env.SMTP_USER);

// transport: injectable for tests and dev checks (e.g. nodemailer's jsonTransport).
export async function sendCareersMail({ to, subject, text, html, headers }, transport = transporter) {
    const info = await transport.sendMail({
        from: `"Academic & Career Council" <${process.env.SMTP_USER}>`,
        to: { address: to }, subject, text, html, headers,
    });
    if (info.rejected?.length || (Array.isArray(info.accepted) && !info.accepted.length)) {
        const error = new Error('The mail provider rejected the recipient.'); error.permanent = true; throw error;
    }
    return info.messageId;
}
