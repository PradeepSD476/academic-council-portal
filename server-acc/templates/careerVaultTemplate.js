export default function careerVaultTemplate({
    name,
    experienceType,
    experienceTitle,
}) {
    return {
        subject: `${name} shared their ${experienceType} experience`,

        text: `
Hello,

${name} has shared their ${experienceType} experience on the Academic & Career Council portal.

Title: "${experienceTitle}"

Read the full experience here:
https://acc.iitp.ac.in

Learn from peers, explore preparation strategies, and stay informed.

Regards,
Academic & Career Council
Indian Institute of Technology Patna
    `.trim(),

        html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #0b5ed7;">New Career Vault Experience</h2>

        <p>Hello,</p>

        <p>
          <strong>${name}</strong> has shared their 
          <strong>${experienceType}</strong> experience.
        </p>

        <div
          style="
            margin: 20px 0;
            padding: 16px;
            background-color: #f4f6f8;
            border-left: 4px solid #0b5ed7;
          "
        >
          <p style="margin: 0; font-size: 15px;">
            <strong>Title:</strong> "${experienceTitle}"
          </p>
        </div>

        <div
          style="
            margin: 24px 0;
            text-align: center;
          "
        >
          <a
            href="https://acc.iitp.ac.in"
            style="
              display: inline-block;
              padding: 12px 20px;
              background-color: #0b5ed7;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              font-size: 15px;
            "
          >
            Read Experience
          </a>
        </div>

        <p>
          Explore insights, preparation strategies, interview processes, and real experiences shared by fellow students.
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
