// Who a posting is for, from the student's side (PRD "Eligible for me", Design EligibilityBadge).
// Pure. Branch = the roll-number code (User.branchName, e.g. CS), year = current academic year from
// admissionYear, CPI = self-reported and optional. A posting's [] / null means "not stated".
import { z } from 'zod';
import { currentAcademicYear } from '../academicYear.js';

// Prisma Decimal | number | string | null -> number | null.
export const toCpi = (value) => (value === null || value === undefined ? null : Number(value));

// The student's eligibility profile; the shape GET /careers/me/eligibility returns.
export function eligibilityProfile(user, now = new Date()) {
    const branchName = user.branchName ? String(user.branchName).toUpperCase() : null;
    const academicYear = currentAcademicYear(user.admissionYear, now);
    return {
        branchName,
        academicYear,
        cpi: toCpi(user.cpi),
        cpiUpdatedAt: user.cpiUpdatedAt ?? null,
        hasRollNumber: Boolean(branchName && academicYear),
    };
}

// One posting against one profile. Returns
//   { status: NOT_STATED | ELIGIBLE | NOT_ELIGIBLE | NEEDS_CPI | UNKNOWN, reasons, minCpi }
// reasons lists what fails: { field: 'branch', allowed } | { field: 'year', allowed } | { field: 'cpi', min }.
// NEEDS_CPI: a cutoff exists and the student hasn't given a CPI (the posting still passes the filter).
// UNKNOWN: branch / year limits exist but the student has no roll number.
export function postingEligibility(posting, profile) {
    const branches = posting.eligibleBranches ?? [];
    const years = posting.eligibleYears ?? [];
    const minCpi = toCpi(posting.minCpi);
    if (!branches.length && !years.length && minCpi === null) return { status: 'NOT_STATED', reasons: [], minCpi };

    const reasons = [];
    if (profile.hasRollNumber) {
        if (branches.length && !branches.includes(profile.branchName)) reasons.push({ field: 'branch', allowed: branches });
        if (years.length && !years.includes(profile.academicYear)) reasons.push({ field: 'year', allowed: years });
    }
    if (minCpi !== null && profile.cpi !== null && profile.cpi < minCpi) reasons.push({ field: 'cpi', min: minCpi });

    if (reasons.length) return { status: 'NOT_ELIGIBLE', reasons, minCpi };
    if (!profile.hasRollNumber && (branches.length || years.length)) return { status: 'UNKNOWN', reasons, minCpi };
    if (minCpi !== null && profile.cpi === null) return { status: 'NEEDS_CPI', reasons, minCpi };
    return { status: 'ELIGIBLE', reasons, minCpi };
}

// PATCH /careers/me/cpi body: a number 0-10 with at most 2 decimals, or null to clear it.
const twoDecimals = (n) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6;
export const cpiBody = z.object({
    cpi: z.number().min(0, 'CPI must be between 0 and 10').max(10, 'CPI must be between 0 and 10')
        .refine(twoDecimals, 'CPI can have at most 2 decimal places').nullable(),
}).strict();
