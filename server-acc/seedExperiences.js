import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found to assign experiences to.");
    process.exit(1);
  }

  const faculty = await prisma.facultyProfile.findFirst();

  const exp1 = await prisma.studentResearchExperience.create({
    data: {
      title: 'Summer Research Internship at MIT CSAIL',
      summary: 'Worked on distributed systems and consensus algorithms under Prof. Liskov.',
      description: 'During my summer internship, I had the opportunity to work on Paxos-based distributed consensus protocols. My main contribution was implementing a fault-tolerant state machine replication system that reduced latency by 15% in high-contention scenarios. The experience was incredibly rewarding and gave me deep insights into building scalable systems.\n\nI also collaborated with PhD students to write a workshop paper on our findings.',
      labName: 'Programming Methodology Group',
      department: 'EECS',
      duration: 'May 2025 - Aug 2025',
      prerequisites: 'Strong understanding of OS concepts, C++, and Distributed Systems basics.',
      keyLearnings: 'Learned how to debug distributed race conditions using tracing tools. Improved my C++ systems programming skills.',
      outcome: 'Workshop paper accepted at NSDI \'26 (under review).',
      experienceType: 'INTERNSHIP',
      status: 'PENDING_REVIEW',
      uploadedById: user.id,
      facultyId: faculty?.id || null,
      externalGuideName: !faculty ? 'Prof. Barbara Liskov' : null,
      externalGuideAffiliation: !faculty ? 'MIT' : null
    }
  });

  const exp2 = await prisma.studentResearchExperience.create({
    data: {
      title: 'Undergraduate Thesis on Quantum Machine Learning',
      summary: 'Exploring variational quantum circuits for classification tasks.',
      description: 'My thesis focused on utilizing Variational Quantum Eigensolvers (VQE) and parameterized quantum circuits for binary classification problems. We evaluated the barren plateau problem in different circuit ansatzes and proposed a novel initialization strategy that improves convergence speed.\n\nThe project involved running simulations using Qiskit and Pennylane on IBM quantum backends.',
      labName: 'Quantum Information Lab',
      department: 'Physics / CS',
      duration: 'Aug 2025 - Present',
      prerequisites: 'Linear Algebra, Quantum Mechanics, Machine Learning, Python.',
      keyLearnings: 'Gained hands-on experience with IBM Qiskit. Understood the practical limitations of current NISQ-era quantum hardware.',
      outcome: 'Defending thesis in May 2026.',
      experienceType: 'THESIS',
      status: 'PENDING_REVIEW',
      uploadedById: user.id
    }
  });

  const exp3 = await prisma.studentResearchExperience.create({
    data: {
      title: 'Independent Study: LLM Agents for Code Generation',
      summary: 'Built a framework for evaluating multi-agent code generation systems.',
      description: 'In this independent study, I developed a testing framework to benchmark various configurations of LLM agents (using LangChain and AutoGen) in resolving GitHub issues. We discovered that hierarchical agent structures perform 20% better than flat multi-agent systems for complex debugging tasks.',
      labName: 'AI Lab',
      department: 'Computer Science',
      duration: 'Jan 2025 - May 2025',
      prerequisites: 'NLP, Prompt Engineering, Python',
      keyLearnings: 'Learned about LLM orchestration, evaluation metrics like pass@k, and prompt design for complex reasoning.',
      outcome: 'Open-sourced the benchmarking framework on GitHub (50+ stars).',
      experienceType: 'INDEPENDENT_STUDY',
      status: 'PENDING_REVIEW',
      uploadedById: user.id,
      facultyId: faculty?.id || null
    }
  });

  console.log('Seeded 3 PENDING experiences:', exp1.id, exp2.id, exp3.id);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
