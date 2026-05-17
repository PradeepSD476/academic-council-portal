import transporter from "./transporter.js";
import replyTemplate from "./replyNotificationTemplate.js";

const sendReplyNotification = async ({
  to,
  commentAuthorName,
  replierName,
  postTitle,
}) => {
  // Debug logs
  console.log("===== REPLY NOTIFICATION =====");
  console.log("Mail going to:", to);
  console.log("Comment author:", commentAuthorName);
  console.log("Replier:", replierName);
  console.log("Post title:", postTitle);
  console.log("==============================");

  await transporter.sendMail({
    to,
    subject: "Someone Replied to Your Comment",
    html: replyTemplate({
      commentAuthorName,
      replierName,
      postTitle,
    }),
  });

  console.log("Reply notification mail sent successfully.");
};

export default sendReplyNotification;
