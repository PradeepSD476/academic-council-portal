import { describe, it, expect } from 'vitest';
import { postingsQuery, myStatusWhere, MY_STATUSES } from '../../services/careers/postings/query.js';

describe('jobs list: filter by my application status', () => {
    it('accepts the statuses plus NONE and NOT_APPLIED; anything else is refused', () => {
        expect(MY_STATUSES).toEqual(['NONE', 'NOT_APPLIED', 'INTERESTED', 'APPLIED', 'IN_PROGRESS', 'REJECTED', 'OFFER']);
        expect(postingsQuery.parse({ myStatus: 'APPLIED' }).myStatus).toBe('APPLIED');
        expect(postingsQuery.parse({}).myStatus).toBeUndefined();
        expect(() => postingsQuery.parse({ myStatus: 'SAVED' })).toThrow();
    });
    it('only ever looks at this student\'s own rows', () => {
        expect(myStatusWhere(7, undefined)).toEqual({});
        expect(myStatusWhere(7, 'NONE')).toEqual({ applications: { none: { userId: 7 } } });
        expect(myStatusWhere(7, 'OFFER')).toEqual({ applications: { some: { userId: 7, status: 'OFFER' } } });
        expect(myStatusWhere(7, 'NOT_APPLIED')).toEqual({
            OR: [{ applications: { none: { userId: 7 } } }, { applications: { some: { userId: 7, status: 'INTERESTED' } } }],
        });
    });
});
