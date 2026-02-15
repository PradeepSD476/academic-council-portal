
export default function resourceTemplate({ courseCode, displayName, resourceTitle, resourceType }) {
  return {
    subject: `New ${resourceType} uploaded for ${courseCode}`,

    text: `
Hello,

A new resource titled "${resourceTitle}" has been uploaded for the course ${courseCode} by ${displayName} on the Academic & Career Council portal.

You can access it now at:
https://acc.iitp.ac.in

Stay updated and keep learning!

Regards,
Academic & Career Council
Indian Institute of Technology Patna
    `.trim(),

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #0b5ed7;">New Resource Uploaded</h2>

        <p>Hello,</p>

        <p>
          A new resource titled 
          <strong>"${resourceTitle}"</strong> has been uploaded for the course 
          <strong>${courseCode}</strong>.
        </p>

        <p>
          Uploaded by: <strong>${displayName}</strong>
        </p>

        <div
          style="
            margin: 24px 0;
            padding: 16px;
            background-color: #f4f6f8;
            border-left: 4px solid #0b5ed7;
            text-align: center;
          "
        >
          <a 
            href="https://acc.iitp.ac.in"
            style="
              text-decoration: none;
              color: #0b5ed7;
              font-weight: bold;
              font-size: 16px;
            "
          >
            Access Resource on ACC Portal
          </a>
        </div>

        <p>
          Stay updated with the latest academic resources and make the most of your preparation.
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
