import { PrismaClient } from '@prisma/client'
// Careers: a student's self-reported CPI is private. It is left out of every query (including
// req.user and user lists); only the /careers/me/* endpoints ask for it with omit: { cpi: false }.
// The self-reported programme and graduation year (P7-T2) are private the same way.
const prisma = globalThis.prisma || new PrismaClient({ omit: { user: { cpi: true, cpiUpdatedAt: true, programme: true, graduationYear: true } } })

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

export default prisma