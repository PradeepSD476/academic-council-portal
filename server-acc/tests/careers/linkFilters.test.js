import { describe, it, expect } from 'vitest';
import { linkFilterWhere } from '../../services/careers/links/waiting.js';

// Evaluates the small Prisma where subset these filters use (AND / OR / NOT, null, in, equality).
function matches(row, where) {
    return Object.entries(where).every(([k, v]) => {
        if (k === 'AND') return v.every((w) => matches(row, w));
        if (k === 'OR') return v.some((w) => matches(row, w));
        if (k === 'NOT') return !matches(row, v);
        if (v === null) return row[k] === null;
        if (v && typeof v === 'object' && 'in' in v) return v.in.includes(row[k]);
        return row[k] === v;
    });
}

const STATUSES = ['RECEIVED', 'PROCESSING', 'EXTRACTING', 'PENDING_REVIEW', 'STORED_ONLY', 'DUPLICATE', 'FAILED'];
const rows = [];
for (const status of STATUSES) for (const postingId of [null, 5]) for (const dismissedAt of [null, new Date()]) rows.push({ status, postingId, dismissedAt });
const bucketsOf = (row, ai) => ['NEEDS_ATTENTION', 'IN_PROGRESS', 'DONE'].filter((f) => matches(row, linkFilterWhere(f, ai)));

describe('Student links chips (B-36)', () => {
    for (const ai of [true, false]) {
        it(`every link is in exactly one of the three chips (AI step ${ai ? 'on' : 'off'})`, () => {
            for (const row of rows) expect(bucketsOf(row, ai), JSON.stringify(row)).toHaveLength(1);
        });
    }
    it('puts the usual cases where an admin expects them', () => {
        const one = (row, ai = true) => bucketsOf({ postingId: null, dismissedAt: null, ...row }, ai)[0];
        expect(one({ status: 'FAILED' })).toBe('NEEDS_ATTENTION');
        expect(one({ status: 'STORED_ONLY' })).toBe('NEEDS_ATTENTION');
        expect(one({ status: 'EXTRACTING' }, false)).toBe('NEEDS_ATTENTION'); // waiting for a person
        expect(one({ status: 'EXTRACTING' }, true)).toBe('IN_PROGRESS');
        expect(one({ status: 'RECEIVED' })).toBe('IN_PROGRESS');
        expect(one({ status: 'PENDING_REVIEW', postingId: 5 })).toBe('DONE');
        expect(one({ status: 'DUPLICATE', postingId: 5 })).toBe('DONE');
        expect(one({ status: 'FAILED', dismissedAt: new Date() })).toBe('DONE');
    });
    it('ALL is everything; a raw status still works', () => {
        expect(linkFilterWhere('ALL', true)).toEqual({});
        expect(linkFilterWhere('FAILED', true)).toEqual({ status: 'FAILED' });
    });
});
