import otpTemplate from "../../templates/otpTemplate.js";
import transporter from "./transporter.js";

export default async function sendOTP({ to, name, otp }) {
  const { subject, html, text } = otpTemplate({ name, otp });

  const info = await transporter.sendMail({
    from: `"Academic & Career Council" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });

  return info.messageId;
}