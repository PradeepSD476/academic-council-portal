import resourceTemplate from "../../templates/resourceTemplate.js";
import transporter from "./transporter.js";

const allBranches = ['AI', 'CS', 'MM', 'MC', 'MT', 'EE', 'EC', 'VL', 'PC', 'CE', 'ST', 'GT', 'CB', 'CT', 'PH', 'ME', 'CM', 'ES']

const prefix = {
	AI: 'ai',
	CS: 'cse',
	MM: 'mm',
	MC: 'mc',
	EE: 'ee',
	EC: 'ec',
	VL: 'ec',
	PC: 'ee',
	CE: 'ce',
	ST: 'cest',
	GT: 'cegt',
	CB: 'cb',
	CT: 'ct',
	PH: 'ph',
	ME: 'me',
	ES: 'es',
	CM: 'ec',
	MT: 'me'
}


const getEmailReciever = ({ allowedBranches, academicYear }) => {
	const allExist = allowedBranches && allowedBranches.length === allBranches.length && allBranches.every(branch => allowedBranches.includes(branch));

	const currentYear = new Date().getFullYear() - 2000;
	const currentMonth = new Date().getMonth();
	const domain = '@iitp.ac.in';
	const admissionYear = (currentMonth > 6)? currentYear - parseInt(academicYear) + 1 : currentYear - parseInt(academicYear);
	if(allExist){
		return [`btech${admissionYear}${domain}`];
	}
	const prefixes = new Set();
	allowedBranches.forEach((branch) => { prefixes.add(prefix[branch]) });
	const result = []
	for (const value of prefixes){
		result.push(`${value}${admissionYear}b${domain}`);
	}
	return result;
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


export default async function notifyOnResourceUpdate({ resourceType, resourceTitle, courseCode, displayName, allowedBranches, academicYear }) {
	const array = getEmailReciever({ allowedBranches, academicYear });
	for (const val of array){
		await sendResourceUpdateMail({ to: val, resourceType, resourceTitle, courseCode, displayName })
	}
}
