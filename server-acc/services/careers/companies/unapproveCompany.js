// Move an approved company back to the candidates (B-34, user choice D-16): the way to take a
// company out of the approved pool. It leaves the student directory, pickers and company page
// (all ACTIVE only) and is listed under Candidates again, to approve, merge or reject later.
// Nothing is deleted. Refused while anything live uses it, as with rejecting a candidate.
import { CareersError } from '../errors.js';
import { companyUsage, flagCompanyPostings } from './rejectCandidate.js';

// Pure. usage: { live, sources, experiences } counts. Returns null or why it can't be moved back.
export function unapproveProblem(company, usage) {
    if (!company) return 'Company not found.';
    if (company.status !== 'ACTIVE') return `${company.name} is not an approved company (it is ${company.status.toLowerCase()}).`;
    if (usage.live) return `${usage.live} live posting(s) use ${company.name}. Take them down, change their company, or merge ${company.name} into the right company instead.`;
    if (usage.sources) return `${usage.sources} job board(s) belong to ${company.name}. Change the board's company first.`;
    if (usage.experiences) return `${usage.experiences} experience(s) are linked to ${company.name}. Unlink them on Link experiences first, or merge it instead.`;
    return null;
}

export async function unapproveCompany(db, id) {
    return db.$transaction(async (tx) => {
        const company = await tx.company.findUnique({ where: { id } });
        const usage = company ? await companyUsage(tx, id) : { live: 0, sources: 0, experiences: 0 };
        const problem = unapproveProblem(company, usage);
        if (problem) throw new CareersError(company ? 409 : 404, company ? 'INVALID_STATE' : 'NOT_FOUND', problem);

        const flagged = await flagCompanyPostings(tx, id);
        const updated = await tx.company.update({ where: { id }, data: { status: 'CANDIDATE' } });
        return { company: updated, flagged };
    });
}
