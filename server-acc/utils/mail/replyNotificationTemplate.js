const replyNotificationTemplate = ({
  commentAuthorName,
  replierName,
  postTitle,
}) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #333;">
      <h2 style="color: #1a73e8;">New Reply to Your Comment</h2>

      <p>Dear ${commentAuthorName},</p>

      <p>
        We wanted to inform you that someone has replied to your comment on an ongoing discussion.
      </p>

      <p><strong>Post Title:</strong> ${postTitle}</p>
      <p><strong>Replied By:</strong> ${replierName}</p>

      <p>
        Please log in to your account to view the reply and continue the conversation.
      </p>

      <br/>

      <p>Best regards,</p>
      <p><strong>Academic Council Portal Team</strong></p>
    </div>
  `;
};

export default replyNotificationTemplate;