import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export const sendMail = async (to, subject, text) => {
    // Check if SMTP credentials exist
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
        console.warn('⚠️ SMTP credentials not found in environment variables. Logging email to console instead.');
        console.log('----------------------------------------------------');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Message: ${text}`);
        console.log('----------------------------------------------------');
        return true; // Simulate success
    }

    try {
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: parseInt(SMTP_PORT, 10),
            secure: parseInt(SMTP_PORT, 10) === 465, // true for 465, false for other ports
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS,
            },
        });

        const info = await transporter.sendMail({
            from: `"Student Mentorship Program" <${SMTP_USER}>`,
            to,
            subject,
            text,
        });

        console.log(`Message sent: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};
