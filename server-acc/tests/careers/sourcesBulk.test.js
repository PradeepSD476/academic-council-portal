import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/db.js', () => ({ default: {} }));
const { parseBulkLines, MAX_BULK_LINES } = await import('../../services/careers/sources/bulkLines.js');
const { bulkAddBoards } = await import('../../services/careers/sources/addBoard.js');
const { qualityFrom } = await import('../../services/careers/sources/quality.js');
const { buildIndex } = await import('../../services/careers/companies/matcher.js');

describe('parseBulkLines (Add boards in bulk, F-23)', () => {
    it('reads "kind token company" lines, ignoring blanks and # comments', () => {
        const { entries, errors } = parseBulkLines('greenhouse stripe Stripe\n\n# a comment\nLEVER  palantir   Palantir Technologies\nashby notion Notion');
        expect(errors).toEqual([]);
        expect(entries).toEqual([
            { lineNo: 1, kind: 'GREENHOUSE', boardToken: 'stripe', companyName: 'Stripe' },
            { lineNo: 4, kind: 'LEVER', boardToken: 'palantir', companyName: 'Palantir Technologies' },
            { lineNo: 5, kind: 'ASHBY', boardToken: 'notion', companyName: 'Notion' },
        ]);
    });

    it('lower-cases the token and accepts tabs or commas between the parts', () => {
        const { entries } = parseBulkLines('greenhouse\tStripe\tStripe Inc\nlever, Zeta-Suite, Zeta');
        expect(entries.map((e) => [e.kind, e.boardToken, e.companyName])).toEqual([['GREENHOUSE', 'stripe', 'Stripe Inc'], ['LEVER', 'zeta-suite', 'Zeta']]);
    });

    it('reports bad lines with their line number and keeps the good ones', () => {
        const { entries, errors } = parseBulkLines('workday acme Acme\ngreenhouse bad/token Acme\nlever onlytoken\ngreenhouse stripe Stripe');
        expect(entries).toHaveLength(1);
        expect(errors.map((e) => e.lineNo)).toEqual([1, 2, 3]);
        expect(errors[0].reason).toMatch(/greenhouse, lever, ashby, smartrecruiters or workable/i);
        expect(errors[1].reason).toMatch(/token/i);
        expect(errors[2].reason).toMatch(/company/i);
    });

    it('reports a board repeated in the same paste', () => {
        const { entries, errors } = parseBulkLines('greenhouse stripe Stripe\nGreenhouse STRIPE Stripe again');
        expect(entries).toHaveLength(1);
        expect(errors).toEqual([{ lineNo: 2, line: 'Greenhouse STRIPE Stripe again', reason: 'Same board as line 1.' }]);
    });

    it('marks a paste with too many boards', () => {
        const text = Array.from({ length: MAX_BULK_LINES + 1 }, (_, i) => `lever t${i} Co ${i}`).join('\n');
        expect(parseBulkLines(text).tooMany).toBe(true);
        expect(parseBulkLines('lever a A').tooMany).toBe(false);
    });
});

// In-memory stand-in for the Prisma calls bulkAddBoards makes.
function fakePrisma({ sources = [], companies = [] } = {}) {
    const db = { sources: [...sources], companies: [...companies], aliases: [] };
    return {
        db,
        source: {
            findUnique: async ({ where }) => db.sources.find((s) => s.kind === where.kind_boardToken.kind && s.boardToken === where.kind_boardToken.boardToken) ?? null,
            create: async ({ data }) => {
                const s = { id: db.sources.length + 1, ...data };
                db.sources.push(s);
                return s;
            },
        },
        company: {
            findUnique: async ({ where }) => db.companies.find((c) => (where.id !== undefined ? c.id === where.id : c.slug === where.slug)) ?? null,
            create: async ({ data }) => {
                const { aliases, ...rest } = data;
                const c = { id: 100 + db.companies.length, ...rest };
                db.companies.push(c);
                db.aliases.push({ companyId: c.id, ...aliases.create });
                return c;
            },
        },
        companyAlias: { findUnique: async () => null },
    };
}

