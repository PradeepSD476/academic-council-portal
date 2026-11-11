import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Upsert Category
  const academicCategory = await prisma.wikiCategory.upsert({
    where: { slug: 'academic-procedures' },
    update: {},
    create: {
      name: 'Academic & Fee Issues',
      slug: 'academic-procedures',
      description: 'Resolution processes for portal glitches, fee payments, and official forms.',
    },
  });

  // 2. Seed the guide with an upsert so rerunning this script updates it.
  const articleData = {
    title: 'Fee Payment Successful but Portal Not Updated',
    categoryId: academicCategory.id,
    isPublished: true,
    content: JSON.stringify({
      summary: 'What to do when your fee is paid or debited successfully but AIS still shows unpaid, pending, or an old payment status.',
      keywords: [
        'fee payment successful but portal not updated',
        'fee paid but AIS says unpaid',
        'money deducted but payment not reflected',
        'payment pending',
        'portal status not updated',
        'transaction ID',
        'UTR number',
        'bank debit',
        'payment receipt',
        'payment screenshot',
        'academic section',
        'AR Academics',
        'AIS',
        'email format',
      ],
      steps: [
        {
          title: 'Step 1: Check for Official Instructions',
          description: 'Before taking action, check your Outlook email and official institute communication channels for the latest procedure shared by AR (Academics), including any instruction to report the issue through a Google Form. The referenced Outlook update is dated 17/07/2026; follow any newer official instruction if one has been issued. If an alternate procedure is provided, use it instead of sending an email.',
        },
        {
          title: 'Step 2: Send an Email',
          description: 'If no alternate official instruction has been issued, email your payment details and attach proof of the successful transaction.',
          mailTemplate: {
            to: 'aracademic@iitp.ac.in',
            cc: 'acad_techsupport@iitp.ac.in',
            subject: 'Fee Payment Successful but AIS Status Not Updated - [Roll Number]',
            body: `Respected Sir/Madam,\n\nMy fee payment was successful, but the payment status on the AIS portal has not been updated.\n\nPayment details:\n- Roll Number: [Your Roll Number]\n- Name: [Your Full Name]\n- Transaction ID / UTR Number: [Transaction ID / UTR]\n- Date and Time of Payment: [Date and Time]\n- Amount Paid: [Amount]\n\nI have attached the receipt or screenshot showing the successful transaction for verification.\n\nSincerely,\n[Your Name]`,
          },
        },
        {
          title: 'Step 3: Wait for Verification',
          description: 'The Academic Section will verify the payment and update its status on the AIS. Once verified, the updated status will be reflected on the portal. Allow a reasonable amount of time for the portal to update before reporting the issue.',
        },
      ],
      importantNotes: [
        'Confirm that the payment was successfully debited from your bank account before reporting the issue.',
        'Attach the payment receipt or transaction screenshot so the Academic Section can verify the payment.',
        'Portal updates may not be instantaneous; allow a reasonable amount of time before reporting the issue.',
      ],
    }),
  };

  await prisma.wikiArticle.upsert({
    where: { slug: 'fee-payment-successful-portal-not-updated' },
    update: {},
    create: {
      slug: 'fee-payment-successful-portal-not-updated',
      ...articleData,
    },
  });

  console.log('Database seeded with structured resolution articles!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => await prisma.$disconnect());
