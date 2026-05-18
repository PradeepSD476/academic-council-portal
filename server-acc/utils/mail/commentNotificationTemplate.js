const commentNotificationTemplate = ({ postAuthorName, commenterName, postTitle }) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #333;">
      <h2 style="color: #1a73e8;">New Comment on Your Post</h2>
      
      <p>Dear ${postAuthorName},</p>

      <p>
        We wanted to let you know that a new comment has been posted on one of your discussions.
      </p>

      <p><strong>Post Title:</strong> ${postTitle}</p>
      <p><strong>Commented By:</strong> ${commenterName}</p>

      <p>
        Please log in to your account to review the comment and continue the discussion.
      </p>

      <br/>

      <p>Best regards,</p>
      <p><strong>Academic Council Portal Team</strong></p>
    </div>
  `;
};

export default  commentNotificationTemplate;