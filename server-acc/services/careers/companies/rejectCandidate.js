// Reject a candidate company (P7-T11, F-11): names taken from page noise ("keka", "colecta"). The
// user chose hide, never delete (D-13): the row gets rejectedAt and drops out of the candidate list,
// counts and pickers, but keeps its aliases, so a later posting naming it again attaches to it, is
// flagged (company uncertain) and cannot be approved until a reviewer picks the real company.
import { z } from 'zod';
import { CareersError } from '../errors.js';

export const rejectBody = z.object({ reason: z.string().trim().max(300).optional() }).strict();

// Pure. usage: { live, sources, experiences } counts. Returns null or why it can't be rejected.
export function rejectProblem(company, usage) {
    if (!company) return 'Company not found.';
    if (company.status !== 'CANDIDATE') return `${company.name} is ${company.status.toLowerCase()}, not a candidate.`;
    if (company.rejectedAt) return `${company.name} is already rejected.`;
    if (usage.live) return `${usage.live} live posting(s) use ${company.name}. Change their company (or merge this candidate into the right one) first.`;
    if (usage.sources) return `${usage.sources} job board(s) belong to ${company.name}. Change the board's company first.`;
    if (usage.experiences) return `${usage.experiences} experience(s) are linked to ${company.name}. Unlink them first.`;
    return null;
}

// Pure. The uncertainFields of a posting whose company was rejected.
export const withCompanyUncertain = (fields) => (fields.includes('company') ? fields : [...fields, 'company']);

// The admin list filter for the candidate tab (rejected ones only with ?status=REJECTED).
export function statusWhere(status) {
    if (status === 'REJECTED') return { status: 'CANDIDATE', rejectedAt: { not: null } };
    if (status === 'ALL') return { rejectedAt: null };
    return { status, rejectedAt: null };
}

// What still uses a company: { live, sources, experiences } counts (also used by B-34 un-approve).
export async function companyUsage(tx, id) {
    const [live, sources, experiences] = await Promise.all([
        tx.posting.count({ where: { companyId: id, status: 'LIVE' } }),
        tx.source.count({ where: { companyId: id } }),
        tx.experience.count({ where: { companyId: id } }),
    ]);
    return { live, sources, experiences };
}

// Its postings (waiting, expired) need a reviewer to pick the real company. Returns how many.
export async function flagCompanyPostings(tx, id) {
    const postings = await tx.posting.findMany({ where: { companyId: id, status: { not: 'REJECTED' } }, select: { id: true, uncertainFields: true } });
    for (const p of postings) {
        await tx.posting.update({ where: { id: p.id }, data: { uncertainFields: withCompanyUncertain(p.uncertainFields ?? []) } });
    }
    return postings.length;
}

export async function rejectCandidate(db, id, { reason, adminId, now = new Date() }) {
    return db.$transaction(async (tx) => {
        const company = await tx.company.findUnique({ where: { id } });
        const usage = company ? await companyUsage(tx, id) : { live: 0, sources: 0, experiences: 0 };
        const problem = rejectProblem(company, usage);
        if (problem) throw new CareersError(company ? 409 : 404, company ? 'INVALID_STATE' : 'NOT_FOUND', problem);

        const flagged = await flagCompanyPostings(tx, id);
        const updated = await tx.company.update({ where: { id }, data: { rejectedAt: now, rejectedById: adminId, rejectReason: reason || null } });
        return { company: updated, flagged };
    });
}

export async function restoreCandidate(db, id) {
    const company = await db.company.findUnique({ where: { id } });
    if (!company) throw new CareersError(404, 'NOT_FOUND', 'Company not found.');
    if (!company.rejectedAt) throw new CareersError(409, 'INVALID_STATE', `${company.name} is not rejected.`);
    return db.company.update({ where: { id }, data: { rejectedAt: null, rejectedById: null, rejectReason: null } });
}
