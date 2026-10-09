// Runtime-tunable careers settings, stored in AppSetting so admins can change them without a redeploy.
// A missing row means "use the default"; getSetting never fails because a row is absent.
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../../config/db.js';

const runRequestSchema = z.object({
    sourceId: z.union([z.number().int().positive(), z.literal('ALL')]),
    requestedAt: z.string(),
    byUserId: z.number().int(),
}).nullable();

const heartbeatSchema = z.object({ at: z.string(), job: z.string() }).nullable();

// editable = may be changed through PUT /careers/admin/settings. The others are written by
// dedicated endpoints (run requests) or by the worker (heartbeat).
export const SETTINGS = {
    'careers.visibleToStudents': { default: false, editable: true, schema: z.boolean() },
    'careers.ingestionEnabled': { default: true, editable: true, schema: z.boolean() },
    'careers.llmEnabled': { default: false, editable: true, schema: z.boolean() },
    'careers.llmPaidTier': { default: false, editable: true, schema: z.boolean() },
    'careers.llmMonthlyBudgetUsd': { default: 5, editable: true, schema: z.number().min(0).max(1000) },
    'careers.llmDailyRequestLimit': { default: 200, editable: true, schema: z.number().int().min(0).max(100000) },
    'careers.confidenceThreshold': { default: 0.8, editable: true, schema: z.number().min(0).max(1) },
    'careers.fuzzyThreshold': { default: 0.92, editable: true, schema: z.number().min(0.5).max(1) },
    'careers.submissionDailyLimit': { default: 5, editable: true, schema: z.number().int().min(0).max(100) },
    'careers.runRequest': { default: null, editable: false, schema: runRequestSchema },
    'careers.workerHeartbeat': { default: null, editable: false, schema: heartbeatSchema },
};

const CACHE_MS = 30_000;
const cache = new Map(); // key -> { value, expiresAt }

function definitionFor(key) {
    const def = SETTINGS[key];
    if (!def) throw new Error(`Unknown careers setting: ${key}`);
    return def;
}

export async function getSetting(key) {
    const def = definitionFor(key);
    const hit = cache.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.value;

    const row = await prisma.appSetting.findUnique({ where: { key } });
    const value = row ? row.value : def.default;
    cache.set(key, { value, expiresAt: Date.now() + CACHE_MS });
    return value;
}

export async function getAllSettings() {
    const rows = await prisma.appSetting.findMany({ where: { key: { in: Object.keys(SETTINGS) } } });
    const stored = new Map(rows.map((r) => [r.key, r]));
    return Object.entries(SETTINGS).map(([key, def]) => ({
        key,
        value: stored.has(key) ? stored.get(key).value : def.default,
        isDefault: !stored.has(key),
        editable: def.editable,
        updatedAt: stored.get(key)?.updatedAt ?? null,
        updatedById: stored.get(key)?.updatedById ?? null,
    }));
}

// Validates before writing, so a bad value can never reach the DB. Throws a ZodError on invalid input.
export async function setSetting(key, value, updatedById = null) {
    const def = definitionFor(key);
    const parsed = def.schema.parse(value);
    // A required Json column can't take a plain null; Prisma.JsonNull stores a JSON null.
    const json = parsed === null ? Prisma.JsonNull : parsed;
    await prisma.appSetting.upsert({
        where: { key },
        update: { value: json, updatedById },
        create: { key, value: json, updatedById },
    });
    cache.delete(key);
    return parsed;
}

// Several keys at once, all or nothing (B-13): every value is validated first, then all are written
// in one transaction, so a failed write leaves none of them changed.
export async function setSettings(values, updatedById = null) {
    const parsed = Object.entries(values).map(([key, value]) => [key, definitionFor(key).schema.parse(value)]);
    await prisma.$transaction(parsed.map(([key, value]) => {
        const json = value === null ? Prisma.JsonNull : value;
        return prisma.appSetting.upsert({ where: { key }, update: { value: json, updatedById }, create: { key, value: json, updatedById } });
    }));
    for (const [key] of parsed) cache.delete(key);
    return Object.fromEntries(parsed);
}

export function clearSettingsCache() {
    cache.clear();
}
