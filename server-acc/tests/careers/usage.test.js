import { describe, it, expect, vi } from 'vitest';
import { istWeekStart, weekStarts, visitorKey, usageQuery, recordVisit, recordApplyClick, firstClickToday } from '../../services/careers/usage/usage.js';

describe('IST weeks (F-30)', () => {
    it('starts on Monday 00:00 IST (= Sunday 18:30 UTC)', () => {
        // Saturday 10 Oct 2026, 18:00 IST
        expect(istWeekStart(new Date('2026-10-10T12:30:00Z')).toISOString()).toBe('2026-10-04T18:30:00.000Z');
        // Monday 5 Oct 00:10 IST is already the new week; Sunday 4 Oct 23:50 IST is not
        expect(istWeekStart(new Date('2026-10-04T18:40:00Z')).toISOString()).toBe('2026-10-04T18:30:00.000Z');
        expect(istWeekStart(new Date('2026-10-04T18:20:00Z')).toISOString()).toBe('2026-09-27T18:30:00.000Z');
    });
    it('lists the last n weeks, newest first', () => {
        const w = weekStarts(3, new Date('2026-10-10T12:30:00Z')).map((d) => d.toISOString().slice(0, 10));
        expect(w).toEqual(['2026-10-04', '2026-09-27', '2026-09-20']);
    });
    it('weeks is 1–26, default 8', () => {
        expect(usageQuery.parse({}).weeks).toBe(8);
        expect(() => usageQuery.parse({ weeks: '27' })).toThrow();
    });
});

describe('visitor keys', () => {
    const week = new Date('2026-10-04T18:30:00Z');
    it('same student and week → same key; another week or student → different', () => {
        const k = visitorKey(1, week, 's3cret');
        expect(k).toMatch(/^[0-9a-f]{64}$/);
        expect(visitorKey(1, week, 's3cret')).toBe(k);
        expect(visitorKey(1, new Date(week.getTime() + 7 * 864e5), 's3cret')).not.toBe(k);
        expect(visitorKey(2, week, 's3cret')).not.toBe(k);
    });
    it('the key does not contain the user id and depends on the secret', () => {
        expect(visitorKey(1, week, 'a')).not.toBe(visitorKey(1, week, 'b'));
    });
});

describe('recording', () => {
    const db = () => ({ careersWeeklyVisitor: { createMany: vi.fn() }, postingDailyStat: { upsert: vi.fn() } });
    it('counts a student once per week (skipDuplicates), never a career admin', async () => {
        const d = db();
        await recordVisit(d, { id: 5 }, { isAdmin: true, secret: 'x' });
        expect(d.careersWeeklyVisitor.createMany).not.toHaveBeenCalled();
        await recordVisit(d, { id: 5 }, { isAdmin: false, secret: 'x', now: new Date('2026-10-10T12:30:00Z') });
        const arg = d.careersWeeklyVisitor.createMany.mock.calls[0][0];
        expect(arg.skipDuplicates).toBe(true);
        expect(arg.data[0]).toEqual({ weekStart: new Date('2026-10-04T18:30:00Z'), visitorKey: visitorKey(5, new Date('2026-10-04T18:30:00Z'), 'x') });
        expect(JSON.stringify(arg)).not.toContain('"userId"');
    });
    it('without a secret nothing is stored (and it says so in the log)', async () => {
        const d = db();
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        await recordVisit(d, { id: 5 }, { isAdmin: false, secret: '' });
        expect(d.careersWeeklyVisitor.createMany).not.toHaveBeenCalled();
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
    it('an Apply click adds 1 to the posting\'s IST day', async () => {
        const d = db();
        await recordApplyClick(d, 9, new Date('2026-10-10T20:00:00Z')); // 11 Oct 01:30 IST
        expect(d.postingDailyStat.upsert).toHaveBeenCalledWith({
            where: { postingId_day: { postingId: 9, day: new Date('2026-10-10T18:30:00Z') } },
            create: { postingId: 9, day: new Date('2026-10-10T18:30:00Z'), applyClicks: 1 },
            update: { applyClicks: { increment: 1 } },
        });
    });
});

describe('Apply clicks are limited (security review of P7-T4)', () => {
    it('one per student, posting and IST day', () => {
        const state = { day: null, seen: new Set(), full: false };
        const t = new Date('2026-10-10T06:00:00Z');
        expect(firstClickToday(1, 9, t, state)).toBe(true);
        expect(firstClickToday(1, 9, t, state)).toBe(false);
        expect(firstClickToday(2, 9, t, state)).toBe(true);
        expect(firstClickToday(1, 10, t, state)).toBe(true);
        expect(firstClickToday(1, 9, new Date('2026-10-10T19:00:00Z'), state)).toBe(true); // next IST day
    });
});
