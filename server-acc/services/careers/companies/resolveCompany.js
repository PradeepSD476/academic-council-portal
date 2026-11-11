// Turns a raw company name into a companyId, creating a CANDIDATE company when nothing matches,
// so every posting references a company by id and never by raw text. Candidates and fuzzy
// matches are reported as uncertain so an admin confirms them (proposal 2.2: wrong matches must
// be visible and correctable, not silently baked in).
import { normalizeCompanyName } from '../text/normalize.js';
import { resolveName, addToIndex } from './matcher.js';
import { uniqueSlug } from './slug.js';

// Returns { companyId, method, score, uncertain, created } or null when rawName is empty.
export async function resolveCompany(prisma, rawName, index, { fuzzyThreshold } = {}) {
    const name = typeof rawName === 'string' ? rawName.trim().replace(/\s+/g, ' ') : '';
    if (!name) return null;

    const match = resolveName(name, index, { fuzzyThreshold });
    if (match.companyId !== null) {
        const company = await prisma.company.findUnique({ where: { id: match.companyId }, select: { status: true } });
        return {
            companyId: match.companyId,
            method: match.method,
            score: match.score,
            uncertain: match.method === 'fuzzy' || company?.status === 'CANDIDATE',
            created: false,
        };
    }

    const normalized = normalizeCompanyName(name);
    if (!normalized) return null;
    try {
        const company = await createCandidate(prisma, name, normalized);
        addToIndex(index, { companyId: company.id, alias: name, normalizedAlias: normalized });
        return { companyId: company.id, method: 'created', score: 0, uncertain: true, created: true };
    } catch (err) {
        // Another process created the same normalised alias between our lookup and insert.
        if (err?.code !== 'P2002') throw err;
        const existing = await prisma.companyAlias.findUnique({ where: { normalizedAlias: normalized } });
        if (!existing) throw err;
        addToIndex(index, { companyId: existing.companyId, alias: name, normalizedAlias: normalized });
        return { companyId: existing.companyId, method: 'normalized', score: 1, uncertain: true, created: false };
    }
}

async function createCandidate(prisma, name, normalized) {
    const slug = await uniqueSlug(name, async (s) => Boolean(await prisma.company.findUnique({ where: { slug: s }, select: { id: true } })));
    return prisma.company.create({
        data: {
            name,
            slug,
            normalizedName: normalized,
            status: 'CANDIDATE',
            aliases: { create: { alias: name, normalizedAlias: normalized, origin: 'AUTO' } },
        },
    });
}
