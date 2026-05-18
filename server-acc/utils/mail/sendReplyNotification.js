import transporter from "./transporter.js";
import replyNotificationTemplate from "./replyNotificationTemplate.js";

const sendReplyNotification = async ({
  to,
  commentAuthorName,
  replierName,
  postTitle,
}) => {
  await transporter.sendMail({
    to,
    subject: "New Reply to Your Comment",
    html: replyNotificationTemplate({
      commentAuthorName,
      replierName,
      postTitle,
    }),
  });
};

export default sendReplyNotification;