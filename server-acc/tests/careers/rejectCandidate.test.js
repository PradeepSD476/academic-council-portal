import { describe, it, expect } from 'vitest';
import { rejectProblem, withCompanyUncertain, statusWhere, rejectBody } from '../../services/careers/companies/rejectCandidate.js';

const keka = { name: 'keka', status: 'CANDIDATE', rejectedAt: null };
const none = { live: 0, sources: 0, experiences: 0 };

describe('reject a candidate company (F-11, D-13)', () => {
    it('allowed for an unused candidate', () => expect(rejectProblem(keka, none)).toBeNull());
    it('refused for active / merged / already rejected companies', () => {
        expect(rejectProblem({ ...keka, status: 'ACTIVE' }, none)).toMatch(/active, not a candidate/);
        expect(rejectProblem({ ...keka, status: 'MERGED' }, none)).toMatch(/merged, not a candidate/);
        expect(rejectProblem({ ...keka, rejectedAt: new Date() }, none)).toMatch(/already rejected/);
        expect(rejectProblem(null, none)).toBe('Company not found.');
    });
    it('refused while something LIVE, a board or an experience uses it', () => {
        expect(rejectProblem(keka, { ...none, live: 2 })).toMatch(/2 live posting/);
        expect(rejectProblem(keka, { ...none, sources: 1 })).toMatch(/job board/);
        expect(rejectProblem(keka, { ...none, experiences: 1 })).toMatch(/Unlink them first/);
    });
    it('its postings get "company" as an uncertain field (once)', () => {
        expect(withCompanyUncertain([])).toEqual(['company']);
        expect(withCompanyUncertain(['eligibility'])).toEqual(['eligibility', 'company']);
        expect(withCompanyUncertain(['company'])).toEqual(['company']);
    });
    it('rejected candidates leave the candidate tab and "All", and have their own view', () => {
        expect(statusWhere('CANDIDATE')).toEqual({ status: 'CANDIDATE', rejectedAt: null });
        expect(statusWhere('ALL')).toEqual({ rejectedAt: null });
        expect(statusWhere('REJECTED')).toEqual({ status: 'CANDIDATE', rejectedAt: { not: null } });
        expect(statusWhere('MERGED')).toEqual({ status: 'MERGED', rejectedAt: null });
    });
    it('a reason is optional, short and the only field', () => {
        expect(rejectBody.parse({})).toEqual({});
        expect(() => rejectBody.parse({ reason: 'x'.repeat(301) })).toThrow();
        expect(() => rejectBody.parse({ delete: true })).toThrow();
    });
});
