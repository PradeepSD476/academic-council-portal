import { describe, it, expect } from 'vitest';
import { planEdit, checkCompensation } from '../../services/careers/postings/editPosting.js';
import { bulkSkipReason, reviewWhere } from '../../services/careers/postings/reviewService.js';
import { mergeRunRequest } from '../../controllers/careers/adminSourcesController.js';
import { computeAlerts, minutesSince } from '../../services/careers/ops/alerts.js';
import { istDayStart, istMonthStart } from '../../services/careers/ops/llmStatus.js';

const posting = {
    id: 1, companyId: 3, roleTitle: 'SWE Intern', roleTitleNormalized: 'software engineer intern', type: 'UNKNOWN',
    location: 'Hybrid', locationNormalized: 'hybrid', skills: [], compCurrency: 'INR',
    stipendMin: null, stipendMax: null, stipendDisclosure: 'NOT_DISCLOSED', ctcMin: null, ctcMax: null, ctcDisclosure: 'NOT_DISCLOSED',
    compensationRaw: null, descriptionText: 'd', deadlineStated: null, minCpi: null, uncertainFields: ['type', 'location'],
};

describe('planEdit', () => {
    it('returns only real changes, with from/to, and clears the uncertainty of edited fields', () => {
        const { data, changes } = planEdit(posting, { type: 'INTERNSHIP', roleTitle: 'SWE Intern' });
        expect(changes).toEqual({ type: { from: 'UNKNOWN', to: 'INTERNSHIP' } });
        expect(data).toEqual({ type: 'INTERNSHIP', uncertainFields: ['location'] });
    });
    it('recomputes derived columns', () => {
        const { data } = planEdit(posting, { roleTitle: 'SDE Intern (Summer 2027)', location: 'Bangalore' });
        expect(data.roleTitleNormalized).toBe('software engineer intern');
        expect(data.locationNormalized).toBe('bengaluru');
        expect(data.uncertainFields).toEqual(['type']);
    });
    it('accepts a disclosed stipend range', () => {
        const { data } = planEdit(posting, { stipendMin: 40000, stipendMax: 60000, stipendDisclosure: 'RANGE' });
        expect(data).toMatchObject({ stipendMin: 40000, stipendMax: 60000, stipendDisclosure: 'RANGE' });
    });
    it('refuses a number for undisclosed pay (unknown is never 0)', () => {
        expect(() => planEdit(posting, { stipendMin: 0, stipendMax: 0 })).toThrow(/must not have amounts/);
    });
    it('refuses UNCLEAR without the raw wording', () => {
        expect(() => planEdit(posting, { stipendDisclosure: 'UNCLEAR' })).toThrow(/compensationRaw/);
    });
    it('rejects unknown fields and bad values', () => {
        expect(() => planEdit(posting, { status: 'LIVE' })).toThrow();
        expect(() => planEdit(posting, { applyUrl: 'javascript:alert(1)' })).toThrow();
        expect(() => planEdit(posting, { eligibleBranches: ['computer science'] })).toThrow();
    });
    it('normalises skills to their canonical names and keeps unknown ones', () => {
        expect(planEdit(posting, { skills: ['reactjs', 'React', 'Figma Jam'] }).data.skills).toEqual(['React', 'Figma Jam']);
    });
    it('a date equal to the stored one is not a change', () => {
        const p = { ...posting, deadlineStated: new Date('2026-10-15T00:00:00Z') };
        expect(planEdit(p, { deadlineStated: '2026-10-15T00:00:00.000Z' }).changes).toEqual({});
    });
});

describe('checkCompensation', () => {
    const base = { stipendDisclosure: 'NOT_DISCLOSED', ctcDisclosure: 'NOT_DISCLOSED', compensationRaw: null };
    it.each([
        [{ stipendDisclosure: 'DISCLOSED', stipendMin: 5, stipendMax: 5 }, 0],
        [{ stipendDisclosure: 'DISCLOSED', stipendMin: 5, stipendMax: 6 }, 1],
        [{ stipendDisclosure: 'RANGE', stipendMin: 9, stipendMax: 6 }, 1],
        [{ stipendDisclosure: 'RANGE', stipendMin: null, stipendMax: 6 }, 1],
        [{ ctcDisclosure: 'UNCLEAR', compensationRaw: '1.2L' }, 0],
    ])('%j -> %i problems', (over, n) => {
        expect(checkCompensation({ ...base, ...over })).toHaveLength(n);
    });
});

