import { describe, it, expect } from 'vitest';
import { resolveCompany } from '../../services/careers/companies/resolveCompany.js';
import { buildIndex } from '../../services/careers/companies/matcher.js';

// Minimal in-memory stand-in for the Prisma calls resolveCompany makes.
function fakePrisma({ companies = [], aliases = [] } = {}) {
    const db = { companies: [...companies], aliases: [...aliases] };
    return {
        db,
        company: {
            findUnique: async ({ where }) => db.companies.find((c) => (where.id !== undefined ? c.id === where.id : c.slug === where.slug)) ?? null,
            create: async ({ data }) => {
                const { aliases: nested, ...rest } = data;
                const company = { id: db.companies.length + 100, ...rest };
                db.companies.push(company);
                if (nested?.create) {
                    if (db.aliases.some((a) => a.normalizedAlias === nested.create.normalizedAlias)) {
                        throw Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
                    }
                    db.aliases.push({ companyId: company.id, ...nested.create });
                }
                return company;
            },
        },
        companyAlias: {
            findUnique: async ({ where }) => db.aliases.find((a) => a.normalizedAlias === where.normalizedAlias) ?? null,
        },
    };
}

const seeded = () => ({
    companies: [
        { id: 1, name: 'Google', slug: 'google', status: 'ACTIVE' },
        { id: 2, name: 'Goldman Sachs', slug: 'goldman-sachs', status: 'ACTIVE' },
        { id: 3, name: 'Acme', slug: 'acme', status: 'CANDIDATE' },
    ],
    aliases: [
        { companyId: 1, alias: 'Google', normalizedAlias: 'google' },
        { companyId: 2, alias: 'Goldman Sachs', normalizedAlias: 'goldman sachs' },
        { companyId: 3, alias: 'Acme', normalizedAlias: 'acme' },
    ],
});

describe('resolveCompany', () => {
    it('a normalised match to an ACTIVE company is certain', async () => {
        const data = seeded();
        const r = await resolveCompany(fakePrisma(data), 'Google India Pvt Ltd', buildIndex(data.aliases));
        expect(r).toMatchObject({ companyId: 1, method: 'normalized', uncertain: false, created: false });
    });
    it('a fuzzy match is flagged uncertain', async () => {
        const data = seeded();
        const r = await resolveCompany(fakePrisma(data), 'Goldman Sach', buildIndex(data.aliases));
        expect(r).toMatchObject({ companyId: 2, method: 'fuzzy', uncertain: true });
    });
    it('matching a CANDIDATE company is still uncertain', async () => {
        const data = seeded();
        const r = await resolveCompany(fakePrisma(data), 'ACME LTD', buildIndex(data.aliases));
        expect(r).toMatchObject({ companyId: 3, uncertain: true });
    });
    it('an unknown name creates a CANDIDATE company with an AUTO alias and updates the index', async () => {
        const data = seeded();
        const prisma = fakePrisma(data);
        const index = buildIndex(data.aliases);
        const r = await resolveCompany(prisma, '  Zephyr   Robotics Pvt. Ltd. ', index);
        expect(r).toMatchObject({ method: 'created', uncertain: true, created: true });
        const created = prisma.db.companies.find((c) => c.id === r.companyId);
        expect(created).toMatchObject({ name: 'Zephyr Robotics Pvt. Ltd.', slug: 'zephyr-robotics-pvt-ltd', status: 'CANDIDATE', normalizedName: 'zephyr robotics' });
        expect(prisma.db.aliases.at(-1)).toMatchObject({ normalizedAlias: 'zephyr robotics', origin: 'AUTO' });
        // Second sighting in the same run reuses it instead of creating a duplicate.
        const again = await resolveCompany(prisma, 'Zephyr Robotics', index);
        expect(again).toMatchObject({ companyId: r.companyId, created: false });
    });
    it('a concurrent insert of the same alias falls back to the existing company', async () => {
        const data = seeded();
        const prisma = fakePrisma(data);
        prisma.db.aliases.push({ companyId: 42, alias: 'Nova', normalizedAlias: 'nova labs' }); // written by "another worker"
        const r = await resolveCompany(prisma, 'Nova Labs', buildIndex(data.aliases)); // stale index without it
        expect(r).toMatchObject({ companyId: 42, uncertain: true, created: false });
    });
    it('empty names resolve to null', async () => {
        expect(await resolveCompany(fakePrisma(), '   ', buildIndex([]))).toBeNull();
    });
});
