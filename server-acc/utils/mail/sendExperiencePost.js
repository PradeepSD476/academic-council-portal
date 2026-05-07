import careerVaultTemplate from "../../templates/careerVaultTemplate.js";
import transporter from "./transporter.js";

export default async function sendCareerVaultMail({ to, name, experienceTitle, experienceType }) {
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