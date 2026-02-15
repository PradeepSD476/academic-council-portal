import resourceTemplate from "../../templates/resourceTemplate.js";
import transporter from "./transporter.js";

export default async function sendResourceUpdateMail({ to, resourceType, resourceTitle, courseCode, displayName }) {
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
