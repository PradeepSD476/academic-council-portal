// Email sent to a student when someone answers their doubt.
// Names and titles come from users, so they are escaped before going into HTML.
const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const doubtAnswerTemplate = ({ askerName, answererName, doubtTitle, answerPreview, threadUrl }) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #333;">
      <h2 style="color: #1a73e8;">Your doubt has a new answer</h2>

      <p>Dear ${escapeHtml(askerName || "Student")},</p>

      <p><strong>${escapeHtml(answererName || "Someone")}</strong> answered your doubt on the ACC Doubt Forum.</p>

      <p><strong>Your doubt:</strong> ${escapeHtml(doubtTitle)}</p>

      ${answerPreview ? `<blockquote style="margin: 12px 0; padding: 8px 12px; border-left: 3px solid #ccc; color: #555;">${escapeHtml(answerPreview)}</blockquote>` : ""}

      ${
        threadUrl
          ? `<p><a href="${escapeHtml(threadUrl)}" style="display: inline-block; padding: 10px 18px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px;">View the answer</a></p>`
          : `<p>Log in to the portal and open the Doubt Forum to read it.</p>`
      }

      <p style="font-size: 13px; color: #666;">If this answer solves your doubt, please mark it as accepted so others can find it too.</p>

      <br/>

      <p>Best regards,</p>
      <p><strong>Academic Council Portal Team</strong></p>
    </div>
  `;
};

export default doubtAnswerTemplate;
