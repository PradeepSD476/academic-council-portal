import careerVaultTemplate from "../../templates/careerVaultTemplate.js";
import transporter from "./transporter.js";
import prisma from "../../config/db.js";
import { notificationAllowed, notificationRecipientWhere, validNotificationEmail } from '../../services/notifications/preferences.js';

const getEmailReciever = async (db) => {
	try {
		const students = await db.user.findMany({ where: notificationRecipientWhere('careerVaultExperiencesEnabled'), select: { id: true, email: true } });
		return students;
	} catch (error) {
		throw error;
	}
}

export async function sendCareerVaultMail({ to, name, experienceTitle, experienceType, company }) {
  const { subject, html, text } = careerVaultTemplate({ name, experienceTitle, experienceType, company });

  const info = await transporter.sendMail({
    from: `"Academic & Career Council" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });

  return info.messageId;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


export default async function notifyOnNewPost({ displayName, experienceTitle, experienceType, company }, { db = prisma, send = sendCareerVaultMail, allowed = notificationAllowed, pause = sleep, pauseMs = 300 } = {}) {
	const summary = { sent: 0, skipped: 0, failed: 0 };
	try {
		const recievers = await getEmailReciever(db);
		for (const val of recievers) {
			let attempted = false;
			try {
				if (!validNotificationEmail(val.email) || !(await allowed(val.id, 'careerVaultExperiencesEnabled', db))) { summary.skipped++; continue; }
				attempted = true;
				await send({ to: val.email.trim(), name: displayName, experienceTitle, experienceType, company });
				summary.sent++;
			} catch (mailErr) {
				summary.failed++;
				console.error(mailErr)
			} finally { if (attempted && pauseMs) await pause(pauseMs); }
		}
	} catch (error) {
		summary.error = 'Unable to finish loading experience notification recipients.';
		console.error("Mail Service Stopped: ", error)
	}
	console.info('[notifications] Experience emails:', JSON.stringify(summary));
	return summary;
}
