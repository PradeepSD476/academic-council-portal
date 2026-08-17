import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development due to hot-reloading
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;