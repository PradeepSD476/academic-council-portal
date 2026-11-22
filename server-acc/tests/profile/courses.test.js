import { afterEach, describe, it, expect, vi } from 'vitest';
const findMany = vi.hoisted(() => vi.fn());
vi.mock('../../config/db.js', () => ({ default: { course: { findMany } } }));
import { getMyCourses } from '../../controllers/courseController.js';

const user = { admissionYear: 2024, program: 'BTECH', branchName: 'AI' };
async function call(details) {
    const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await getMyCourses({ user: details }, res); return res;
}
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });
describe('profile current courses use the My Courses source', () => {
    it('matches programme, branch and current academic year', async () => {
        vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-22T12:00:00Z'));
        findMany.mockResolvedValue([{ id: 1, courseCode: 'AI2101', name: 'Example course' }]);
        const res = await call(user);
        expect(res.code).toBe(200); expect(res.body.data[0].courseCode).toBe('AI2101');
        expect(findMany.mock.calls[0][0].where).toEqual({ academicYear: 3, program: 'BTECH', allowedBranch: { has: 'AI' } });
    });
    it.each(['admissionYear', 'program', 'branchName'])('returns an empty list when %s is missing', async (key) => {
        const res = await call({ ...user, [key]: null });
        expect(res.code).toBe(200); expect(res.body.data).toEqual([]);
        expect(findMany).not.toHaveBeenCalled();
    });
});
