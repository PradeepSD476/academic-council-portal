import { describe, it, expect, vi } from 'vitest';
import { config, workbookBytes, fixtureSheets, logger } from './helpers.js';
import { loadDataset, exportUrl } from '../../services/exams/source.js';

describe('live, cached-live and xlsx validation/fallback', () => {
    const c = () => ({ ...config(), liveUrl: 'https://docs.google.com/spreadsheets/d/fake/edit#gid=1', fallbackPath: '/fallback.xlsx' });
    it('tries live first and caches only validated workbooks', async () => {
        const bytes = await workbookBytes();
        const fetcher = vi.fn(async () => new Response(bytes));
        const read = vi.fn(); const cache = { get: vi.fn(), put: vi.fn() };
        const loaded = await loadDataset(c(), { fetcher, read, cache, logger });
        expect(loaded.metadata.source).toBe('live');
        expect(cache.put).toHaveBeenCalledOnce();
        expect(cache.get).not.toHaveBeenCalled(); expect(read).not.toHaveBeenCalled();
        expect(fetcher.mock.calls[0][0]).toMatch(/\/export\?format=xlsx$/);
    });
    it('prefers last good live data over the local workbook on network failure', async () => {
        const read = vi.fn(); const put = vi.fn();
        const loaded = await loadDataset(c(), { fetcher: async () => { throw new Error('offline'); }, cache: { get: async () => ({ workbook: await workbookBytes(), fetchedAt: new Date('2026-11-20') }), put }, read, logger });
        expect(loaded.metadata.source).toBe('cached-live');
        expect(loaded.metadata.fallbackReasons[0]).toContain('offline');
        expect(read).not.toHaveBeenCalled(); expect(put).not.toHaveBeenCalled();
    });
    it.each(['denied', 'empty', 'malformed', 'missing tab'])('falls back when live is %s', async (failure) => {
        const sheets = fixtureSheets(); delete sheets['Course Wise List'];
        const responses = { denied: new Response('no', { status: 403 }), empty: new Response(''), malformed: new Response('<html>login</html>'), 'missing tab': new Response(await workbookBytes(sheets)) };
        const cache = { get: async () => null, put: vi.fn() };
        const loaded = await loadDataset(c(), { fetcher: async () => responses[failure], cache, read: async () => workbookBytes(), logger });
        expect(loaded.metadata.source).toBe('xlsx');
        expect(cache.put).not.toHaveBeenCalled();
    });
    it('revalidates cached workbooks with current column mappings', async () => {
        const cfg = c(); cfg.enrolments.columns.rolls = 'Renamed rolls';
        await expect(loadDataset(cfg, { fetcher: async () => { throw new Error('offline'); }, cache: { get: async () => ({ workbook: await workbookBytes() }) }, read: async () => workbookBytes(), logger })).rejects.toThrow(/Renamed rolls/);
    });
    it('reports both source failures plainly', async () => {
        await expect(loadDataset(c(), { fetcher: async () => { throw new Error('network unavailable'); }, read: async () => { throw new Error('file absent'); }, logger })).rejects.toThrow(/live: network unavailable; xlsx: file absent/);
    });
    it('loads a published sheet through three configured CSV tabs and the same workbook parser', async () => {
        const cfg = c(); cfg.liveUrl = 'https://docs.google.com/spreadsheets/d/e/public-id/pubhtml';
        cfg.source.publishedTabGids = { 'EndSem Timetable': '1', 'Room Allocation EndSem': '2', 'Course Wise List': '3' };
        const csv = {
            1: 'HS,Morning 9:30 am - 12:30 pm,Evening 3:00 pm - 6:00 pm\n2026-11-21,AA100,\n',
            2: 'Date,Slot,Room,Courses,Rolls\n2026-11-21,Morning,102,AA100 (1),2601CS01\n',
            3: 'Sub,Rolls,Count\nAA100,2601CS01,1\n',
        };
        const loaded = await loadDataset(cfg, { fetcher: async (url) => new Response(csv[new URL(url).searchParams.get('gid')]), logger });
        expect(loaded.metadata.source).toBe('live');
        expect(loaded.model.timetable).toHaveLength(1);
    });
    it('rejects non-Google or non-HTTPS live URLs', () => {
        expect(() => exportUrl('http://docs.google.com/spreadsheets/d/x/edit')).toThrow(/HTTPS/);
        expect(() => exportUrl('https://example.org/spreadsheets/d/x/edit')).toThrow(/docs.google.com/);
    });
});
