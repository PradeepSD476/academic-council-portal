import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { DateTime, IANAZone } from 'luxon';

export const defaultConfigPath = fileURLToPath(new URL('../../config/exams/datasets.json', import.meta.url));
const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const column = z.union([z.string().min(1), z.array(z.string().min(1)).nonempty(), z.object({ position: z.number().int().positive() })]);
const role = z.object({ tab: z.string().min(1), columns: z.record(z.string(), column) });
const datasetSchema = z.object({
    id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
    examName: z.string().min(1),
    adapter: z.string().default('mapped'),
    adapterOptions: z.record(z.string(), z.unknown()).default({}),
    source: z.object({ liveUrlEnv: z.string().min(1).default('EXAM_SHEET_URL'), fallbackPathEnv: z.string().min(1).default('EXAM_FALLBACK_PATH'), liveUrl: z.string().optional(), fallbackPath: z.string().optional(), publishedTabGids: z.record(z.string(), z.string().regex(/^\d+$/)).optional() }),
    timezone: z.string().default('Asia/Kolkata').refine((s) => IANAZone.isValidZone(s), 'Invalid timezone'),
    sendAt: clock.default('07:30'),
    sendAtEnv: z.string().optional(),
    dateFormats: z.array(z.string()).nonempty().default(['yyyy-MM-dd', 'dd/MM/yyyy', 'd/M/yyyy']),
    coursePattern: z.string().default('^[A-Z]{2,4}[0-9]{3,4}$'),
    roll: z.object({ trim: z.boolean().default(true), uppercase: z.boolean().default(true), pattern: z.string().default('^[0-9]{4}[A-Z]{2}[0-9]{2}$') }).default({ trim: true, uppercase: true, pattern: '^[0-9]{4}[A-Z]{2}[0-9]{2}$' }),
    separators: z.object({ courses: z.array(z.string().min(1)).nonempty(), roomCourses: z.array(z.string().min(1)).nonempty(), roomRolls: z.array(z.string().min(1)).nonempty(), enrolmentRolls: z.array(z.string().min(1)).nonempty(), unit: z.string().min(1) }),
    holidays: z.object({ keywords: z.array(z.string()).default([]), dates: z.array(z.string()).default([]) }).default({ keywords: [], dates: [] }),
    slots: z.array(z.object({ id: z.string().min(1), label: z.string().min(1), aliases: z.array(z.string()).nonempty(), header: column.optional(), start: clock, end: clock, displayTime: z.string().min(1) })).nonempty(),
    timetable: role.extend({ layout: z.string().default('grid') }),
    rooms: role,
    enrolments: role,
    delivery: z.object({ batchSize: z.number().int().min(1).max(100).default(25), maxPerMinute: z.number().min(1).max(600).default(60), maxAttempts: z.number().int().min(1).max(10).default(3), retryMinutes: z.array(z.number().positive()).nonempty().default([1, 5]) }).default({ batchSize: 25, maxPerMinute: 60, maxAttempts: 3, retryMinutes: [1, 5] }),
});
const registrySchema = z.object({ activeDatasets: z.array(z.string()), datasets: z.array(datasetSchema).nonempty() });

export function validateRegistry(input, { env = process.env, baseDir = process.cwd() } = {}) {
    const parsed = registrySchema.safeParse(input);
    if (!parsed.success) throw new Error(`Invalid exam config: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    const result = parsed.data;
    const ids = new Set();
    for (const c of result.datasets) {
        if (ids.has(c.id)) throw new Error(`Duplicate exam dataset id '${c.id}'`);
        ids.add(c.id);
        if (new Set(c.slots.map((s) => s.id)).size !== c.slots.length) throw new Error(`Duplicate slot id in '${c.id}'`);
        for (const pattern of [c.roll.pattern, c.coursePattern]) {
            try { new RegExp(pattern); } catch { throw new Error(`Invalid regular expression in '${c.id}': ${pattern}`); }
        }
        c.liveUrl = env[c.source.liveUrlEnv] || c.source.liveUrl || '';
        const fallbackPath = env[c.source.fallbackPathEnv] || c.source.fallbackPath;
        c.fallbackPath = fallbackPath ? resolve(baseDir, fallbackPath) : '';
        c.sendAt = (c.sendAtEnv && env[c.sendAtEnv]) || c.sendAt;
        if (!clock.safeParse(c.sendAt).success) throw new Error(`Invalid send time for '${c.id}': expected HH:mm`);
        for (const date of c.holidays.dates) if (!DateTime.fromISO(date).isValid || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Invalid holiday date '${date}'`);
        if (c.adapter === 'mapped') {
            if (!['grid', 'rows'].includes(c.timetable.layout)) throw new Error(`Mapped timetable layout must be grid or rows in '${c.id}'`);
            const required = { timetable: c.timetable.layout === 'grid' ? ['date'] : ['date', 'slot', 'unit'], rooms: ['date', 'slot', 'room', 'unit', 'rolls'], enrolments: ['unit', 'rolls'] };
            for (const [name, fields] of Object.entries(required)) for (const field of fields) if (!c[name].columns[field]) throw new Error(`Config '${c.id}' is missing ${name}.columns.${field}`);
            if (c.timetable.layout === 'grid' && c.slots.some((s) => !s.header)) throw new Error(`Every grid slot in '${c.id}' needs a header mapping`);
        }
        for (const s of c.slots) if (s.end <= s.start) throw new Error(`Slot '${s.id}' must end after it starts`);
    }
    for (const id of result.activeDatasets) if (!ids.has(id)) throw new Error(`Active exam dataset '${id}' not found`);
    return result;
}

export async function loadRegistry(path, env = process.env) {
    path = path || env.EXAM_REMINDERS_CONFIG || defaultConfigPath;
    return validateRegistry(JSON.parse(await readFile(path, 'utf8')), { env, baseDir: dirname(resolve(path)) });
}

export function getDataset(registry, id) {
    const config = registry.datasets.find((d) => d.id === id);
    if (!config) throw new Error(`Exam dataset '${id}' not found`);
    return config;
}

export function deliveryMode({ send = false, test = false, env = process.env } = {}) {
    const rolls = (env.EXAM_REMINDERS_TEST_ROLLS || '').split(',').map((r) => r.trim()).filter(Boolean);
    const emails = (env.EXAM_REMINDERS_TEST_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (send && env.EXAM_REMINDERS_SEND_ENABLED !== 'true') throw new Error('Live sending is disabled. Set EXAM_REMINDERS_SEND_ENABLED=true explicitly.');
    if (test && !rolls.length && !emails.length) throw new Error('Test mode requires an allowlist: EXAM_REMINDERS_TEST_ROLLS or EXAM_REMINDERS_TEST_EMAILS.');
    if (send && (!env.EXAM_REMINDERS_ADMIN_EMAIL || !(env.EXAM_REMINDERS_FROM || env.SMTP_USER))) throw new Error('Live sending requires an admin email and sender address.');
    return { dryRun: !send, test, rolls, emails };
}
