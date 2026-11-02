// Usage numbers for ACC (P7-T4, F-30): weekly aggregate counts only. Nothing here can say which
// student did what: visitors are stored as a keyed hash per week, Apply clicks as per-posting daily
// counters, and saves / tracking are counted, never listed.
import crypto from 'node:crypto';
import { z } from 'zod';
import { istDayStart } from '../istDate.js';

const DAY_MS = 24 * 60 * 60 * 1000;
export const MAX_WEEKS = 26;

// Monday 00:00 IST of the week containing now, as a UTC instant.
export function istWeekStart(now = new Date()) {
    const day = istDayStart(now);
    // The IST weekday of that day start: shift into IST to read it.
    const weekday = new Date(day.getTime() + 330 * 60 * 1000).getUTCDay(); // 0 = Sunday
    const back = (weekday + 6) % 7; // days since Monday
    return new Date(day.getTime() - back * DAY_MS);
}

// The last n week starts, newest first.
export function weekStarts(n, now = new Date()) {
    const first = istWeekStart(now);
    return Array.from({ length: n }, (_, i) => new Date(first.getTime() - i * 7 * DAY_MS));
}

// Keyed per week, so the same student gets an unrelated key next week and the key cannot be turned
// back into a user id without the server secret.
export function visitorKey(userId, weekStart, secret) {
    return crypto.createHmac('sha256', `careers-visitors:${secret}`).update(`${userId}:${weekStart.toISOString()}`).digest('hex');
}

export const usageQuery = z.object({ weeks: z.coerce.number().int().min(1).max(MAX_WEEKS).default(8) });

// The student jobs list was opened: count this student once for the week. Career admins are not
// counted (they browse to review). Never throws into the request: a failure is logged.
export async function recordVisit(db, user, { isAdmin, now = new Date(), secret = process.env.SECRET_KEY } = {}) {
    if (isAdmin || !user?.id) return;
    if (!secret) {
        console.error('[careers] usage: SECRET_KEY is not set, visits are not counted');
        return;
    }
    const weekStart = istWeekStart(now);
    await db.careersWeeklyVisitor.createMany({ data: [{ weekStart, visitorKey: visitorKey(user.id, weekStart, secret) }], skipDuplicates: true });
}

// One counted Apply click per student, posting and IST day, so repeated clicks (or a script) cannot
// inflate the numbers. Kept in memory only: nothing that names the student reaches the database.
// With several API processes a click may count once per process; fine for usage numbers.
export const MAX_TRACKED_CLICKS = 200_000;
const clickState = { day: null, seen: new Set(), full: false };
export function firstClickToday(userId, postingId, now = new Date(), state = clickState) {
    const day = istDayStart(now).getTime();
    if (state.day !== day) Object.assign(state, { day, seen: new Set(), full: false });
    const key = `${userId}:${postingId}`;
    if (state.seen.has(key)) return false;
    if (state.seen.size >= MAX_TRACKED_CLICKS) {
        if (!state.full) console.error(`[careers] usage: ${MAX_TRACKED_CLICKS} Apply clicks today, not counting more`);
        state.full = true;
        return false;
    }
    state.seen.add(key);
    return true;
}

export async function recordApplyClick(db, postingId, now = new Date()) {
    const day = istDayStart(now);
    await db.postingDailyStat.upsert({
        where: { postingId_day: { postingId, day } },
        create: { postingId, day, applyClicks: 1 },
        update: { applyClicks: { increment: 1 } },
    });
}

// Weekly numbers, newest week first. Each count is one aggregate query; nothing per student leaves it.
export async function usageSummary(db, { weeks = 8, now = new Date() } = {}) {
    const starts = weekStarts(weeks, now);
    const rows = await Promise.all(starts.map(async (start) => {
        const end = new Date(start.getTime() + 7 * DAY_MS);
        const range = { gte: start, lt: end };
        const [visitors, saves, trackingStarted, markedApplied, clicks, published] = await Promise.all([
            db.careersWeeklyVisitor.count({ where: { weekStart: start } }),
            db.savedPosting.count({ where: { createdAt: range } }),
            db.postingApplication.count({ where: { createdAt: range } }),
            db.postingApplication.count({ where: { appliedAt: range } }),
            db.postingDailyStat.aggregate({ where: { day: range }, _sum: { applyClicks: true } }),
            db.posting.count({ where: { publishedAt: range } }),
        ]);
        return { weekStart: start, visitors, saves, trackingStarted, markedApplied, applyClicks: clicks._sum.applyClicks ?? 0, published };
    }));
    const live = await db.posting.count({ where: { status: 'LIVE' } });
    return { weeks: rows, live };
}

// Apply clicks per posting for the admin list (aggregate per posting).
export async function applyClicksFor(db, postingIds) {
    if (!postingIds.length) return {};
    const groups = await db.postingDailyStat.groupBy({ by: ['postingId'], where: { postingId: { in: postingIds } }, _sum: { applyClicks: true } });
    return Object.fromEntries(groups.map((g) => [g.postingId, g._sum.applyClicks ?? 0]));
}
