import transporter from "./transporter.js";
import doubtAnswerTemplate from "./doubtAnswerTemplate.js";

const sendDoubtAnswerNotification = async ({ to, askerName, answererName, doubtTitle, answerPreview, threadUrl }) => {
  await transporter.sendMail({
    from: `"Academic & Career Council" <${process.env.SMTP_USER}>`,
    to,
    subject: `New answer to your doubt: ${doubtTitle}`.slice(0, 150),
    html: doubtAnswerTemplate({ askerName, answererName, doubtTitle, answerPreview, threadUrl }),
  });
};

export default sendDoubtAnswerNotification;
