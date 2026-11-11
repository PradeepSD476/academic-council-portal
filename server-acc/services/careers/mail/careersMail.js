// Careers email (P7-T1 alerts, P7-T5 admin reminders) through the existing nodemailer transporter.
// Never upstream's notifyOnNewPost, which mails every user.
import transporter from '../../../utils/mail/transporter.js';

export const mailConfigured = (env = process.env) => Boolean(env.SMTP_HOST && env.SMTP_USER);

// transport: injectable for tests and dev checks (e.g. nodemailer's jsonTransport).
export async function sendCareersMail({ to, subject, text, html, headers }, transport = transporter) {
    const info = await transport.sendMail({
        from: `"Academic & Career Council" <${process.env.SMTP_USER}>`,
        to, subject, text, html, headers,
    });
    return info.messageId;
}
