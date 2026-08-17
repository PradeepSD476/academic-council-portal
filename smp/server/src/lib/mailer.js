import nodemailer from 'nodemailer';

let transporter;

async function initMailer() {
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    });
  } else {
    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("Nodemailer: Initialized test ethereal account");
  }
}
initMailer();

export const sendMeetingNotification = async (emails, meetingTitle, meetingDate, meetingDesc) => {
  if (!transporter) await initMailer();
  if (!emails || emails.length === 0) return;

  const mailOptions = {
    from: '"Mentorship Portal" <noreply@mentorship.iitp.ac.in>',
    to: emails.join(', '),
    subject: `Upcoming Mentorship Meeting: ${meetingTitle}`,
    text: `Hello, you have a new mentorship meeting scheduled.\n\nTitle: ${meetingTitle}\nDate: ${new Date(meetingDate).toLocaleString()}\nDetails: ${meetingDesc || 'N/A'}\n\nPlease check your dashboard for more details.`,
    html: `<h3>Upcoming Mentorship Meeting: ${meetingTitle}</h3><p><strong>Date:</strong> ${new Date(meetingDate).toLocaleString()}</p><p><strong>Details:</strong><br/>${meetingDesc || 'N/A'}</p><br/><p>Please check your Mentorship Portal dashboard for more details.</p>`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email Notification sent to: %s", emails.join(', '));
    if (!process.env.SMTP_HOST) {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

export const sendBulkAnnouncement = async (emails, subject, message) => {
  if (!transporter) await initMailer();
  if (!emails || emails.length === 0) return;

  const safeSubject = subject?.trim() || 'Mentorship Portal Announcement';
  const safeMessage = message?.trim() || '';
  const htmlMessage = safeMessage
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');

  const mailOptions = {
    from: '"Mentorship Portal" <noreply@mentorship.iitp.ac.in>',
    bcc: emails,
    subject: safeSubject,
    text: safeMessage,
    html: `<h3>${safeSubject}</h3><p>${htmlMessage || 'No message content provided.'}</p>`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Announcement email sent to %d recipients', emails.length);
    if (!process.env.SMTP_HOST) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error) {
    console.error('Error sending announcement email:', error);
    throw error;
  }
};
