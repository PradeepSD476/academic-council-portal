import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/db.js', () => ({ default: {} }));

const { mergeProblem } = await import('../../services/careers/companies/mergeService.js');
const { companyChangeNeedsActive } = await import('../../services/careers/postings/reviewService.js');

const co = (status, name = status) => ({ id: 1, name, status });

describe('B-10: a LIVE posting must not end up under a hidden company', () => {
    it('merging an ACTIVE company into a CANDIDATE is refused', () => {
        expect(mergeProblem(co('ACTIVE', 'Google'), co('CANDIDATE', 'Gogle'))).toMatchObject({ status: 409, code: 'TARGET_NOT_ACTIVE' });
    });
    it('candidate into candidate (clean-up) and anything into ACTIVE are fine', () => {
        expect(mergeProblem(co('CANDIDATE'), co('CANDIDATE'))).toBeNull();
        expect(mergeProblem(co('ACTIVE'), co('ACTIVE'))).toBeNull();
        expect(mergeProblem(co('CANDIDATE'), co('ACTIVE'))).toBeNull();
    });
    it('the existing MERGED checks still apply', () => {
        expect(mergeProblem(co('MERGED'), co('ACTIVE'))).toMatchObject({ code: 'ALREADY_MERGED' });
        expect(mergeProblem(co('ACTIVE'), co('MERGED'))).toMatchObject({ code: 'TARGET_MERGED' });
    });
    it('changing the company of a LIVE posting needs an ACTIVE company; other edits do not', () => {
        expect(companyChangeNeedsActive({ status: 'LIVE', companyId: 3 }, { companyId: 9 })).toBe(true);
        expect(companyChangeNeedsActive({ status: 'LIVE', companyId: 3 }, { roleTitle: 'X' })).toBe(false);
        expect(companyChangeNeedsActive({ status: 'PENDING_REVIEW', companyId: 3 }, { companyId: 9 })).toBe(false);
    });
});
