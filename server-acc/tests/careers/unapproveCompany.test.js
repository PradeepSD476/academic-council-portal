import { describe, it, expect } from 'vitest';
import { unapproveProblem, unapproveCompany } from '../../services/careers/companies/unapproveCompany.js';

const acme = { id: 7, name: 'Acme', status: 'ACTIVE', rejectedAt: null };
const none = { live: 0, sources: 0, experiences: 0 };

// A fake Prisma transaction: one company, some postings, usage counts.
function fakeDb({ company, usage = none, postings = [] }) {
    const updates = [];
    const tx = {
        company: {
            findUnique: async () => company,
            update: async ({ data }) => { updates.push(['company', data]); return { ...company, ...data }; },
        },
        posting: {
            count: async () => usage.live,
            findMany: async () => postings,
            update: async ({ where, data }) => { updates.push(['posting', where.id, data]); },
        },
        source: { count: async () => usage.sources },
        experience: { count: async () => usage.experiences },
    };
    return { db: { $transaction: (fn) => fn(tx) }, updates };
}

describe('move an approved company back to the candidates (B-34, D-16)', () => {
    it('allowed for an approved company nothing uses', () => expect(unapproveProblem(acme, none)).toBeNull());
    it('refused for candidates, merged companies and missing ones', () => {
        expect(unapproveProblem({ ...acme, status: 'CANDIDATE' }, none)).toMatch(/not an approved company \(it is candidate\)/);
        expect(unapproveProblem({ ...acme, status: 'MERGED' }, none)).toMatch(/not an approved company \(it is merged\)/);
        expect(unapproveProblem(null, none)).toBe('Company not found.');
    });
    it('refused while a LIVE posting, a board or an experience uses it', () => {
        expect(unapproveProblem(acme, { ...none, live: 3 })).toMatch(/3 live posting/);
        expect(unapproveProblem(acme, { ...none, sources: 1 })).toMatch(/job board/);
        expect(unapproveProblem(acme, { ...none, experiences: 2 })).toMatch(/2 experience\(s\).*Link experiences/);
    });
    it('sets CANDIDATE and flags the company on its remaining postings', async () => {
        const { db, updates } = fakeDb({ company: acme, postings: [{ id: 1, uncertainFields: [] }, { id: 2, uncertainFields: ['company'] }] });
        const r = await unapproveCompany(db, 7);
        expect(r.company.status).toBe('CANDIDATE');
        expect(r.flagged).toBe(2);
        expect(updates).toContainEqual(['posting', 1, { uncertainFields: ['company'] }]);
        expect(updates).toContainEqual(['posting', 2, { uncertainFields: ['company'] }]);
        expect(updates).toContainEqual(['company', { status: 'CANDIDATE' }]);
    });
    it('409 with nothing written while something live uses it; 404 when missing', async () => {
        const busy = fakeDb({ company: acme, usage: { ...none, live: 1 } });
        await expect(unapproveCompany(busy.db, 7)).rejects.toMatchObject({ status: 409, code: 'INVALID_STATE' });
        expect(busy.updates).toEqual([]);
        await expect(unapproveCompany(fakeDb({ company: null }).db, 7)).rejects.toMatchObject({ status: 404 });
    });
});
