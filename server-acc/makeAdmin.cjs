const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    data: {
      role: 'SUPER_ADMIN'
    }
  });
  console.log(`Updated ${result.count} user(s) to SUPER_ADMIN.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
