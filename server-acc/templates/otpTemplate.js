export default function otpTemplate({ name, otp }) {
  return {
    subject: "Email Verification OTP – Academic & Career Council, IIT Patna",

    text: `
Hello ${name},

Your One-Time Password (OTP) for email verification on the Academic & Career Council portal is:

${otp}

This OTP is valid for a limited time. Please do not share it with anyone.

If you did not request this verification, you may safely ignore this email.

Regards,
Academic & Career Council
Indian Institute of Technology Patna
    `.trim(),

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #0b5ed7;">Email Verification</h2>

        <p>Hello <strong>${name}</strong>,</p>

        <p>
          Please use the following One-Time Password (OTP) to verify your email
          address on the <strong>Academic & Career Council</strong> portal.
        </p>

        <div
          style="
            margin: 24px 0;
            padding: 16px;
            background-color: #f4f6f8;
            border-left: 4px solid #0b5ed7;
            font-size: 20px;
            font-weight: bold;
            letter-spacing: 2px;
            text-align: center;
          "
        >
          ${otp}
        </div>

        <p>
          This OTP is valid for a limited time. For security reasons, please do
          not share it with anyone.
        </p>

        <p style="margin-top: 24px; font-size: 13px; color: #666;">
          If you did not request this email verification, you can safely ignore
          this message.
        </p>

        <hr style="margin: 24px 0;" />

        <p style="font-size: 12px; color: #777;">
          This is an automated message. Please do not reply.
        </p>

        <p style="font-size: 12px; color: #777;">
          © Academic & Career Council, Indian Institute of Technology Patna
        </p>
      </div>
    `,
  };
}
