import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.systemConfig.updateMany({
    data: { isAllocationComplete: true }
  });
  const hash = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@iitp.ac.in' },
    update: { passwordHash: hash, role: 'ADMIN' },
    create: {
      email: 'admin@iitp.ac.in',
      name: 'System Admin',
      rollNumber: 'ADMIN_001',
      passwordHash: hash,
      role: 'ADMIN',
      smpRole: 'UNASSIGNED'
    }
  });
  console.log("Admin seeded:", admin.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
