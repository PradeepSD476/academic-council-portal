import { describe, it, expect, vi, beforeEach } from 'vitest';

// The controller around bulk add (B-38): its 400s, 201 vs 200, and one fetch queued only when a
// board was added. The board checks themselves are covered in sourcesBulk.test.js.
const bulkAddBoards = vi.fn();
const setSetting = vi.fn();
vi.mock('../../config/db.js', () => ({ default: {} }));
vi.mock('../../services/careers/companies/companyIndex.js', () => ({ loadCompanyIndex: async () => ({}) }));
vi.mock('../../services/careers/settings.js', () => ({ getSetting: async () => null, setSetting, clearSettingsCache: () => {} }));
vi.mock('../../services/careers/sources/addBoard.js', async (orig) => ({ ...(await orig()), bulkAddBoards }));
const { bulkCreateSources } = await import('../../controllers/careers/adminSourcesController.js');

async function call(lines) {
    const res = { statusCode: 0, body: null, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
    await bulkCreateSources({ body: { lines }, user: { id: 2 } }, res);
    return res;
}
const result = (lineNo, r) => ({ lineNo, kind: 'LEVER', boardToken: `b${lineNo}`, companyName: 'X', result: r, message: '' });

describe('POST /careers/admin/sources/bulk (B-38)', () => {
    beforeEach(() => { bulkAddBoards.mockReset(); setSetting.mockReset(); });

    it('400 for an empty paste or only comments, nothing checked', async () => {
        for (const lines of ['', '# just a note\n\n']) {
            const res = await call(lines);
            expect(res.statusCode).toBe(400);
        }
        expect(bulkAddBoards).not.toHaveBeenCalled();
    });
    it('400 for more than 30 boards, nothing checked', async () => {
        const res = await call(Array.from({ length: 31 }, (_, i) => `lever board${i} Company ${i}`).join('\n'));
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/at most 30/);
        expect(bulkAddBoards).not.toHaveBeenCalled();
    });
    it('201 and one fetch queued when a board was added', async () => {
        bulkAddBoards.mockResolvedValue([result(1, 'added'), result(2, 'skipped')]);
        const res = await call('lever b1 X\nlever b2 X\nbogus line here');
        expect(res.statusCode).toBe(201);
        expect(res.body.data.summary).toEqual({ added: 1, skipped: 1, failed: 1 });
        expect(res.body.data.lineErrors).toHaveLength(1);
        expect(setSetting).toHaveBeenCalledTimes(1);
        expect(setSetting.mock.calls[0][0]).toBe('careers.runRequest');
        expect(res.body.message).toMatch(/queued for fetching/);
    });
    it('200 and nothing queued when nothing was added', async () => {
        bulkAddBoards.mockResolvedValue([result(1, 'skipped'), result(2, 'failed')]);
        const res = await call('lever b1 X\nlever b2 X');
        expect(res.statusCode).toBe(200);
        expect(setSetting).not.toHaveBeenCalled();
        expect(res.body.data.runRequest).toBeNull();
    });
});
