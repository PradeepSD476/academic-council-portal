const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@iitp.ac.in';
  const plainPassword = 'password123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'SUPER_ADMIN',
      password: hashedPassword
    },
    create: {
      email,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      displayName: 'Admin User',
      rollNo: '2401AI36'
    }
  });

  console.log(`Successfully created/updated admin user: ${user.email} with password: ${plainPassword}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
