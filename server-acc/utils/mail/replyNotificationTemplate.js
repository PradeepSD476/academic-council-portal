const replyNotificationTemplate = ({
  commentAuthorName,
  replierName,
  postTitle,
}) => {
  return `
    <div>
      <h2>Hello ${commentAuthorName}</h2>

      <p>
        ${replierName} replied to your comment on:
      </p>

      <h3>${postTitle}</h3>

      <p>Login to check the reply.</p>
    </div>
  `;
};

export default replyNotificationTemplate;
