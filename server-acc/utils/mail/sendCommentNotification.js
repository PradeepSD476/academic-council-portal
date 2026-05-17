import transporter from "./transporter.js";
import commentTemplate from "./commentNotificationTemplate.js";

const sendCommentNotification = async ({
  to,
  postAuthorName,
  commenterName,
  postTitle,
}) => {
  await transporter.sendMail({
    to,
    subject: "New Comment on Your Post",
    html: commentTemplate({
      postAuthorName,
      commenterName,
      postTitle,
    }),
  });
};

export default sendCommentNotification;
