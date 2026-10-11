import { describe, it, expect } from 'vitest';
import { reportData, aggregateReports, MIN_REPORTS, RANGE_REPORTS } from '../../services/careers/companies/seniorReports.js';

const NOW = new Date('2026-10-11T00:00:00Z');

describe("seniors' reported numbers (P8-T1, F-29)", () => {
    it('no "report" in the body leaves the columns alone (an admin edit must not wipe them)', () => {
        expect(reportData({ title: 'x' }, NOW)).toEqual({});
        expect(reportData({}, NOW)).toEqual({});
    });
    it('parses the optional numbers; blanks become null; null clears', () => {
        expect(reportData({ report: { stipend: '45000', rounds: 3, year: 2025 } }, NOW))
            .toEqual({ reportedStipend: 45000, reportedCtcLpa: null, reportedRounds: 3, reportedYear: 2025 });
        expect(reportData({ report: { ctcLpa: '18.5', stipend: '' } }, NOW))
            .toEqual({ reportedStipend: null, reportedCtcLpa: 18.5, reportedRounds: null, reportedYear: null });
        expect(reportData({ report: null }, NOW)).toEqual({ reportedStipend: null, reportedCtcLpa: null, reportedRounds: null, reportedYear: null });
    });
    it('rejects numbers outside sensible ranges and unknown keys', () => {
        for (const report of [{ stipend: 500 }, { stipend: 2_000_000 }, { ctcLpa: 0 }, { ctcLpa: 500 }, { rounds: 0 }, { rounds: 30 }, { year: 1999 }, { year: 2028 }, { stipend: 'abc' }, { salary: 1 }]) {
            expect(() => reportData({ report }, NOW), JSON.stringify(report)).toThrow();
        }
        expect(reportData({ report: { year: 2027 } }, NOW).reportedYear).toBe(2027); // next year allowed (a PPO starting then)
    });

    const row = (o) => ({ reportedStipend: null, reportedCtcLpa: null, reportedRounds: null, reportedYear: null, createdAt: '2025-06-01T00:00:00Z', ...o });

    it(`shows nothing until ${MIN_REPORTS} experiences report the same number`, () => {
        const two = [row({ reportedStipend: 40000 }), row({ reportedStipend: 60000 })];
        expect(aggregateReports(two)).toEqual({ stipend: null, ctc: null, rounds: null });
    });
    it('3 – 4 reports: only a rounded typical value (median), never the extremes', () => {
        const rows = [row({ reportedStipend: 42000, reportedYear: 2024 }), row({ reportedStipend: 58000, reportedYear: 2026 }), row({ reportedStipend: 51000 })];
        expect(aggregateReports(rows).stipend).toEqual({ count: 3, typical: 50000, low: null, high: null, fromYear: 2024, toYear: 2026 });
        const r4 = aggregateReports([row({ reportedRounds: 2 }), row({ reportedRounds: 3 }), row({ reportedRounds: 4 }), row({ reportedRounds: 9 })]).rounds;
        expect(r4).toMatchObject({ count: 4, typical: 4, low: null, high: null }); // median of 3, 4 → 3.5 → 4
    });
    it(`from ${RANGE_REPORTS} reports: the middle half (25th – 75th percentile), widened to steps; min and max never shown`, () => {
        const s = aggregateReports([20000, 41000, 50000, 59000, 150000].map((v) => row({ reportedStipend: v }))).stipend;
        expect(s).toMatchObject({ count: 5, typical: 50000, low: 40000, high: 60000 });
        const c = aggregateReports(['12.0', 18.5, 20, 22.2, 45].map((v) => row({ reportedCtcLpa: v }))).ctc;
        expect(c).toMatchObject({ count: 5, typical: 20, low: 18, high: 23 });
    });
    it('the year falls back to when the experience was posted', () => {
        const rows = [row({ reportedRounds: 2, createdAt: '2023-03-01T00:00:00Z' }), row({ reportedRounds: 2 }), row({ reportedRounds: 3, reportedYear: 2026 })];
        expect(aggregateReports(rows).rounds).toMatchObject({ fromYear: 2023, toYear: 2026 });
    });
});
