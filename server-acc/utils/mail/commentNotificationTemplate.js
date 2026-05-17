const commentNotificationTemplate = ({
  postAuthorName,
  commenterName,
  postTitle,
}) => {
  return `
    <div>
      <h2>Hello ${postAuthorName}</h2>

      <p>
        ${commenterName} commented on your post:
      </p>

      <h3>${postTitle}</h3>

      <p>Login to check the comment.</p>
    </div>
  `;
};

export default commentNotificationTemplate;
