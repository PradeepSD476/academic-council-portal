// Shared links that need a person (P5-T5, F-18). A link that is neither an ATS link nor a page with
// JSON-LD waits for the AI step (status EXTRACTING). While that tier is off or its provider is down,
// nothing will ever read it, so the student sees "Waiting for an ACC admin" and admins find it under
// "Needs a person", together with store-only links (LinkedIn, ...) that always need a person.
import prisma from '../../../config/db.js';
import { getSetting } from '../settings.js';
import { providerStatus, isUsable } from '../extract/providerStatus.js';

export const WAITING_ALERT_HOURS = 48;
const CACHE_MS = 60 * 1000;
let cached = null; // { at, usable }

// Is the AI step working right now? The live provider check is cached for a minute (it may ping Ollama).
export async function aiTierUsable(now = Date.now()) {
    if (!(await getSetting('careers.llmEnabled'))) return false;
    if (cached && now - cached.at < CACHE_MS) return cached.usable;
    let usable = false;
    try { usable = isUsable(await providerStatus()) === true; } catch { usable = false; }
    cached = { at: now, usable };
    return usable;
}

// Pure.
export function waitingForAdmin(s, aiUsable) {
    return s.status === 'EXTRACTING' && !s.dismissedAt && !s.postingId && !aiUsable;
}

// Pure. The admin "Needs a person" filter.
export function needsPersonWhere(aiUsable) {
    return {
        dismissedAt: null,
        postingId: null,
        OR: [{ status: 'STORED_ONLY' }, ...(aiUsable ? [] : [{ status: 'EXTRACTING' }])],
    };
}

// Pure. Links an admin has to act on (B-26): failed ones (retry or dismiss) and the "Needs a person"
// ones. Dismissed and withdrawn links never count. The review tab's badge and default filter.
export function needsAttentionWhere(aiUsable) {
    const person = needsPersonWhere(aiUsable);
    return { dismissedAt: null, OR: [{ status: 'FAILED' }, { postingId: null, OR: person.OR }] };
}

// For the ops summary: how many need a person, and how many of them have waited too long.
export async function needsPersonCounts(aiUsable, now = new Date(), db = prisma) {
    const where = needsPersonWhere(aiUsable);
    const [total, overdue] = await Promise.all([
        db.linkSubmission.count({ where }),
        db.linkSubmission.count({ where: { ...where, createdAt: { lt: new Date(now.getTime() - WAITING_ALERT_HOURS * 3600 * 1000) } } }),
    ]);
    return { needsPerson: total, waitingOver48h: overdue };
}
