import { describe, it, expect } from 'vitest';
import { adminInfo } from '../../services/careers/postings/adminInfo.js';

const at = (d) => new Date(`2026-10-0${d}T10:00:00Z`);
const names = new Map([[7, 'Asha'], [8, 'Ravi']]);

describe('adminInfo (career-admin bar on the student job page)', () => {
    it('reports the latest approval and the latest change', () => {
        const reviews = [
            { action: 'EXPIRE', byUserId: 8, createdAt: at(5), note: 'Taken down: closed' },
            { action: 'APPROVE', byUserId: 7, createdAt: at(3), note: null },
            { action: 'APPROVE', byUserId: 8, createdAt: at(1), note: null },
        ];
        expect(adminInfo({ id: 4, status: 'EXPIRED' }, reviews, names)).toEqual({
            postingId: 4,
            status: 'EXPIRED',
            approvedBy: 'Asha',
            approvedAt: at(3),
            lastAction: { action: 'EXPIRE', by: 'Ravi', at: at(5), note: 'Taken down: closed' },
        });
    });

    it('handles a posting nobody approved yet and unknown users', () => {
        expect(adminInfo({ id: 9, status: 'PENDING_REVIEW' }, [], names)).toEqual({ postingId: 9, status: 'PENDING_REVIEW', approvedBy: null, approvedAt: null, lastAction: null });
        const out = adminInfo({ id: 9, status: 'LIVE' }, [{ action: 'APPROVE', byUserId: 99, createdAt: at(2), note: null }], names);
        expect(out.approvedBy).toBe('User #99');
    });
});
