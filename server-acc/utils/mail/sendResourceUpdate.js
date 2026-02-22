import resourceTemplate from "../../templates/resourceTemplate.js";
import transporter from "./transporter.js";
import prisma from "../../config/db.js";

const getEmailReciever = async ({ allowedBranches, academicYear }) => {
	const currentYear = new Date().getFullYear();
	const currentMonth = new Date().getMonth();
	const admissionYear = (currentMonth > 6) ? currentYear - parseInt(academicYear) + 1 : currentYear - parseInt(academicYear);
	try {
		const students = await prisma.user.findMany({
			where: {
				branchName: {
					in: allowedBranches,
				},
				admissionYear: admissionYear
			},
			select: {
				email: true,
				displayName: true
			}
		})
		return students;
	} catch (error) {
		console.log(error);
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


export default async function notifyOnResourceUpdate({ resourceType, resourceTitle, courseCode, displayName, allowedBranches, academicYear }) {
	try {
		const recievers = await getEmailReciever({ allowedBranches, academicYear });
		for (const val of recievers) {
			try {
				await sendResourceUpdateMail({ to: val.email, resourceType, resourceTitle, courseCode, displayName })
				await sleep(300);
			} catch (mailErr) {
				console.error(mailErr)
			}
		}
	} catch (error) {
		console.error("Mail Service Stopped: ", error)
	}
}
