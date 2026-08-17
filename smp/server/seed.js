import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // 1. Seed System Configuration
    await prisma.systemConfig.deleteMany(); // Ensure only one config exists
    const config = await prisma.systemConfig.create({
        data: {
            currentAcademicYear: '2026-2027',
            isRegistrationOpen: true, // Kept open so frontend can test the questionnaire
            isAllocationComplete: false,
            isFeedbackOpen: false,
            firstYearBatchPrefix: '26',
            secondYearBatchPrefix: '25',
            thirdYearBatchPrefix: '24',
            allowFirstYearLogin: true,
            allowSecondYearLogin: true,
            allowThirdYearLogin: true,
        },
    });
    console.log('✅ SystemConfig seeded for academic year:', config.currentAcademicYear);

    // 2. Seed a Default Admin User
    const adminEmail = 'admin@iitp.ac.in';
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!existingAdmin) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('admin123', salt);

        await prisma.user.create({
            data: {
                name: 'SMP Admin',
                email: adminEmail,
                rollNumber: 'ADMIN001',
                passwordHash: passwordHash,
                role: 'ADMIN',
            },
        });
        console.log('✅ Admin user created (Email: admin@iitp.ac.in | Pass: admin123)');
    } else {
        console.log('ℹ️ Admin user already exists.');
    }

    console.log('🎉 Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });