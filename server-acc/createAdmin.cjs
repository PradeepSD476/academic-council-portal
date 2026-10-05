const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@iitp.ac.in';
  const password = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: 'SUPER_ADMIN', password },
    create: {
      email,
      password,
      role: 'SUPER_ADMIN',
      displayName: 'Admin User',
      rollNo: 'ADMIN'
    }
  });

  console.log('Admin account ready! Email: ' + email + ' | Password: admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