describe('bulkAddBoards', () => {
    const companies = [{ id: 1, name: 'Stripe', slug: 'stripe', status: 'ACTIVE' }];
    const index = () => buildIndex([{ companyId: 1, alias: 'Stripe', normalizedAlias: 'stripe' }]);
    const fetchBoard = async ({ boardToken }) => {
        if (boardToken === 'missing') throw new Error('HTTP 404 from boards-api.greenhouse.io');
        return { fetchedCount: 4, postings: [{ title: 'Software Engineering Intern', locationText: 'Bengaluru, India' }, { title: 'Staff Engineer', locationText: 'Bengaluru' }] };
    };

    it('adds valid boards, skips existing ones and reports boards that cannot be read', async () => {
        const prisma = fakePrisma({ companies, sources: [{ id: 1, kind: 'LEVER', boardToken: 'old', name: 'Old (lever)' }] });
        const entries = [
            { lineNo: 1, kind: 'GREENHOUSE', boardToken: 'stripe', companyName: 'stripe' },
            { lineNo: 2, kind: 'LEVER', boardToken: 'old', companyName: 'Old' },
            { lineNo: 3, kind: 'GREENHOUSE', boardToken: 'missing', companyName: 'Missing Co' },
        ];
        const results = await bulkAddBoards(prisma, entries, { fetchBoard, index: index() });
        expect(results.map((r) => [r.lineNo, r.result])).toEqual([[1, 'added'], [2, 'skipped'], [3, 'failed']]);
        expect(results[0]).toMatchObject({ companyName: 'Stripe', companyCreated: false, fetchedCount: 4, relevantNow: 1 });
        expect(results[1].message).toMatch(/already source #1/i);
        expect(results[2].message).toMatch(/404/);
        // A board that failed never creates a company.
        expect(prisma.db.companies).toHaveLength(1);
        expect(prisma.db.sources.map((s) => s.boardToken)).toEqual(['old', 'stripe']);
        expect(prisma.db.sources[1]).toMatchObject({ kind: 'GREENHOUSE', companyId: 1, name: 'Stripe (greenhouse)' });
    });

    it('creates a candidate company when the name matches nothing (never a fuzzy guess)', async () => {
        const prisma = fakePrisma({ companies });
        const [r] = await bulkAddBoards(prisma, [{ lineNo: 1, kind: 'ASHBY', boardToken: 'stripey', companyName: 'Stripey' }], { fetchBoard, index: index() });
        expect(r).toMatchObject({ result: 'added', companyCreated: true, companyName: 'Stripey' });
        expect(prisma.db.companies.at(-1)).toMatchObject({ name: 'Stripey', status: 'CANDIDATE' });
    });
});

describe('qualityFrom (per-source quality over 30 days)', () => {
    it('counts kept, approved, rejected and still pending per source', () => {
        const at = new Date();
        const rows = [
            { sourceId: 1, posting: { status: 'LIVE', publishedAt: at } },
            { sourceId: 1, posting: { status: 'EXPIRED', publishedAt: at } },
            { sourceId: 1, posting: { status: 'EXPIRED', publishedAt: null } },
            { sourceId: 1, posting: { status: 'REJECTED', publishedAt: at } },
            { sourceId: 1, posting: { status: 'PENDING_REVIEW', publishedAt: null } },
            { sourceId: 2, posting: { status: 'REJECTED', publishedAt: null } },
        ];
        expect(qualityFrom(rows)).toEqual({
            1: { kept: 5, approved: 2, rejected: 1, pending: 1 },
            2: { kept: 1, approved: 0, rejected: 1, pending: 0 },
        });
    });
    it('is empty with no rows', () => {
        expect(qualityFrom([])).toEqual({});
    });
});
