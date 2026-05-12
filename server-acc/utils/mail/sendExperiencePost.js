import careerVaultTemplate from "../../templates/careerVaultTemplate.js";
import transporter from "./transporter.js";
import prisma from "../../config/db.js";

const getEmailReciever = async () => {
	try {
		const students = await prisma.user.findMany();
		return students;
	} catch (error) {
		console.log(error);
	}
}

export async function sendCareerVaultMail({ to, name, experienceTitle, experienceType }) {
  const { subject, html, text } = careerVaultTemplate({ name, experienceTitle, experienceType });

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


export default async function notifyOnNewPost({ displayName, experienceTitle, experienceType }) {
	try {
		const recievers = await getEmailReciever();
		for (const val of recievers) {
			try {
				await sendCareerVaultMail({ to: val.email, name: displayName, experienceTitle: experienceTitle, experienceType: experienceType })
				await sleep(300);
			} catch (mailErr) {
				console.error(mailErr)
			}
		}
	} catch (error) {
		console.error("Mail Service Stopped: ", error)
	}
}