describe('bulkSkipReason', () => {
    const ok = { status: 'PENDING_REVIEW', extractionTier: 'STRUCTURED', uncertainFields: [], extractionConfidence: 1, company: { status: 'ACTIVE' } };
    it('a clean structured posting may be bulk-approved', () => expect(bulkSkipReason(ok, 0.8)).toBeNull());
    it.each([
        [{ uncertainFields: ['type'] }, /uncertain/],
        [{ extractionConfidence: 0.7 }, /below/],
        [{ extractionTier: 'LLM_FAST' }, /individual/],
        [{ extractionTier: 'MANUAL', extractionConfidence: null }, /individual/],
        [{ status: 'LIVE' }, /LIVE/],
        [{ company: { status: 'CANDIDATE' } }, /CANDIDATE/],
    ])('%j is skipped', (over, reason) => {
        expect(bulkSkipReason({ ...ok, ...over }, 0.8)).toMatch(reason);
    });
});

describe('reviewWhere', () => {
    it('both tabs are pending-only and split on confidence + uncertain fields', () => {
        expect(reviewWhere('flagged', 0.8)).toEqual({
            status: 'PENDING_REVIEW',
            OR: [{ extractionConfidence: { lt: 0.8 } }, { NOT: { uncertainFields: { isEmpty: true } } }],
        });
        expect(reviewWhere('pending', 0.8).status).toBe('PENDING_REVIEW');
    });
});

describe('mergeRunRequest', () => {
    it('keeps a single source, upgrades two different ones to ALL', () => {
        expect(mergeRunRequest(null, 5)).toBe(5);
        expect(mergeRunRequest({ sourceId: 5 }, 5)).toBe(5);
        expect(mergeRunRequest({ sourceId: 5 }, 6)).toBe('ALL');
        expect(mergeRunRequest({ sourceId: 'ALL' }, 6)).toBe('ALL');
    });
});

describe('alerts', () => {
    const quiet = {
        worker: { stale: false, lastHeartbeatAt: 'x', minutesSince: 1 },
        sources: { list: [{ name: 'Stripe', health: 'OK' }] },
        queue: { flagged: 3, submissions: { failed: 0 } },
        llm: { enabled: false, usable: null, budgetEnforced: false, pctUsed: 0 },
    };
    it('no alerts when all is well', () => expect(computeAlerts(quiet)).toEqual([]));
    it('red for a stale worker, a failing source, an unusable enabled LLM, a spent budget', () => {
        const codes = computeAlerts({
            ...quiet,
            worker: { stale: true, lastHeartbeatAt: 'x', minutesSince: 45 },
            sources: { list: [{ name: 'Bogus', health: 'FAILING', lastError: 'HTTP 404' }] },
            llm: { enabled: true, usable: false, provider: 'ollama', lastError: 'connection refused', budgetEnforced: true, pctUsed: 100, budgetUsd: 5 },
        }).map((a) => `${a.level}:${a.code}`);
        expect(codes).toEqual(['red:WORKER_STALE', 'red:SOURCE_FAILING', 'red:LLM_UNAVAILABLE', 'red:LLM_BUDGET_REACHED']);
    });
    it('amber for zero results, 80% budget, a flagged backlog, failed links', () => {
        const codes = computeAlerts({
            ...quiet,
            sources: { list: [{ name: 'Empty', health: 'ZERO_RESULTS' }] },
            queue: { flagged: 51, submissions: { failed: 2 } },
            llm: { enabled: true, usable: true, budgetEnforced: true, pctUsed: 85 },
        }).map((a) => `${a.level}:${a.code}`);
        expect(codes).toEqual(['amber:LLM_BUDGET_80', 'amber:SOURCE_ZERO_RESULTS', 'amber:FLAGGED_BACKLOG', 'amber:SUBMISSIONS_FAILED']);
    });
    it('budget alerts only apply when a budget is enforced (paid Gemini)', () => {
        expect(computeAlerts({ ...quiet, llm: { enabled: true, usable: true, budgetEnforced: false, pctUsed: 300 } })).toEqual([]);
    });
    it('unknown reachability (null) never raises an alert', () => {
        expect(computeAlerts({ ...quiet, llm: { enabled: true, usable: null, budgetEnforced: false } })).toEqual([]);
    });
    it('minutesSince', () => {
        expect(minutesSince('2026-10-01T10:00:00Z', new Date('2026-10-01T10:21:30Z'))).toBe(21);
        expect(minutesSince(null)).toBeNull();
    });
});

describe('IST boundaries', () => {
    it('day and month start in IST (UTC+5:30)', () => {
        const now = new Date('2026-10-31T20:00:00Z'); // 1 Nov 01:30 IST
        expect(istDayStart(now).toISOString()).toBe('2026-10-31T18:30:00.000Z');
        expect(istMonthStart(now).toISOString()).toBe('2026-10-31T18:30:00.000Z');
        expect(istMonthStart(new Date('2026-10-15T00:00:00Z')).toISOString()).toBe('2026-09-30T18:30:00.000Z');
    });
});
