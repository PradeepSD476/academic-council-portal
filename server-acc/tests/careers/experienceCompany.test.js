import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/db.js', () => ({ default: {} }));
const { experienceCompanyId } = await import('../../services/careers/companies/experienceCompany.js');

const STATUS = { 1: 'ACTIVE', 2: 'CANDIDATE', 3: 'MERGED' };
const fakeDb = () => {
    const findUnique = vi.fn(async ({ where }) => (STATUS[where.id] ? { status: STATUS[where.id] } : null));
    return { company: { findUnique } };
};

describe('experienceCompanyId', () => {
    it('leaves the company alone when the field is not sent, and clears it for null or ""', async () => {
        const db = fakeDb();
        expect(await experienceCompanyId(undefined, db)).toBeUndefined();
        expect(await experienceCompanyId(null, db)).toBeNull();
        expect(await experienceCompanyId('', db)).toBeNull();
        expect(db.company.findUnique).not.toHaveBeenCalled();
    });

    it('accepts an ACTIVE company id as a number or a string', async () => {
        const db = fakeDb();
        expect(await experienceCompanyId(1, db)).toBe(1);
        expect(await experienceCompanyId('1', db)).toBe(1);
    });

    it.each([2, 3, 99])('rejects company %s (candidate, merged or missing) with a 400', async (id) => {
        await expect(experienceCompanyId(id, fakeDb())).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
    });

    it.each([0, -1, 1.5, 'abc', true, [1], { id: 1 }])('rejects the malformed value %j without a query', async (value) => {
        const db = fakeDb();
        await expect(experienceCompanyId(value, db)).rejects.toMatchObject({ status: 400 });
        expect(db.company.findUnique).not.toHaveBeenCalled();
    });
});
