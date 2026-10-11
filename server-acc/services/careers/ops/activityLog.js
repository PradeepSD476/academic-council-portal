// Admin activity log (P7-T12, F-15): read-only, newest first. Posting reviews (approve, reject, edit,
// expire, reopen, manual create), permanent deletes (P8-T2) and company merges / splits, plus their undos, so a team of admins
// can see who did what. Nothing here writes. The merge of the two tables is pure.
import { z } from 'zod';

export const POSTING_ACTIONS = ['APPROVE', 'REJECT', 'EDIT', 'EXPIRE', 'REOPEN', 'CREATE_MANUAL'];
export const COMPANY_ACTIONS = ['MERGE', 'SPLIT', 'UNDO'];
export const DELETE_ACTION = 'DELETE'; // P8-T2: permanent deletes, from PostingDeletion

export const activityQuery = z.object({
    adminId: z.coerce.number().int().positive().optional(),
    action: z.enum([...POSTING_ACTIONS, ...COMPANY_ACTIONS, DELETE_ACTION]).optional(),
    page: z.coerce.number().int().min(1).max(200).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(25),
});

// Pure. reviews: PostingReview rows (+ posting); merges: CompanyMergeLog rows. A merge that was undone
// gives two entries: the merge (by performedById) and the undo (by undoneById, at undoneAt).
// deletions: PostingDeletion rows (the posting itself is gone; the row keeps its title and company).
export function activityEntries(reviews, merges, { adminId, action } = {}, deletions = []) {
    const entries = [];
    for (const r of reviews) {
        entries.push({ key: `r${r.id}`, kind: 'POSTING', action: r.action, at: new Date(r.createdAt), byUserId: r.byUserId, postingId: r.postingId, posting: r.posting ?? null, note: r.note ?? null, changes: r.changes ?? null });
    }
    for (const m of merges) {
        const base = { kind: 'COMPANY', fromCompanyId: m.fromCompanyId, toCompanyId: m.toCompanyId, logId: m.id, mergeAction: m.action };
        entries.push({ ...base, key: `m${m.id}`, action: m.action, at: new Date(m.createdAt), byUserId: m.performedById });
        if (m.undoneAt && m.undoneById) entries.push({ ...base, key: `u${m.id}`, action: 'UNDO', at: new Date(m.undoneAt), byUserId: m.undoneById });
    }
    for (const d of deletions) {
        entries.push({
            key: `d${d.id}`, kind: 'POSTING', action: DELETE_ACTION, at: new Date(d.createdAt), byUserId: d.byUserId, postingId: d.postingId,
            posting: { id: d.postingId, roleTitle: d.roleTitle, company: { name: d.companyName }, status: null, deleted: true }, note: d.reason, changes: null,
        });
    }
    return entries
        .filter((e) => (!adminId || e.byUserId === adminId) && (!action || e.action === action))
        .sort((a, b) => b.at - a.at || (a.key < b.key ? 1 : -1));
}

// Only the "changes" field names are listed, not the values (a long description diff is noise here).
export const changedFields = (changes) => (changes && typeof changes === 'object' ? Object.keys(changes).filter((k) => !['mergedInto', 'mergedFrom'].includes(k)) : []);

export async function activityLog(db, params) {
    const { adminId, action, page, limit } = params;
    const take = page * limit; // enough rows from each table to fill this page after merging
    const wantPostings = !action || POSTING_ACTIONS.includes(action);
    const wantCompanies = !action || COMPANY_ACTIONS.includes(action);
    const wantDeletes = !action || action === DELETE_ACTION;
    const reviewWhere = { ...(adminId ? { byUserId: adminId } : {}), ...(action && POSTING_ACTIONS.includes(action) ? { action } : {}) };
    const mergeWhere = adminId ? { OR: [{ performedById: adminId }, { undoneById: adminId }] } : {};
    const [reviews, reviewTotal, merges, deletions] = await Promise.all([
        wantPostings ? db.postingReview.findMany({
            where: reviewWhere, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take,
            include: { posting: { select: { id: true, roleTitle: true, status: true, company: { select: { name: true } } } } },
        }) : [],
        wantPostings ? db.postingReview.count({ where: reviewWhere }) : 0,
        // Merges are few (an admin action on companies); all of them are read and filtered in memory.
        wantCompanies ? db.companyMergeLog.findMany({ where: mergeWhere, orderBy: { id: 'desc' } }) : [],
        // Deletions are rare (spam and test data); all of them are read, like merges.
        wantDeletes ? db.postingDeletion.findMany({ where: adminId ? { byUserId: adminId } : {}, orderBy: { id: 'desc' } }) : [],
    ]);
    const all = activityEntries(reviews, merges, { adminId, action }, deletions);
    const companyTotal = all.filter((e) => e.kind === 'COMPANY' || e.action === DELETE_ACTION).length;
    const pageRows = all.slice((page - 1) * limit, page * limit);

    const companyIds = [...new Set(pageRows.flatMap((e) => (e.kind === 'COMPANY' ? [e.fromCompanyId, e.toCompanyId] : [])))];
    const [companies, admins] = await Promise.all([
        db.company.findMany({ where: { id: { in: companyIds } }, select: { id: true, name: true } }),
        adminList(db),
    ]);
    const companyName = new Map(companies.map((c) => [c.id, c.name]));
    const adminName = new Map(admins.map((a) => [a.id, a.name]));
    const data = pageRows.map((e) => ({
        key: e.key, kind: e.kind, action: e.action, at: e.at.toISOString(),
        admin: { id: e.byUserId, name: adminName.get(e.byUserId) ?? `User #${e.byUserId}` },
        ...(e.kind === 'POSTING'
            ? { posting: e.posting ? { id: e.posting.id, roleTitle: e.posting.roleTitle, company: e.posting.company?.name ?? null, status: e.posting.status, deleted: Boolean(e.posting.deleted) } : { id: e.postingId }, note: e.note, changedFields: changedFields(e.changes) }
            : { from: companyName.get(e.fromCompanyId) ?? `#${e.fromCompanyId}`, to: companyName.get(e.toCompanyId) ?? `#${e.toCompanyId}`, undoOf: e.action === 'UNDO' ? e.mergeAction : null }),
    }));
    const total = reviewTotal + companyTotal;
    return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }, admins };
}

// Everyone who appears in either log, for the admin filter (display names only).
async function adminList(db) {
    const [r, m, u, d] = await Promise.all([
        db.postingReview.findMany({ distinct: ['byUserId'], select: { byUserId: true } }),
        db.companyMergeLog.findMany({ distinct: ['performedById'], select: { performedById: true } }),
        db.companyMergeLog.findMany({ where: { undoneById: { not: null } }, distinct: ['undoneById'], select: { undoneById: true } }),
        db.postingDeletion.findMany({ distinct: ['byUserId'], select: { byUserId: true } }),
    ]);
    const ids = [...new Set([...r.map((x) => x.byUserId), ...m.map((x) => x.performedById), ...u.map((x) => x.undoneById), ...d.map((x) => x.byUserId)])];
    const users = await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, displayName: true } });
    return users.map((x) => ({ id: x.id, name: x.displayName || `User #${x.id}` })).sort((a, b) => a.name.localeCompare(b.name));
}
