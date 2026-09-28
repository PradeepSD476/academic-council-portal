import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

// Idempotent seed for the Research Vault "Resources" tab.
//
// Unlike prisma/seedResearchVault.js (which hard-refuses any DB other than
// localhost/acc_dev), this script intentionally accepts the local Docker
// database (iitp_db exposed on localhost:5432 by the acc-postgres container):
// it only ever upserts rows whose title starts with the DEMO_PREFIX below, so
// it is safe to re-run against the shared local dev data. No production guard
// is possible here because the target is the local container DB by design.
//
// Companion files: the PDF/DOCX objects referenced by filePath must exist in
// the MinIO bucket first. Generate/upload them with:
//   docker exec -i acc-minio python3 - < prisma/seed-resources.make-files.py

const prisma = new PrismaClient();
const DEMO_PREFIX = 'Demo';
const BUCKET = 'research-vault';

// Byte sizes must match the objects uploaded by seed-resources.make-files.py.
const files = {
  'research-email-guide.pdf': { key: `${BUCKET}/research-email-guide.pdf`, size: 2462, mime: 'application/pdf', format: 'pdf' },
  'sop-writing-guide.pdf': { key: `${BUCKET}/sop-writing-guide.pdf`, size: 2426, mime: 'application/pdf', format: 'pdf' },
  'phd-application-checklist.pdf': { key: `${BUCKET}/phd-application-checklist.pdf`, size: 2522, mime: 'application/pdf', format: 'pdf' },
  'grant-writing-template.docx': { key: `${BUCKET}/grant-writing-template.docx`, size: 976, mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', format: 'docx' },
  'lor-template.docx': { key: `${BUCKET}/lor-template.docx`, size: 970, mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', format: 'docx' },
};

// Research-area ids as they exist in the local database (verified via psql):
// 1 ML, 2 NLP, 3 CV, 4 Robotics, 5 Data Science, 6 Cybersecurity, 7 IoT, 8 Signal Processing.
const resources = [
  {
    title: `${DEMO_PREFIX} guide: Writing a concise research introduction email`,
    description: 'A one-page walkthrough for writing short, specific cold emails to professors, with a before/after example and a checklist of the three things every first email must contain.',
    file: 'research-email-guide.pdf', resourceType: 'COLD_EMAILING', areaIds: [2, 5], viewCount: 2, downloadCount: 3, daysAgo: 21,
  },
  {
    title: `${DEMO_PREFIX} guide: Structuring your Statement of Purpose`,
    description: 'How to organise an SOP around evidence instead of adjectives: a paragraph-by-paragraph plan, two annotated openings, and a list of clichés to avoid.',
    file: 'sop-writing-guide.pdf', resourceType: 'SOP_WRITING', areaIds: [1, 5], viewCount: 1, downloadCount: 1, daysAgo: 18,
  },
  {
    title: `${DEMO_PREFIX} guide: Grant writing basics for undergraduates`,
    description: 'A DOCX template with the standard sections of a small student grant proposal — problem, method, budget, timeline — plus reviewer-focused writing notes for each section.',
    file: 'grant-writing-template.docx', resourceType: 'GRANT_WRITING', areaIds: [5], viewCount: 0, downloadCount: 2, daysAgo: 15,
  },
  {
    title: `${DEMO_PREFIX} template: Requesting a strong letter of recommendation`,
    description: 'A ready-to-adapt request packet: what to send your recommender, a two-week reminder schedule, and a one-page brag sheet template that makes their letter easier to write.',
    file: 'lor-template.docx', resourceType: 'LOR', areaIds: [1, 2], viewCount: 0, downloadCount: 0, daysAgo: 12,
  },
  {
    title: `${DEMO_PREFIX} checklist: PhD application season, week by week`,
    description: 'A printable checklist covering the full application season: shortlisting, SOP drafts, transcripts, LOR tracking, and submission-buffer planning, from August to February.',
    file: 'phd-application-checklist.pdf', resourceType: 'PHD_APPLICATIONS', areaIds: [1, 2, 3], viewCount: 0, downloadCount: 0, daysAgo: 9,
  },
  {
    title: `${DEMO_PREFIX} link: How to read a research paper effectively`,
    description: 'A curated external guide to the three-pass reading method: what to extract on each pass, when to stop reading, and how to keep notes you will actually reuse.',
    url: 'https://web.stanford.edu/class/ee384m/Handouts/HowtoReadPaper.pdf', resourceType: 'GUIDE', areaIds: [1, 5, 8], viewCount: 4, downloadCount: 0, daysAgo: 8,
  },
  {
    title: `${DEMO_PREFIX} link: Cold emailing professors — a student playbook`,
    description: 'External playbook with reply-rate data on outreach emails: subject lines, timing, follow-up cadence, and what distinguishes an answerable email from an ignorable one.',
    url: 'https://example.edu/playbooks/cold-emailing-professors', resourceType: 'COLD_EMAILING', areaIds: [2], viewCount: 2, downloadCount: 0, daysAgo: 6,
  },
  {
    title: `${DEMO_PREFIX} link: Literature review fundamentals`,
    description: 'External tutorial on structuring a literature review: building a taxonomy of prior work, spotting the research gap, and keeping the review tied to your own question.',
    url: 'https://example.edu/guides/literature-review-fundamentals', resourceType: 'GUIDE', areaIds: [1, 2, 3, 4, 5], viewCount: 1, downloadCount: 0, daysAgo: 5,
  },
  {
    title: `${DEMO_PREFIX} link: Research poster design for conferences`,
    description: 'External template pack and design rules for academic posters: layout grids, font sizes that survive a crowded hall, and how to walk a viewer through it in 90 seconds.',
    url: 'https://example.edu/templates/research-poster', resourceType: 'TEMPLATE', areaIds: [3, 7, 8], viewCount: 0, downloadCount: 0, daysAgo: 4,
  },
  {
    title: `${DEMO_PREFIX} link: Statement of purpose examples that worked`,
    description: 'Annotated external collection of successful graduate-application SOPs across CS and EE, each with reviewer notes explaining what made it effective.',
    url: 'https://example.edu/guides/sop-examples', resourceType: 'SOP_WRITING', areaIds: [1, 2], viewCount: 1, downloadCount: 0, daysAgo: 3,
  },
  {
    title: `${DEMO_PREFIX} link: PhD funding options and timelines in India`,
    description: 'External overview of major fellowships and assistantship routes for doctoral study, with eligibility summaries and typical application windows.',
    url: 'https://example.edu/guides/phd-funding-india', resourceType: 'PHD_APPLICATIONS', areaIds: [4, 5, 6], viewCount: 0, downloadCount: 0, daysAgo: 2,
  },
  {
    title: `${DEMO_PREFIX} link: Making clear figures for technical papers`,
    description: 'External short course on figure design for papers and theses: vector vs raster, colourblind-safe palettes, caption writing, and the five most common figure mistakes.',
    url: 'https://example.edu/guides/technical-figures', resourceType: 'GENERAL', areaIds: [3, 7], viewCount: 0, downloadCount: 0, daysAgo: 1,
  },
];

async function main() {
  // Same convention as seedResearchVault.js: prefer an admin/faculty account
  // as the visible uploader; fall back to the first user.
  const contributor = await prisma.user.findFirst({
    where: { role: { in: ['RESEARCH_ADMIN', 'SUPER_ADMIN', 'FACULTY'] } },
    select: { id: true },
  }) || await prisma.user.findFirst({ select: { id: true }, orderBy: { id: 'asc' } });

  if (!contributor) {
    throw new Error('Create a local portal account first, then rerun this seed.');
  }

  // Viewers for demo view counts (unique per user, as ResourceView requires).
  const viewers = await prisma.user.findMany({ select: { id: true }, orderBy: { id: 'asc' }, take: 5 });
  const now = new Date();

  let created = 0;
  let updated = 0;

  for (const r of resources) {
    const areaRows = r.areaIds
      .map((researchAreaId) => ({ researchArea: { connect: { id: researchAreaId } } }));

    const file = r.file ? files[r.file] : null;
    const createdAt = new Date(now.getTime() - r.daysAgo * 24 * 60 * 60 * 1000);

    const data = {
      title: r.title,
      description: r.description,
      resourceType: r.resourceType,
      status: 'APPROVED',
      consent_confirmed: true,
      uploadedById: contributor.id,
      approvedById: contributor.id,
      reviewedAt: createdAt,
      createdAt,
      ...(file
        ? { filePath: file.key, fileSize: file.size, mimeType: file.mime, format: file.format, sourceType: 'FILE', url: null }
        : { url: r.url, format: 'link', sourceType: 'EXTERNAL_LINK', filePath: null, fileSize: null, mimeType: null }),
    };

    const existing = await prisma.researchResource.findFirst({ where: { title: r.title } });
    let saved;
    if (existing) {
      // Replace the area links on update so re-runs converge on this list.
      saved = await prisma.researchResource.update({
        where: { id: existing.id },
        data: { ...data, researchAreas: { deleteMany: {}, create: areaRows } },
      });
      updated++;
    } else {
      saved = await prisma.researchResource.create({
        data: { ...data, researchAreas: { create: areaRows } },
      });
      created++;
    }

    // Recreate demo views deterministically, then sync the counter to match.
    await prisma.resourceView.deleteMany({ where: { resourceId: saved.id } });
    const viewRows = viewers.slice(0, r.viewCount).map((u) => ({ resourceId: saved.id, userId: u.id }));
    if (viewRows.length > 0) {
      await prisma.resourceView.createMany({ data: viewRows, skipDuplicates: true });
    }
    await prisma.researchResource.update({
      where: { id: saved.id },
      data: { viewCount: r.viewCount, downloadCount: r.downloadCount },
    });
  }

  console.log(`Resources seed done: ${created} created, ${updated} updated (all ${DEMO_PREFIX} rows APPROVED).`);
  console.log('File objects live in MinIO under research-vault/ (acc-media bucket).');

  // Demo custom areas so the admin-review queue has something to show.
  const demoCustom = [
    { title: resources[1].title, name: 'Quantum Materials' },
    { title: resources[6].title, name: 'Science Policy' },
  ];
  for (const dc of demoCustom) {
    const res = await prisma.researchResource.findFirst({ where: { title: dc.title }, select: { id: true } });
    if (res) {
      await prisma.customResearchArea.upsert({
        where: { resourceId: res.id },
        update: { name: dc.name, status: 'PENDING' },
        create: { name: dc.name, resourceId: res.id },
      });
    }
  }
  console.log('Demo custom research areas queued for admin review: 2');

  // Cross-department research areas — the shared source of truth consumed by
  // the Faculty filter, Following filter, and Submit Resource modal (all read
  // GET /vault/areas). Idempotent by slug; existing 8 CS/EE areas untouched.
  const extraAreas = [
    { name: 'Theoretical Computer Science', slug: 'theory-algorithms', description: 'Algorithms, complexity, and formal methods.' },
    { name: 'VLSI and Microelectronics', slug: 'vlsi-microelectronics', description: 'Chip design, semiconductor devices, and circuits.' },
    { name: 'Power and Energy Systems', slug: 'power-energy-systems', description: 'Power electronics, smart grids, and renewable energy.' },
    { name: 'Wireless Communications', slug: 'wireless-communications', description: '5G/6G systems, information theory, and networking.' },
    { name: 'Mechanical Design and Manufacturing', slug: 'mechanical-design-manufacturing', description: 'Product design, manufacturing, and thermal-fluid sciences.' },
    { name: 'Civil and Infrastructure Engineering', slug: 'civil-infrastructure', description: 'Structures, geotechnics, transportation, and water systems.' },
    { name: 'Chemical and Process Engineering', slug: 'chemical-process-engineering', description: 'Reaction engineering, separations, and process systems.' },
    { name: 'Materials Science', slug: 'materials-science', description: 'Functional materials, characterization, and nanotechnology.' },
    { name: 'Physics and Photonics', slug: 'physics-photonics', description: 'Optics, condensed matter, and quantum technologies.' },
    { name: 'Chemistry', slug: 'chemistry', description: 'Synthesis, catalysis, and molecular analysis.' },
    { name: 'Biosciences and Bioengineering', slug: 'biosciences-bioengineering', description: 'Biomedical devices, computational biology, and biotech.' },
    { name: 'Mathematics and Statistics', slug: 'mathematics-statistics', description: 'Applied math, numerical methods, and statistical learning.' },
    { name: 'Earth and Climate Sciences', slug: 'earth-climate-sciences', description: 'Climate modeling, remote sensing, and sustainability.' },
    { name: 'Technology Management and Policy', slug: 'tech-management-policy', description: 'Innovation, economics, and evidence-based policy.' },
  ];
  for (const area of extraAreas) {
    await prisma.researchArea.upsert({
      where: { slug: area.slug },
      update: { name: area.name, description: area.description },
      create: area,
    });
  }
  console.log(`Research areas ensured: 8 existing + ${extraAreas.length} cross-department.`);
}

main()
  .catch((error) => {
    console.error('Resources seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
