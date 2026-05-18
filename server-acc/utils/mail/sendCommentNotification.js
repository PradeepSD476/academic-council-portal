import transporter from "./transporter.js";
import commentNotificationTemplate from "./commentNotificationTemplate.js";

const sendCommentNotification = async ({
  to,
  postAuthorName,
  commenterName,
  postTitle,
}) => {
  await transporter.sendMail({
    to,
    subject: "New Comment on Your Post",
    html: commentNotificationTemplate({
      postAuthorName,
      commenterName,
      postTitle,
    }),
  });
};

export default sendCommentNotification;