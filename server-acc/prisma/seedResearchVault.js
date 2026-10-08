import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.POSTGRES_DATABASE_URL;
if (!databaseUrl) throw new Error('POSTGRES_DATABASE_URL is required.');

const parsedDatabaseUrl = new URL(databaseUrl);
// if (!['localhost', '127.0.0.1'].includes(parsedDatabaseUrl.hostname) || parsedDatabaseUrl.pathname !== '/acc_dev') {
//   throw new Error('Refusing to seed: this script only runs against local acc_dev on localhost.');
// }

const prisma = new PrismaClient();
const areaSlugs = ['artificial-intelligence', 'robotics', 'computational-biology'];

const areaRelation = (slugs, replace = false) => ({
  ...(replace ? { deleteMany: {} } : {}),
  create: slugs.map((slug) => ({ researchArea: { connect: { slug } } }))
});

async function saveExperience(contributorId, facultyId, areaIds, values) {
  const existing = await prisma.studentResearchExperience.findFirst({
    where: { title: values.title, uploadedById: contributorId }
  });
  const relation = areaRelation(areaIds, Boolean(existing));
  const data = { ...values, facultyId, researchAreas: relation };
  if (existing) {
    return prisma.studentResearchExperience.update({ where: { id: existing.id }, data });
  }
  return prisma.studentResearchExperience.create({
    data: { ...data, uploadedById: contributorId }
  });
}

async function saveDiscussion(contributorId, areaIds, values) {
  const { legacyTitle, ...discussionData } = values;
  const existing = await prisma.researchDiscussion.findFirst({
    where: { title: { in: [values.title, ...(legacyTitle ? [legacyTitle] : [])] }, uploadedById: contributorId }
  });
  const relation = areaRelation(areaIds, Boolean(existing));
  const data = { ...discussionData, researchAreas: relation };
  if (existing) {
    return prisma.researchDiscussion.update({ where: { id: existing.id }, data });
  }
  return prisma.researchDiscussion.create({
    data: { ...data, uploadedById: contributorId }
  });
}

async function saveResource(areaIds, values) {
  const existing = await prisma.researchResource.findFirst({ where: { title: values.title } });
  const relation = areaRelation(areaIds, Boolean(existing));
  const data = { ...values, researchAreas: relation };
  if (existing) {
    return prisma.researchResource.update({ where: { id: existing.id }, data });
  }
  return prisma.researchResource.create({ data });
}

