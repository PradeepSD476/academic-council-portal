// Loads the alias index used by the matcher. Only ACTIVE and CANDIDATE companies take part:
// a MERGED company's aliases now belong to the company it was merged into.
import { buildIndex } from './matcher.js';

export async function loadCompanyIndex(prisma) {
    const aliases = await prisma.companyAlias.findMany({
        where: { company: { status: { in: ['ACTIVE', 'CANDIDATE'] } } },
        select: { companyId: true, alias: true, normalizedAlias: true },
    });
    return buildIndex(aliases);
}
