import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/db.js', () => ({ default: {} }));
const { undoPlan, approveTrail, UNDO_WINDOW_MS, bulkBodies } = await import('../../services/careers/postings/bulkActions.js');

const now = new Date('2026-10-10T12:00:30Z');
const approvedAt = new Date('2026-10-10T12:00:00Z');
const posting = (over = {}) => ({ id: 7, status: 'LIVE', publishedAt: approvedAt, ...over });
const approveRow = (over = {}) => ({
    action: 'APPROVE', byUserId: 2, createdAt: approvedAt,
    changes: approveTrail({ publishedAt: null, reviewedById: null, reviewedAt: null }, approvedAt, 2),
    ...over,
});

describe('approveTrail (what a bulk approve records so it can be undone)', () => {
    it('records status, publishedAt and the reviewer before and after', () => {
        expect(approveTrail({ publishedAt: null, reviewedById: 5, reviewedAt: new Date('2026-10-01T00:00:00Z') }, approvedAt, 2)).toEqual({
            status: { from: 'PENDING_REVIEW', to: 'LIVE' },
            publishedAt: { from: null, to: approvedAt.toISOString() },
            reviewedById: { from: 5, to: 2 },
            reviewedAt: { from: '2026-10-01T00:00:00.000Z', to: approvedAt.toISOString() },
        });
    });
    it('keeps an earlier publishedAt (a posting that was live before)', () => {
        const earlier = new Date('2026-09-20T00:00:00Z');
        expect(approveTrail({ publishedAt: earlier }, approvedAt, 2).publishedAt).toEqual({ from: earlier.toISOString(), to: earlier.toISOString() });
    });
});

describe('undoPlan (Undo in the bulk-approve toast, F-04)', () => {
    it('puts the posting back to pending and clears publishedAt only when this approve set it', () => {
        expect(undoPlan(posting(), approveRow(), 2, now)).toEqual({ data: { status: 'PENDING_REVIEW', publishedAt: null, reviewedById: null, reviewedAt: null } });
        const earlier = new Date('2026-09-20T00:00:00Z');
        const row = approveRow({ changes: approveTrail({ publishedAt: earlier, reviewedById: 5, reviewedAt: earlier }, approvedAt, 2) });
        expect(undoPlan(posting({ publishedAt: earlier }), row, 2, now).data).toEqual({ status: 'PENDING_REVIEW', publishedAt: earlier, reviewedById: 5, reviewedAt: earlier });
    });
    it('refuses after the window, for another admin, a non-LIVE posting, or when something happened since', () => {
        expect(undoPlan(posting(), approveRow(), 2, new Date(approvedAt.getTime() + UNDO_WINDOW_MS + 1)).skip).toMatch(/too late/i);
        expect(undoPlan(posting(), approveRow(), 3, now).skip).toMatch(/another admin/i);
        expect(undoPlan(posting({ status: 'EXPIRED' }), approveRow(), 2, now).skip).toMatch(/EXPIRED/);
        expect(undoPlan(posting(), approveRow({ action: 'EDIT' }), 2, now).skip).toMatch(/changed since/i);
        expect(undoPlan(posting(), null, 2, now).skip).toMatch(/changed since/i);
        expect(undoPlan(posting(), approveRow({ changes: {} }), 2, now).skip).toMatch(/individual/i);
    });
});

describe('bulk bodies', () => {
    it('needs ids (≤ 200) and a reason for reject', () => {
        expect(bulkBodies.reject.parse({ ids: [1, 2], reason: ' Duplicate ' })).toEqual({ ids: [1, 2], reason: 'Duplicate' });
        expect(() => bulkBodies.reject.parse({ ids: [1] })).toThrow();
        expect(() => bulkBodies.ids.parse({ ids: [] })).toThrow();
        expect(() => bulkBodies.ids.parse({ ids: Array.from({ length: 201 }, (_, i) => i + 1) })).toThrow();
    });
});
