import resourceTemplate from "../../templates/resourceTemplate.js";
import transporter from "./transporter.js";
import prisma from "../../config/db.js";
import { notificationAllowed, notificationRecipientWhere, validNotificationEmail } from '../../services/notifications/preferences.js';

const getEmailReciever = async ({ allowedBranches, academicYear }, db) => {
	const currentYear = new Date().getFullYear();
	const currentMonth = new Date().getMonth();
	const admissionYear = (currentMonth > 6) ? currentYear - parseInt(academicYear) + 1 : currentYear - parseInt(academicYear);
	try {
		const students = await db.user.findMany({
			where: {
				branchName: {
					in: allowedBranches,
				},
				admissionYear: admissionYear,
				...notificationRecipientWhere('resourcesEnabled'),
			},
			select: {
				id: true,
				email: true,
				displayName: true
			}
		})
		return students;
	} catch (error) {
		throw error;
	}
}

export async function sendResourceUpdateMail({ to, resourceType, resourceTitle, courseCode, displayName }) {
	const { subject, html, text } = resourceTemplate({ resourceType, resourceTitle, courseCode, displayName });

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


export default async function notifyOnResourceUpdate({ resourceType, resourceTitle, courseCode, displayName, allowedBranches, academicYear }, { db = prisma, send = sendResourceUpdateMail, allowed = notificationAllowed, pause = sleep, pauseMs = 300 } = {}) {
	const summary = { sent: 0, skipped: 0, failed: 0 };
	try {
		const recievers = await getEmailReciever({ allowedBranches, academicYear }, db);
		for (const val of recievers) {
			let attempted = false;
			try {
				if (!validNotificationEmail(val.email) || !(await allowed(val.id, 'resourcesEnabled', db))) { summary.skipped++; continue; }
				attempted = true;
				await send({ to: val.email.trim(), resourceType, resourceTitle, courseCode, displayName });
				summary.sent++;
			} catch (mailErr) {
				summary.failed++;
				console.error(mailErr)
			} finally { if (attempted && pauseMs) await pause(pauseMs); }
		}
	} catch (error) {
		summary.error = 'Unable to finish loading resource notification recipients.';
		console.error("Mail Service Stopped: ", error)
	}
	console.info('[notifications] Resource emails:', JSON.stringify(summary));
	return summary;
}
