import { PrismaClient } from '@prisma/client'
// Careers: a student's self-reported CPI is private. It is left out of every query (including
// req.user and user lists); only the /careers/me/* endpoints ask for it with omit: { cpi: false }.
// The self-reported programme and graduation year (P7-T2) are private the same way, and so are a
// senior's reported stipend / CTC / rounds / year on an experience (P8-T1: company aggregates only).
const prisma = globalThis.prisma || new PrismaClient({ omit: { user: { cpi: true, cpiUpdatedAt: true, programme: true, graduationYear: true }, experience: { reportedStipend: true, reportedCtcLpa: true, reportedRounds: true, reportedYear: true } } })

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

export default prisma