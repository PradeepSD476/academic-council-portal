import ExcelJS from 'exceljs';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { validateRegistry } from '../../services/exams/config.js';

const base = JSON.parse(readFileSync(new URL('../../config/exams/datasets.json', import.meta.url))).datasets[0];
export function config(changes = {}) {
    const c = { ...structuredClone(base), ...changes };
    return validateRegistry({ activeDatasets: [c.id], datasets: [c] }, { env: {} }).datasets[0];
}
export function fixtureSheets() {
    return {
        'EndSem Timetable': [
            ['HS', 'Morning 9:30 am - 12:30 pm', 'Evening 3:00 pm -  6:00 pm'],
            [new Date('2026-11-21T00:00:00Z'), 'AA100/BB100', 'CC200'],
            ['2026-11-22', 'DD300', ''],
            ['2026-11-24', 'Institute Holiday', ''],
        ],
        'Room Allocation EndSem': [
            ['Date', 'Slot', 'Room', 'Courses', 'Rolls'],
            ['2026-11-21', 'Morning', 102, 'BB100/AA100 (2)', '2601CS01,2601CS02,2601CS99'],
            ['2026-11-21', 'Evening', 'LT001', 'CC200 (1)', '2601CS01'],
            ['2026-11-22', 'Morning', 'Admin CC Lab 1', 'DD300 (1)', '2601CS04'],
        ],
        'Course Wise List': [
            ['Sub', 'Rolls', 'Count'],
            ['BB100/AA100', '2601CS01;2601CS02;2601CS03', { formula: '1+2' }],
            ['CC200', '2601CS01', 1],
            ['DD300', '2601CS04', 1],
            ['EE400', '2601CS05', 1],
        ],
    };
}
export async function workbookBytes(sheets = fixtureSheets()) {
    const workbook = new ExcelJS.Workbook();
    for (const [name, rows] of Object.entries(sheets)) workbook.addWorksheet(name).addRows(rows);
    return Buffer.from(await workbook.xlsx.writeBuffer());
}
export const mode = { dryRun: false, test: false, rolls: [], emails: [] };
export const env = { EXAM_REMINDERS_SEND_ENABLED: 'true', EXAM_REMINDERS_ADMIN_EMAIL: 'admin@example.org', SMTP_USER: 'acc@example.org' };
export const logger = { info() {}, error() {} };
export const users = [
    { id: 1, rollNo: ' 2601cs01 ', email: 'one@example.org' },
    { id: 2, rollNo: '2601CS02', email: 'two@example.org' },
    { id: 3, rollNo: '2601CS03', email: 'three@example.org' },
    { id: 4, rollNo: '2601CS04', email: 'four@example.org' },
    { id: 5, rollNo: '2601CS05', email: 'five@example.org' },
];

// Stateful test double for the persistence boundary. Claims are synchronous before returning
// promises, so concurrent runner tests exercise exclusive ownership and durable retry states.
export function memoryStore(initialUsers = users) {
    const runs = new Map(); const deliveries = new Map(); const caches = new Map();
    const keyOf = (key) => JSON.stringify(key);
    return {
        runs, records: deliveries,
        cache: { get: async (id, key) => caches.get(`${id}|${key}`), put: async (id, key, workbook, fetchedAt) => caches.set(`${id}|${key}`, { workbook, fetchedAt }) },
        users: async () => initialUsers,
        dueRuns: async (datasetId, examDate, runMode, now) => [...runs.values()].filter((r) => r.datasetId === datasetId && r.examDate === examDate && r.mode === runMode && ((r.status === 'WAITING' && r.nextRunAt <= now) || (r.status === 'RUNNING' && r.leaseUntil <= now))),
        async claimRun(args, now) {
            if ([...runs.values()].some((r) => r.status === 'RUNNING' && r.leaseUntil > now)) return null;
            const prior = runs.get(args.id);
            if (prior?.status === 'COMPLETE' || prior?.nextRunAt > now) return null;
            const run = { ...prior, ...args, status: 'RUNNING', claimToken: randomUUID(), attempts: (prior?.attempts || 0) + 1, leaseUntil: new Date(+now + 900_000) };
            runs.set(args.id, run); return run;
        },
        async renewRun() {},
        async renewDelivery() {},
        async finishRun(run, summary, nextRunAt) { runs.set(run.id, { ...run, summary, status: nextRunAt ? 'WAITING' : 'COMPLETE', nextRunAt, leaseUntil: null }); },
        async adminResult(id, error) { const r = runs.get(id); r.adminStatus = error ? 'FAILED' : 'SENT'; r.adminError = error; },
        async claimDelivery(key, recipient, max, now) {
            const id = keyOf(key); const r = deliveries.get(id);
            if (r?.status === 'SENT' || r?.status === 'PERMANENT_FAILURE' || r?.status === 'EXHAUSTED') return { skipped: r.status };
            if (r?.status === 'SENDING' && r.leaseUntil > now) return { skipped: 'IN_PROGRESS', retryAt: r.leaseUntil };
            if (r?.nextRetryAt > now) return { skipped: 'BACKOFF', retryAt: r.nextRetryAt };
            if (r?.attempts >= max) { r.status = 'EXHAUSTED'; return { skipped: 'EXHAUSTED' }; }
            const claim = { key, attempts: (r?.attempts || 0) + 1, claimToken: randomUUID() };
            deliveries.set(id, { ...key, ...claim, recipient, status: 'SENDING', leaseUntil: new Date(+now + 900_000) });
            return claim;
        },
        async completeDelivery(claim, data) {
            const row = deliveries.get(keyOf(claim.key));
            if (row.claimToken !== claim.claimToken) throw new Error('lease lost');
            Object.assign(row, data, { leaseUntil: null });
        },
        deliveries: async (datasetId, examDate) => [...deliveries.values()].filter((r) => r.datasetId === datasetId && r.examDate === examDate),
    };
}
