import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const category = await prisma.wikiCategory.upsert({
    where: { slug: 'academic-procedures' },
    update: {},
    create: {
      name: 'Academic Procedures',
      slug: 'academic-procedures',
      description: 'Guidelines for Transcripts, Bonafide Certificates, and Grade Cards',
    },
  });

  await prisma.wikiArticle.upsert({
    where: { slug: 'how-to-apply-for-bonafide' },
    update: {},
    create: {
      title: 'How to Apply for a Bonafide Certificate',
      slug: 'how-to-apply-for-bonafide',
      content: '# Applying for Bonafide Certificate\n\n1. Log into Academic Portal.\n2. Fill out the application form under Academic Requests.\n3. Submit to Academic Section.',
      categoryId: category.id,
      isPublished: true,
    },
  });

  console.log('Wiki initial data seeded successfully!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());