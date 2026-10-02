// The posting "card" shape students see (jobs list, company page) and the student's eligibility
// profile it is judged against. The profile includes the student's CPI, which is used here for the
// eligibility status only and is never part of the response.
import prisma from '../../../config/db.js';
import { eligibilityProfile, postingEligibility, toCpi } from './eligibility.js';

export const cardFields = {
    id: true, roleTitle: true, type: true, workMode: true, location: true, skills: true,
    compCurrency: true, stipendMin: true, stipendMax: true, stipendDisclosure: true,
    ctcMin: true, ctcMax: true, ctcDisclosure: true,
    eligibleBranches: true, eligibleYears: true, minCpi: true,
    firstSeenAt: true, lastSeenLiveAt: true, publishedAt: true,
    company: { select: { id: true, name: true, slug: true } },
};

// The caller's own profile (explicit select: CPI is omitted from every other query).
export async function loadProfile(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { branchName: true, admissionYear: true, cpi: true } });
    return eligibilityProfile(user ?? {});
}

export const toCard = (posting, profile) => ({
    ...posting,
    minCpi: toCpi(posting.minCpi),
    eligibility: postingEligibility(posting, profile),
});
