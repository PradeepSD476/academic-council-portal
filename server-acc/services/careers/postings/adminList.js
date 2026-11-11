// Admin "All postings" list (P5-T1, F-01): every posting in any status, so an approved posting can be
// found again to fix or take down. Query parsing and the where / order builders are pure.
import { z } from 'zod';
import { likeSafe } from '../text/likeSafe.js';

export const ADMIN_STATUSES = ['LIVE', 'PENDING_REVIEW', 'EXPIRED', 'REJECTED'];
const TIERS = ['STRUCTURED', 'JSON_LD', 'LLM_FAST', 'LLM_STRONG', 'MANUAL'];

export const adminPostingsQuery = z.object({
    q: z.string().trim().max(100).optional(),
    status: z.enum([...ADMIN_STATUSES, 'ALL']).default('LIVE'),
    companyId: z.coerce.number().int().positive().optional(),
    sourceId: z.coerce.number().int().positive().optional(),
    tier: z.enum(TIERS).optional(),
    hasDeadline: z.enum(['yes', 'no']).optional(),
    // P6-T7: postings with open student reports.
    reported: z.enum(['yes']).optional(),
    sort: z.enum(['newest', 'lastSeen', 'deadline']).default('newest'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(25),
});

// withStatus: false drops the status filter, for the per-status counts shown on the tabs.
export function adminPostingsWhere(params, { withStatus = true } = {}) {
    const and = [];
    if (withStatus && params.status !== 'ALL') and.push({ status: params.status });
    if (params.q) {
        const q = likeSafe(params.q);
        and.push({ OR: [{ roleTitle: { contains: q, mode: 'insensitive' } }, { company: { name: { contains: q, mode: 'insensitive' } } }] });
    }
    if (params.companyId) and.push({ companyId: params.companyId });
    if (params.sourceId) and.push({ observations: { some: { sourceId: params.sourceId } } });
    if (params.tier) and.push({ extractionTier: params.tier });
    if (params.hasDeadline === 'yes') and.push({ deadlineStated: { not: null } });
    if (params.hasDeadline === 'no') and.push({ deadlineStated: null });
    if (params.reported === 'yes') and.push({ reports: { some: { handledAt: null } } });
    return { AND: and };
}

export function adminPostingsOrder(sort) {
    if (sort === 'lastSeen') return [{ lastSeenLiveAt: 'desc' }, { id: 'desc' }];
    if (sort === 'deadline') return [{ deadlineStated: { sort: 'asc', nulls: 'last' } }, { id: 'desc' }];
    // Pending postings have no publishedAt yet: after the published ones, newest seen first.
    return [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { firstSeenAt: 'desc' }, { id: 'desc' }];
}

export const adminListSelect = {
    id: true, roleTitle: true, status: true, type: true, location: true, extractionTier: true,
    publishedAt: true, firstSeenAt: true, lastSeenLiveAt: true, deadlineStated: true,
    rejectReason: true, expiredReason: true,
    company: { select: { id: true, name: true, slug: true, status: true } },
    // Aggregate counts only: never which students saved or applied.
    _count: { select: { saves: true, applications: true, observations: true, reports: { where: { handledAt: null } } } },
};
