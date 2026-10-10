const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('admin', 10);
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { password: hash, role: 'SUPER_ADMIN' },
    create: {
      email: 'admin@example.com',
      displayName: 'Admin User',
      rollNo: 'ADMIN001',
      password: hash,
      role: 'SUPER_ADMIN'
    }
  });
  console.log('Admin user created successfully. Email: admin@example.com, Password: admin');
}
main().catch(console.error).finally(() => prisma.$disconnect());
