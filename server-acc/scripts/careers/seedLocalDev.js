// Local-development seed: two login-able users and demo Career Vault experiences.
// Company names are deliberately spelled inconsistently ("Google India", "GOOGLE LLC", ...)
// so the company registry and the experience backfill have realistic input to work on.
// Usage: node scripts/careers/seedLocalDev.js   (needs DEV_SEED_PASSWORD in server-acc/.env)
import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import prisma from '../../config/db.js';

if (process.env.NODE_ENV === 'production') {
    console.error('[careers] seedLocalDev refuses to run with NODE_ENV=production');
    process.exit(1);
}

const password = process.env.DEV_SEED_PASSWORD;
if (!password) {
    console.error('[careers] DEV_SEED_PASSWORD is not set in server-acc/.env');
    process.exit(1);
}

const USERS = [
    {
        email: 'devstudent_2401cs98@iitp.ac.in',
        displayName: 'Dev Student',
        role: 'STUDENT',
        rollNo: '2401CS98',
        branchName: 'CS',
        admissionYear: 2024,
        program: 'BTECH',
    },
    {
        email: 'devadmin_2401ee97@iitp.ac.in',
        displayName: 'Dev Career Admin',
        role: 'CAREER_ADMIN',
        rollNo: '2401EE97',
        branchName: 'EE',
        admissionYear: 2024,
        program: 'BTECH',
    },
];

const EXPERIENCES = [
    ['My Google India internship: from OA to offer', 'INTERNSHIP', 'CS'],
    ['Interview experience at GOOGLE LLC (SWE intern)', 'INTERNSHIP', 'CS'],
    ['Microsoft SWE intern 2025: rounds and preparation', 'INTERNSHIP', 'CS'],
    ['Placement at Microsoft India Development Center', 'PLACEMENT', 'CS'],
    ['Goldman Sachs Analyst: summer internship experience', 'INTERNSHIP', 'Quant'],
    ['Amazon SDE-1 placement interview', 'PLACEMENT', 'CS'],
    ['amazon.com internship: 2 rounds + bar raiser', 'INTERNSHIP', 'CS'],
    ['Texas Instruments analog intern experience', 'INTERNSHIP', 'ECE'],
    ['Qualcomm India Pvt. Ltd. interview rounds', 'PLACEMENT', 'ECE'],
    ['Flipkart Internship Experience (APM)', 'INTERNSHIP', 'Product'],
    ['DE Shaw quant developer interview', 'PLACEMENT', 'Quant'],
    ['Building a campus startup: lessons learned', 'STARTUP', 'Other'],
];

function descriptionFor(title) {
    return `<p>${title}.</p><p>Demo content created by seedLocalDev.js for local testing only.</p>`;
}

async function main() {
    const hash = await bcrypt.hash(password, 10);
    const users = {};
    for (const u of USERS) {
        users[u.role] = await prisma.user.upsert({
            where: { email: u.email },
            update: { ...u, password: hash },
            create: { ...u, password: hash },
        });
    }

    const author = users.STUDENT;
    let created = 0;
    for (const [title, experienceType, domain] of EXPERIENCES) {
        const existing = await prisma.experience.findFirst({ where: { title, uploadedById: author.id } });
        if (existing) continue;
        await prisma.experience.create({
            data: {
                title,
                description: descriptionFor(title),
                experienceType,
                domain,
                status: 'PUBLISHED',
                uploadedById: author.id,
            },
        });
        created++;
    }

    console.info(`[careers] seedLocalDev: ${USERS.length} users upserted, ${created} experiences created (${EXPERIENCES.length - created} already present)`);
}

main()
    .catch((err) => {
        console.error('[careers] seedLocalDev failed', err);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
