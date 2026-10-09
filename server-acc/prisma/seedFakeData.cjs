const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding fake data...');

  // 1. Get or create a user for relations
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'fake_user@example.com',
        displayName: 'Fake User',
        rollNo: 'TEST1234',
        password: await require('bcryptjs').hash('fake', 10),
        role: 'STUDENT'
      }
    });
  }

  // 2. Research Areas
  const area1 = await prisma.researchArea.create({
    data: { name: 'Artificial Intelligence ' + Date.now(), slug: 'ai-' + Date.now(), description: 'AI and ML research' }
  });
  const area2 = await prisma.researchArea.create({
    data: { name: 'Quantum Computing ' + Date.now(), slug: 'qc-' + Date.now(), description: 'Next-gen computing' }
  });

  // 3. Faculty
  const faculty1 = await prisma.facultyProfile.create({
    data: {
      name: 'Dr. Alan Turing',
      slug: 'alan-turing-' + Date.now(),
      designation: 'Professor',
      department: 'Computer Science',
      email: 'turing@example.edu',
      biography: 'Pioneer of theoretical computer science.',
      googleScholarUrl: 'https://scholar.google.com/1',
      officeLocation: 'Block 9, Room 404'
    }
  });
  const faculty2 = await prisma.facultyProfile.create({
    data: {
      name: 'Dr. Marie Curie',
      slug: 'marie-curie-' + Date.now(),
      designation: 'Associate Professor',
      department: 'Physics',
      email: 'curie@example.edu',
      biography: 'Researching radioactivity.',
      linkedinUrl: 'https://linkedin.com/2',
      officeLocation: 'Science Lab 1'
    }
  });

  // 4. Open Positions
  await prisma.researchOpenPosition.create({
    data: {
      title: 'Summer Intern - Machine Learning',
      description: 'Looking for a summer intern to work on LLMs.',
      positionType: 'SUMMER_RESEARCH',
      applicationUrl: 'https://forms.gle/test',
      status: 'OPEN',
      positionsAvailable: 2,
      facultyId: faculty1.id,
      uploadedById: user.id,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      researchAreas: {
        create: { researchAreaId: area1.id }
      }
    }
  });
  await prisma.researchOpenPosition.create({
    data: {
      title: 'PhD Candidate in Quantum Physics',
      description: 'Join the quantum computing group.',
      positionType: 'PHD_ASSIST',
      howToApply: 'Email me directly.',
      status: 'OPEN',
      positionsAvailable: 1,
      facultyId: faculty2.id,
      uploadedById: user.id,
      researchAreas: {
        create: { researchAreaId: area2.id }
      }
    }
  });

  // 5. Experiences (Moderation Queue)
  await prisma.studentResearchExperience.create({
    data: {
      title: 'Summer at MIT CSAIL',
      description: 'An internship at MIT CSAIL. I worked on computer vision for 3 months. It was amazing.',
      experienceType: 'SUMMER_INTERNSHIP',
      status: 'PENDING_REVIEW',
      uploadedById: user.id,
      researchAreas: { create: { researchAreaId: area1.id } }
    }
  });
  await prisma.studentResearchExperience.create({
    data: {
      title: 'Thesis with Prof. Turing',
      description: 'Final year thesis on computation theory. I helped prove some interesting theorems.',
      experienceType: 'THESIS_PROJECT',
      status: 'PENDING_REVIEW',
      uploadedById: user.id,
      facultyId: faculty1.id
    }
  });

  // 6. Resources
  const resource1 = await prisma.researchResource.create({
    data: {
      title: 'How to write a Research Paper',
      description: 'A comprehensive guide.',
      url: 'https://example.com/guide',
      resourceType: 'GUIDE',
      status: 'APPROVED',
      uploadedById: user.id,
      researchAreas: { create: { researchAreaId: area1.id } }
    }
  });
  const resource2 = await prisma.researchResource.create({
    data: {
      title: 'Dataset for Quantum States',
      description: 'Contains 1M rows of quantum state measurements.',
      url: 'https://example.com/data',
      resourceType: 'DATASET',
      status: 'APPROVED',
      uploadedById: user.id,
      researchAreas: { create: { researchAreaId: area2.id } }
    }
  });

  // 6.5 Pending Resources (Resource Queue)
  await prisma.researchResource.create({
    data: {
      title: 'Introduction to Neural Networks PDF',
      description: 'Found this really helpful PDF for beginners trying to understand backpropagation.',
      url: 'https://example.com/nn-intro.pdf',
      resourceType: 'DOCUMENT',
      status: 'PENDING',
      uploadedById: user.id,
      researchAreas: { create: { researchAreaId: area1.id } }
    }
  });
  await prisma.researchResource.create({
    data: {
      title: 'Open Source Quantum Simulator',
      description: 'A github repository with an open source python quantum circuit simulator.',
      url: 'https://github.com/example/q-sim',
      resourceType: 'TOOL',
      status: 'PENDING',
      uploadedById: user.id,
      researchAreas: { create: { researchAreaId: area2.id } }
    }
  });

  // 7. Custom Areas Queue (User submissions)
  await prisma.customResearchArea.create({
    data: {
      name: 'Large Language Models',
      status: 'PENDING',
      resourceId: resource1.id
    }
  });
  await prisma.customResearchArea.create({
    data: {
      name: 'Superconductors',
      status: 'PENDING',
      resourceId: resource2.id
    }
  });

  console.log('Successfully seeded 2 entries for each category!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