async function main() {
  const contributor = await prisma.user.findFirst({
    where: { role: { in: ['RESEARCH_ADMIN', 'SUPER_ADMIN', 'FACULTY'] } },
    select: { id: true }
  }) || await prisma.user.findFirst({ select: { id: true }, orderBy: { id: 'asc' } });

  if (!contributor) {
    throw new Error('Create a local portal account first, then rerun this seed command.');
  }

  const sahilEmail = 'sahil.2501ct20@example.invalid';
  const sahil = await prisma.user.upsert({
    where: { email: sahilEmail },
    update: { displayName: 'Sahil', rollNo: '2501CT20' },
    create: {
      email: sahilEmail,
      displayName: 'Sahil',
      rollNo: '2501CT20',
      password: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
      role: 'STUDENT'
    }
  });

  const areas = {};
  const areaData = [
    { name: 'Artificial Intelligence', slug: areaSlugs[0], description: 'Machine learning, language technologies, and responsible AI.' },
    { name: 'Robotics', slug: areaSlugs[1], description: 'Autonomous systems, sensing, and human-robot interaction.' },
    { name: 'Computational Biology', slug: areaSlugs[2], description: 'Computational methods for biological and biomedical data.' },
    { name: 'Data Science and Analytics', slug: 'data-science-analytics', description: 'Statistical learning, data mining, and large-scale analytics.' },
    { name: 'Computer Systems and Networks', slug: 'computer-systems-networks', description: 'Operating systems, distributed systems, networking, and cloud computing.' },
    { name: 'Cybersecurity and Privacy', slug: 'cybersecurity-privacy', description: 'Secure systems, applied cryptography, and privacy-preserving technologies.' },
    { name: 'Algorithms and Theoretical Computer Science', slug: 'algorithms-theory', description: 'Algorithms, complexity, formal methods, and theoretical foundations.' },
    { name: 'Microelectronics and VLSI', slug: 'microelectronics-vlsi', description: 'Semiconductor devices, integrated circuits, and chip design.' },
    { name: 'Communications and Signal Processing', slug: 'communications-signal-processing', description: 'Wireless communications, signal processing, and information theory.' },
    { name: 'Power and Energy Systems', slug: 'power-energy-systems', description: 'Power electronics, smart grids, renewable energy, and storage.' },
    { name: 'Control and Automation', slug: 'control-automation', description: 'Control theory, industrial automation, and autonomous systems.' },
    { name: 'Materials Science and Engineering', slug: 'materials-science-engineering', description: 'Functional materials, characterization, and materials design.' },
    { name: 'Nanotechnology', slug: 'nanotechnology', description: 'Nanoscale materials, devices, and fabrication.' },
    { name: 'Thermal and Fluid Sciences', slug: 'thermal-fluid-sciences', description: 'Heat transfer, fluid mechanics, and energy conversion.' },
    { name: 'Mechanical Design and Manufacturing', slug: 'mechanical-design-manufacturing', description: 'Product design, manufacturing processes, and mechanical systems.' },
    { name: 'Civil and Structural Engineering', slug: 'civil-structural-engineering', description: 'Structures, geotechnics, construction, and infrastructure.' },
    { name: 'Environmental and Water Systems', slug: 'environment-water-systems', description: 'Environmental engineering, water resources, and sustainable systems.' },
    { name: 'Chemical and Process Engineering', slug: 'chemical-process-engineering', description: 'Process systems, reaction engineering, and separations.' },
    { name: 'Biotechnology and Bioengineering', slug: 'biotechnology-bioengineering', description: 'Biological systems, biomaterials, and engineering applications.' },
    { name: 'Physics and Photonics', slug: 'physics-photonics', description: 'Optics, photonics, condensed matter, and experimental physics.' },
    { name: 'Quantum Science and Technology', slug: 'quantum-science-technology', description: 'Quantum information, devices, and foundational science.' },
    { name: 'Mathematics and Scientific Computing', slug: 'mathematics-scientific-computing', description: 'Applied mathematics, numerical methods, and scientific computing.' },
    { name: 'Chemistry and Molecular Science', slug: 'chemistry-molecular-science', description: 'Chemical sciences, synthesis, catalysis, and molecular analysis.' },
    { name: 'Economics and Public Policy', slug: 'economics-public-policy', description: 'Economic analysis, public systems, and evidence-based policy.' },
    { name: 'Humanities and Social Sciences', slug: 'humanities-social-sciences', description: 'Human behavior, society, communication, and interdisciplinary studies.' }
  ];

  for (const area of areaData) {
    areas[area.slug] = await prisma.researchArea.upsert({
      where: { slug: area.slug },
      update: { name: area.name, description: area.description },
      create: area
    });
  }

  const facultyData = [
    {
      name: 'Dr. Asha Rao (Demo)', slug: 'demo-asha-rao', designation: 'Associate Professor', department: 'Computer Science and Engineering',
      email: 'asha.rao@example.edu', website: 'https://example.edu',
      biography: 'Demo profile for testing the Research Vault faculty directory, filters, and matching form.',
      publications: 'Demo publication: Efficient Learning for Resource-Constrained Systems (2025).',
      areas: [areaSlugs[0], areaSlugs[1]]
    },
    {
      name: 'Dr. Kabir Shah (Demo)', slug: 'demo-kabir-shah', designation: 'Assistant Professor', department: 'Electrical and Electronics Engineering',
      email: 'kabir.shah@example.edu', website: 'https://example.edu',
      biography: 'Demo profile focused on sensing, embedded intelligence, and autonomous platforms.',
      publications: 'Demo publication: Robust Sensing for Small Autonomous Robots (2024).',
      areas: [areaSlugs[1], areaSlugs[0]]
    },
    {
      name: 'Dr. Noor Iqbal (Demo)', slug: 'demo-noor-iqbal', designation: 'Assistant Professor', department: 'Biological Sciences',
      email: 'noor.iqbal@example.edu', website: 'https://example.edu',
      biography: 'Demo profile for testing cross-disciplinary research discovery.',
      publications: 'Demo publication: Interpretable Models for Cellular Data (2025).',
      areas: [areaSlugs[2]]
    }
  ];

  const faculty = {};
  for (const { areas: slugs, ...profile } of facultyData) {
    faculty[profile.slug] = await prisma.facultyProfile.upsert({
      where: { slug: profile.slug },
      update: { ...profile, researchAreas: areaRelation(slugs, true) },
      create: { ...profile, researchAreas: areaRelation(slugs) }
    });
  }

  await saveExperience(contributor.id, faculty['demo-asha-rao'].id, [areaSlugs[0]], {
    title: 'Demo: Evaluating small language models for campus services',
    description: 'A sample published experience for checking the student feed. We compared compact language models on a small, anonymized question set, documented failure cases, and presented recommendations to the lab.',
    labName: 'Applied AI Lab (Demo)', externalGuideName: 'Dr. Asha Rao (Demo)', duration: '8 weeks',
    prerequisites: 'Python basics and curiosity about evaluation.',
    keyLearnings: 'Dataset quality and carefully chosen baselines matter more than model size for this task.',
    outcome: 'A reproducible evaluation notebook and a short internal report.', status: 'APPROVED'
  });

  await saveExperience(contributor.id, faculty['demo-kabir-shah'].id, [areaSlugs[1]], {
    title: 'Demo: Indoor robot mapping from low-cost sensors (Pending)',
    description: 'A sample draft submission to test the admin moderation queue and publish action.',
    labName: 'Autonomous Systems Lab (Demo)', externalGuideName: 'Dr. Kabir Shah (Demo)', duration: 'Summer project',
    prerequisites: 'Basic programming and linear algebra.',
    keyLearnings: 'Sensor calibration was essential before comparing mapping approaches.',
    outcome: 'A draft demo submission awaiting review.', status: 'PENDING_REVIEW'
  });

  const discussion = await saveDiscussion(contributor.id, [areaSlugs[1]], {
    title: 'How should I prepare for a first robotics lab project?',
    legacyTitle: 'Demo: How should I prepare for a first robotics lab project?',
    content: 'I am interested in a short summer project involving mobile robots. Which fundamentals and starter tasks would be most useful before contacting a lab?',
    isResolved: false
  });

  const replyContent = 'Starting with a small simulation helped me understand coordinate frames and basic control. After that, ask the lab which tools its current projects use.';
  const legacyReplyContent = 'Demo reply: Start with a small simulation, review coordinate frames and basic control, then ask the lab which tools its current projects use.';
  const existingReply = await prisma.researchDiscussionReply.findFirst({
    where: { discussionId: discussion.id, uploadedById: contributor.id, content: { in: [replyContent, legacyReplyContent] } }
  });
  if (existingReply && existingReply.content !== replyContent) {
    await prisma.researchDiscussionReply.update({ where: { id: existingReply.id }, data: { content: replyContent } });
  } else if (!existingReply) {
    await prisma.researchDiscussionReply.create({
      data: { discussionId: discussion.id, uploadedById: contributor.id, content: replyContent }
    });
  }

  await prisma.researchDiscussionReply.deleteMany({
    where: { discussionId: discussion.id, uploadedById: contributor.id, content: 'hello' }
  });

  const otherUserReplyContent = 'I started with a small simulator first; it made coordinate frames and basic control much easier to understand before trying ROS 2.';
  const legacyOtherUserReplyContent = 'Demo reply from Sahil: I started with a small simulator first; it made coordinate frames and basic control much easier to understand before trying ROS 2.';
  const existingOtherUserReply = await prisma.researchDiscussionReply.findFirst({
    where: { discussionId: discussion.id, uploadedById: sahil.id, content: { in: [otherUserReplyContent, legacyOtherUserReplyContent] } }
  });
  if (existingOtherUserReply && existingOtherUserReply.content !== otherUserReplyContent) {
    await prisma.researchDiscussionReply.update({ where: { id: existingOtherUserReply.id }, data: { content: otherUserReplyContent } });
  } else if (!existingOtherUserReply) {
    await prisma.researchDiscussionReply.create({
      data: { discussionId: discussion.id, uploadedById: sahil.id, content: otherUserReplyContent }
    });
  }

  const sahilDiscussion = await saveDiscussion(sahil.id, [areaSlugs[1]], {
    title: 'Should I start with ROS 2 or simulation for a robotics project?',
    legacyTitle: 'Demo: Should I start with ROS 2 or simulation for a robotics project?',
    content: 'Hi, I am exploring autonomous robotics for a summer project. Would it be more useful to begin with ROS 2 tutorials or first build a small robot simulation?',
    isResolved: true
  });
  const sahilReplyContent = 'A small simulation is a good first step. It lets you practise coordinate frames and control before adding ROS 2 tools.';
  const legacySahilReplyContent = 'Demo reply: A small simulation is a good first step. It lets you practise coordinate frames and control before adding ROS 2 tools.';
  const sahilReply = await prisma.researchDiscussionReply.findFirst({
    where: { discussionId: sahilDiscussion.id, uploadedById: contributor.id, content: { in: [sahilReplyContent, legacySahilReplyContent] } }
  });
  if (sahilReply && sahilReply.content !== sahilReplyContent) {
    await prisma.researchDiscussionReply.update({ where: { id: sahilReply.id }, data: { content: sahilReplyContent } });
  } else if (!sahilReply) {
    await prisma.researchDiscussionReply.create({
      data: { discussionId: sahilDiscussion.id, uploadedById: contributor.id, content: sahilReplyContent }
    });
  }

  await saveDiscussion(sahil.id, [areaSlugs[1]], {
    title: 'What should I learn before approaching a robotics lab?',
    content: 'I know basic Python and linear algebra. Which robotics fundamentals should I focus on before asking a lab about a short project?',
    isResolved: false
  });

  await saveResource([areaSlugs[0]], {
    title: 'Demo guide: Writing a concise research introduction email',
    description: 'A sample resource entry for testing the resource list, category label, and view counter.',
    url: 'https://example.edu/research-email-guide',
    resourceType: 'COLD_EMAILING',
    uploadedById: contributor.id
  });

  const positionTitle = 'Demo: Summer research assistant in autonomous systems';
  const position = await prisma.researchOpenPosition.findFirst({
    where: { title: positionTitle, facultyId: faculty['demo-kabir-shah'].id }
  });
  const positionData = {
    title: positionTitle,
    description: 'Sample opening for testing the open positions view. Students will prototype and evaluate a small indoor navigation task.',
    positionType: 'SUMMER',
    eligibility: 'Open to undergraduate students with basic Python experience.',
    applicationUrl: 'https://example.edu/research-opportunities',
    deadline: new Date('2026-12-15T00:00:00.000Z'),
    facultyId: faculty['demo-kabir-shah'].id,
    uploadedById: contributor.id,
    isActive: true
  };
  if (position) {
    await prisma.researchOpenPosition.update({ where: { id: position.id }, data: positionData });
  } else {
    await prisma.researchOpenPosition.create({ data: positionData });
  }

  // --- NEW RESOURCES ---
  await saveResource([areaSlugs[1]], {
    title: 'Intro to ROS 2 for Beginners',
    description: 'A comprehensive guide on setting up ROS 2 on Ubuntu and creating your first robotic node.',
    url: 'https://docs.ros.org/en/humble/index.html',
    resourceType: 'GUIDE',
    status: 'APPROVED',
    uploadedById: contributor.id
  });

  await saveResource([areaSlugs[2]], {
    title: 'Computational Biology Datasets',
    description: 'A collection of open-source datasets for training machine learning models in genomics and proteomics.',
    url: 'https://example.edu/comp-bio-datasets',
    resourceType: 'DATASET',
    status: 'APPROVED',
    uploadedById: sahil.id
  });

  // --- NEW POSITIONS ---
  const positionTitle2 = 'Machine Learning Intern - Healthcare';
  const position2 = await prisma.researchOpenPosition.findFirst({
    where: { title: positionTitle2, facultyId: faculty['demo-asha-rao'].id }
  });
  const positionData2 = {
    title: positionTitle2,
    description: 'Looking for a motivated undergraduate to assist with fine-tuning LLMs on medical literature. Must have prior experience with PyTorch.',
    positionType: 'SEMESTER',
    eligibility: 'Open to pre-final year students with a strong background in deep learning.',
    applicationUrl: 'https://example.edu/apply-ml-healthcare',
    deadline: new Date('2026-11-01T00:00:00.000Z'),
    facultyId: faculty['demo-asha-rao'].id,
    uploadedById: contributor.id,
    isActive: true
  };
  if (position2) {
    await prisma.researchOpenPosition.update({ where: { id: position2.id }, data: positionData2 });
  } else {
    await prisma.researchOpenPosition.create({ data: positionData2 });
  }

  const positionTitle3 = 'PhD position in Computer Vision';
  const position3 = await prisma.researchOpenPosition.findFirst({
    where: { title: positionTitle3 }
  });
  const positionData3 = {
    title: positionTitle3,
    description: 'Fully funded PhD position available for research in robust 3D scene understanding and NeRFs.',
    positionType: 'FULL_TIME',
    eligibility: 'Master’s degree in CS or related field with top-tier conference publications.',
    applicationUrl: 'https://example.edu/phd-vision',
    deadline: new Date('2027-01-31T00:00:00.000Z'),
    facultyId: faculty['demo-noor-iqbal']?.id || faculty['demo-asha-rao'].id,
    uploadedById: sahil.id,
    isActive: true
  };
  if (position3) {
    await prisma.researchOpenPosition.update({ where: { id: position3.id }, data: positionData3 });
  } else {
    await prisma.researchOpenPosition.create({ data: positionData3 });
  }

  console.log(`Research Vault demo data is ready. Seeded 3 faculty profiles, ${areaData.length} research-area tags, published and pending experiences, discussions from the local contributor and Sahil (2501CT20), 3 resources, and 3 openings.`);

}

main()
  .catch((error) => {
    console.error('Research Vault seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });