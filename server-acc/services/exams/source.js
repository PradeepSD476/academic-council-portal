import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import ExcelJS from 'exceljs';
import { parseWorkbook } from './workbook.js';
import { qualityReport } from './schedule.js';

export const digest = (data) => createHash('sha256').update(data).digest('hex');
const MAX_BYTES = 20 * 1024 * 1024;

export function exportUrl(input) {
    const url = new URL(input);
    if (url.protocol !== 'https:' || url.hostname !== 'docs.google.com') throw new Error('Live exam source must be an HTTPS docs.google.com spreadsheet URL');
    const match = url.pathname.match(/^\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (!match || match[1] === 'e') throw new Error('Use a view-only Google Sheet URL (/spreadsheets/d/ID/) or configure published tab URLs');
    return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=xlsx`;
}

async function download(url, fetcher) {
    const response = await fetcher(url, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`Live sheet returned HTTP ${response.status}`);
    if (Number(response.headers.get('content-length')) > MAX_BYTES) throw new Error('Live workbook exceeds 20 MB');
    const chunks = []; let size = 0;
    for await (const chunk of response.body) {
        size += chunk.length;
        if (size > MAX_BYTES) throw new Error('Live workbook exceeds 20 MB');
        chunks.push(chunk);
    }
    if (!size) throw new Error('Live workbook is empty');
    return Buffer.concat(chunks);
}

async function liveWorkbook(config, fetcher) {
    const url = new URL(config.liveUrl);
    if (url.protocol !== 'https:' || url.hostname !== 'docs.google.com') throw new Error('Live exam source must be an HTTPS docs.google.com spreadsheet URL');
    const published = url.pathname.match(/^\/spreadsheets\/d\/e\/([a-zA-Z0-9_-]+)\/pub/);
    if (!published) return download(exportUrl(config.liveUrl), fetcher);
    const workbook = new ExcelJS.Workbook();
    for (const tab of [config.timetable.tab, config.rooms.tab, config.enrolments.tab]) {
        const gid = config.source.publishedTabGids?.[tab];
        if (!gid) throw new Error(`Published sheet needs source.publishedTabGids['${tab}'] in config`);
        const bytes = await download(`https://docs.google.com/spreadsheets/d/e/${published[1]}/pub?gid=${gid}&single=true&output=csv`, fetcher);
        await workbook.csv.read(Readable.from([bytes]), { sheetName: tab, map: (value) => value });
    }
    return Buffer.from(await workbook.xlsx.writeBuffer());
}

// cache is injectable: { get(datasetId, sourceKey), put(datasetId, sourceKey, bytes) }.
export async function loadDataset(config, { cache, fetcher = fetch, read = readFile, parser = parseWorkbook, logger = console } = {}) {
    const attempts = [];
    const sourceKey = digest(`${config.liveUrl || 'no-live-url'}|${JSON.stringify(config.source.publishedTabGids || {})}`);
    async function accept(bytes, source, fetchedAt) {
        if (!bytes.length || bytes.length > MAX_BYTES) throw new Error('Workbook is empty or exceeds 20 MB');
        const model = await parser(bytes, config);
        const report = qualityReport(model, config);
        const metadata = { source, fetchedAt: fetchedAt?.toISOString?.() || fetchedAt || null, hash: digest(bytes), fallbackReasons: [...attempts] };
        logger.info(`[exams] ${config.id}: source=${source}, hash=${metadata.hash}, cachedAt=${metadata.fetchedAt || '-'}, fallback=${JSON.stringify(attempts)}`);
        return { model, report, metadata };
    }
    try {
        if (!config.liveUrl) throw new Error(`Live URL is not configured (${config.source.liveUrlEnv})`);
        const bytes = await liveWorkbook(config, fetcher);
        const now = new Date();
        const loaded = await accept(bytes, 'live', now);
        if (cache) {
            try { await cache.put(config.id, sourceKey, bytes, now); }
            catch { logger.error(`[exams] ${config.id}: could not persist the validated live cache`); }
        }
        return loaded;
    } catch (err) { attempts.push(`live: ${err.message}`); }
    if (cache) {
        try {
            const cached = await cache.get(config.id, sourceKey);
            if (!cached) throw new Error('No last good live copy for this dataset and URL');
            return await accept(Buffer.from(cached.workbook), 'cached-live', cached.fetchedAt);
        } catch (err) { attempts.push(`cached-live: ${err.message}`); }
    }
    try {
        if (!config.fallbackPath) throw new Error(`Fallback path is not configured (${config.source.fallbackPathEnv})`);
        return await accept(await read(config.fallbackPath), 'xlsx', null);
    } catch (err) { attempts.push(`xlsx: ${err.message}`); }
    throw new Error(`No valid exam dataset '${config.id}'. ${attempts.join('; ')}`);
}
