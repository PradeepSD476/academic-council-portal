import { describe, it, expect } from 'vitest';
import { hiddenWhere } from '../../services/careers/postings/hidden.js';
import { postingsQuery } from '../../services/careers/postings/query.js';
import { newSinceWhere } from '../../services/careers/postings/newCount.js';

describe('hiddenWhere ("Not for me", F-12)', () => {
    it('leaves out the postings this student hid', () => {
        expect(hiddenWhere(5, false)).toEqual({ hiddenBy: { none: { userId: 5 } } });
    });
    it('lists only them with showHidden', () => {
        expect(hiddenWhere(5, true)).toEqual({ hiddenBy: { some: { userId: 5 } } });
    });
    it('showHidden is an optional true/false param', () => {
        expect(postingsQuery.parse({}).showHidden).toBe(false);
        expect(postingsQuery.parse({ showHidden: 'true' }).showHidden).toBe(true);
        expect(() => postingsQuery.parse({ showHidden: 'yes' })).toThrow();
    });
    it('the "New for you" count skips hidden postings too', () => {
        const since = new Date('2026-10-09T00:00:00Z');
        expect(newSinceWhere(since, null, 5).AND).toContainEqual(hiddenWhere(5, false));
        expect(newSinceWhere(since, null).AND).toHaveLength(2);
    });
});
