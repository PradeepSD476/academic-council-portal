import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/db.js', () => ({ default: {} }));
const { reportBody, REPORT_REASONS, REPORT_FLAG_AT, flagAfterReport, flagsAfterHandled } = await import('../../services/careers/postings/reports.js');

describe('reportBody (Report a problem, F-05)', () => {
    it('accepts the listed reasons with an optional note', () => {
        expect(REPORT_REASONS).toEqual(['CLOSED', 'WRONG_PAY', 'WRONG_ELIGIBILITY', 'NOT_A_JOB', 'OTHER']);
        expect(reportBody.parse({ reason: 'CLOSED' })).toEqual({ reason: 'CLOSED', note: null });
        expect(reportBody.parse({ reason: 'WRONG_PAY', note: '  Pay is 50k, not 20k  ' }).note).toBe('Pay is 50k, not 20k');
    });
    it('rejects an unknown reason, a long note and OTHER without a note', () => {
        expect(() => reportBody.parse({ reason: 'SPAM' })).toThrow();
        expect(() => reportBody.parse({ reason: 'CLOSED', note: 'x'.repeat(501) })).toThrow();
        expect(() => reportBody.parse({ reason: 'OTHER' })).toThrow(/what is wrong/i);
        expect(() => reportBody.parse({ reason: 'OTHER', note: '   ' })).toThrow(/what is wrong/i);
    });
    it('keeps a note as plain text (no HTML handling needed: rendered as text)', () => {
        expect(reportBody.parse({ reason: 'OTHER', note: '<img src=x onerror=alert(1)>' }).note).toBe('<img src=x onerror=alert(1)>');
    });
});

describe('flagAfterReport', () => {
    it(`adds "reported" once there are ${REPORT_FLAG_AT} open reports`, () => {
        expect(flagAfterReport(2, ['type'])).toBeNull();
        expect(flagAfterReport(3, ['type'])).toEqual(['type', 'reported']);
        expect(flagAfterReport(5, [])).toEqual(['reported']);
    });
    it('does nothing when the flag is already there (never adds it twice)', () => {
        expect(flagAfterReport(4, ['reported'])).toBeNull();
    });
});

describe('flagsAfterHandled', () => {
    it('removes only "reported"', () => {
        expect(flagsAfterHandled(['type', 'reported'])).toEqual(['type']);
        expect(flagsAfterHandled(['type'])).toBeNull();
        expect(flagsAfterHandled(null)).toBeNull();
    });
});

describe('POSTINGS_REPORTED alert', async () => {
    const { computeAlerts } = await import('../../services/careers/ops/alerts.js');
    const quiet = { worker: { stale: false }, sources: { list: [] }, queue: { flagged: 0, reported: 0, submissions: { failed: 0, waitingOver48h: 0 } }, llm: { enabled: false } };
    it('is amber when a live posting carries the reported flag', () => {
        expect(computeAlerts(quiet)).toEqual([]);
        const [a] = computeAlerts({ ...quiet, queue: { ...quiet.queue, reported: 2 } });
        expect(a).toMatchObject({ level: 'amber', code: 'POSTINGS_REPORTED' });
        expect(a.message).toMatch(/2 live posting/);
    });
});
