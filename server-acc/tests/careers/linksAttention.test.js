import { describe, it, expect } from 'vitest';
import { needsAttentionWhere, needsPersonWhere } from '../../services/careers/links/waiting.js';

describe('student links that need an admin (review tab badge + default filter)', () => {
    it('failed links and the "needs a person" links, never dismissed ones', () => {
        expect(needsAttentionWhere(true)).toEqual({
            dismissedAt: null,
            OR: [{ status: 'FAILED' }, { postingId: null, OR: [{ status: 'STORED_ONLY' }] }],
        });
    });
    it('while the AI step is off, links waiting for it count too (same rule as "Needs a person")', () => {
        const w = needsAttentionWhere(false);
        expect(w.OR[1]).toEqual({ postingId: null, OR: needsPersonWhere(false).OR });
        expect(w.OR[1].OR).toContainEqual({ status: 'EXTRACTING' });
    });
});
