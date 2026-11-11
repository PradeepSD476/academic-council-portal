import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/db.js', () => ({ default: {} }));
const { needsPersonWhere, waitingForAdmin, WAITING_ALERT_HOURS } = await import('../../services/careers/links/waiting.js');
const { dismissBody, dismissProblem } = await import('../../services/careers/links/submissionActions.js');
const { computeAlerts } = await import('../../services/careers/ops/alerts.js');

const sub = (over = {}) => ({ status: 'EXTRACTING', postingId: null, dismissedAt: null, ...over });

describe('waitingForAdmin (F-18: what the student sees)', () => {
    it('a link waiting for the AI step while the AI is off waits for a person', () => {
        expect(waitingForAdmin(sub(), false)).toBe(true);
    });
    it('not while the AI tier works, nor for other statuses, dismissed or linked rows', () => {
        expect(waitingForAdmin(sub(), true)).toBe(false);
        expect(waitingForAdmin(sub({ status: 'RECEIVED' }), false)).toBe(false);
        expect(waitingForAdmin(sub({ dismissedAt: new Date() }), false)).toBe(false);
        expect(waitingForAdmin(sub({ postingId: 3 }), false)).toBe(false);
    });
});

describe('needsPersonWhere (admin "Needs a person" filter)', () => {
    it('always includes store-only links; AI-step links only while the AI tier is unusable', () => {
        expect(needsPersonWhere(true)).toEqual({ dismissedAt: null, postingId: null, OR: [{ status: 'STORED_ONLY' }] });
        expect(needsPersonWhere(false)).toEqual({ dismissedAt: null, postingId: null, OR: [{ status: 'STORED_ONLY' }, { status: 'EXTRACTING' }] });
    });
});

describe('dismiss (admin)', () => {
    it('needs a reason of 1-200 characters', () => {
        expect(dismissBody.parse({ reason: '  Not a job page ' })).toEqual({ reason: 'Not a job page' });
        for (const bad of [{}, { reason: ' ' }, { reason: 'x'.repeat(201) }, { reason: 'ok', extra: 1 }]) expect(dismissBody.safeParse(bad).success).toBe(false);
    });
    it('refuses a link already dismissed or already turned into a posting', () => {
        expect(dismissProblem(sub())).toBeNull();
        expect(dismissProblem(sub({ status: 'FAILED' }))).toBeNull();
        expect(dismissProblem(sub({ dismissedAt: new Date() }))).toMatch(/already/i);
        expect(dismissProblem(sub({ postingId: 4 }))).toMatch(/posting/i);
    });
});

describe('ops alert for links waiting too long', () => {
    const quiet = {
        worker: { stale: false }, sources: { list: [] },
        queue: { flagged: 0, submissions: { failed: 0, waitingOver48h: 0 } },
        llm: { enabled: false, usable: null, budgetEnforced: false },
    };
    it(`amber when a link has waited more than ${WAITING_ALERT_HOURS} h`, () => {
        expect(computeAlerts(quiet)).toEqual([]);
        const alerts = computeAlerts({ ...quiet, queue: { ...quiet.queue, submissions: { failed: 0, waitingOver48h: 2 } } });
        expect(alerts.map((a) => `${a.level}:${a.code}`)).toEqual(['amber:LINKS_WAITING']);
    });
});
