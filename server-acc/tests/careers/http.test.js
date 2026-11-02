import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchJson, MAX_JSON_BYTES } from '../../services/careers/ingest/http.js';

afterEach(() => vi.unstubAllGlobals());

describe('fetchJson size cap (B-20)', () => {
    it('the default cap leaves room for the largest real board (9.6 MB)', () => {
        expect(MAX_JSON_BYTES).toBe(30 * 1024 * 1024);
    });
    it('a body over the cap fails without being retried', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({ jobs: 'x'.repeat(5000) }), { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);
        await expect(fetchJson('https://boards-api.greenhouse.io/v1/boards/big/jobs', { maxBytes: 1024 })).rejects.toThrow(/larger than/);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    it('a body under the cap is parsed as before', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response('{"jobs":[1,2]}', { status: 200 })));
        expect(await fetchJson('https://boards-api.greenhouse.io/v1/boards/ok/jobs', { maxBytes: 1024 })).toEqual({ jobs: [1, 2] });
    });
});
