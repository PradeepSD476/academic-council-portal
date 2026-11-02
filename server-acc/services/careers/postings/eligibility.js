// Who a posting is for, from the student's side (PRD "Eligible for me", Design EligibilityBadge).
// Pure. Branch = the roll-number code (User.branchName, e.g. CS), year = current academic year from
// admissionYear, CPI = self-reported and optional. A posting's [] / null means "not stated".
import { z } from 'zod';
import { currentAcademicYear } from '../academicYear.js';

// Prisma Decimal | number | string | null -> number | null.
export const toCpi = (value) => (value === null || value === undefined ? null : Number(value));

// Self-reported programme (P7-T2) and its usual length; PHD / OTHER have no fixed length, so the
// student enters the graduation year.
export const PROGRAMMES = {
    BTECH: { label: 'B.Tech', years: 4 },
    DUAL: { label: 'Dual degree (B.Tech + M.Tech)', years: 5 },
    MTECH: { label: 'M.Tech', years: 2 },
    MSC: { label: 'M.Sc', years: 2 },
    MBA: { label: 'MBA', years: 2 },
    PHD: { label: 'PhD', years: null },
    OTHER: { label: 'Other', years: null },
};

// Expected graduation year, and where it came from: SELF (the student entered it), PROGRAMME (admission
// year + the programme's length), ASSUMED (no programme given: a 4-year B.Tech, as the roll number guess
// always did), or null.
export function graduationInfo(user) {
    if (Number.isInteger(user.graduationYear)) return { graduationYear: user.graduationYear, graduationYearSource: 'SELF' };
    if (!Number.isInteger(user.admissionYear)) return { graduationYear: null, graduationYearSource: null };
    const length = user.programme ? PROGRAMMES[user.programme]?.years : 4;
    if (!length) return { graduationYear: null, graduationYearSource: null };
    return { graduationYear: user.admissionYear + length, graduationYearSource: user.programme ? 'PROGRAMME' : 'ASSUMED' };
}

// The student's eligibility profile; the shape GET /careers/me/eligibility returns.
export function eligibilityProfile(user, now = new Date()) {
    const branchName = user.branchName ? String(user.branchName).toUpperCase() : null;
    const academicYear = currentAcademicYear(user.admissionYear, now);
    return {
        branchName,
        academicYear,
        programme: user.programme ?? null,
        ...graduationInfo(user),
        cpi: toCpi(user.cpi),
        cpiUpdatedAt: user.cpiUpdatedAt ?? null,
        hasRollNumber: Boolean(branchName && academicYear),
    };
}

// One posting against one profile. Returns
//   { status: NOT_STATED | ELIGIBLE | NOT_ELIGIBLE | NEEDS_CPI | UNKNOWN, reasons, minCpi }
// reasons lists what fails: { field: 'branch', allowed } | { field: 'gradYear', allowed } |
// { field: 'year', allowed } | { field: 'cpi', min }. A stated graduation batch is checked against the
// student's graduation year first (P7-T2); the year of study only when no batch is stated or the
// student's graduation year is unknown.
// NEEDS_CPI: a cutoff exists and the student hasn't given a CPI (the posting still passes the filter).
// UNKNOWN: branch / year limits exist but the student has no roll number.
export function postingEligibility(posting, profile) {
    const branches = posting.eligibleBranches ?? [];
    const years = posting.eligibleYears ?? [];
    const gradYears = posting.eligibleGradYears ?? [];
    const minCpi = toCpi(posting.minCpi);
    if (!branches.length && !years.length && !gradYears.length && minCpi === null) return { status: 'NOT_STATED', reasons: [], minCpi };

    const reasons = [];
    if (profile.hasRollNumber) {
        if (branches.length && !branches.includes(profile.branchName)) reasons.push({ field: 'branch', allowed: branches });
        if (gradYears.length && profile.graduationYear) {
            if (!gradYears.includes(profile.graduationYear)) reasons.push({ field: 'gradYear', allowed: gradYears });
        } else if (years.length && !years.includes(profile.academicYear)) {
            reasons.push({ field: 'year', allowed: years });
        }
    }
    if (minCpi !== null && profile.cpi !== null && profile.cpi < minCpi) reasons.push({ field: 'cpi', min: minCpi });

    if (reasons.length) return { status: 'NOT_ELIGIBLE', reasons, minCpi };
    if (!profile.hasRollNumber && (branches.length || years.length || gradYears.length)) return { status: 'UNKNOWN', reasons, minCpi };
    if (minCpi !== null && profile.cpi === null) return { status: 'NEEDS_CPI', reasons, minCpi };
    return { status: 'ELIGIBLE', reasons, minCpi };
}

// PATCH /careers/me/cpi body: a number 0-10 with at most 2 decimals, or null to clear it.
const twoDecimals = (n) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6;
export const cpiBody = z.object({
    cpi: z.number().min(0, 'CPI must be between 0 and 10').max(10, 'CPI must be between 0 and 10')
        .refine(twoDecimals, 'CPI can have at most 2 decimal places').nullable(),
}).strict();

// PATCH /careers/me/programme body (P7-T2): both self-reported; null clears a value (back to the guess).
export const programmeBody = z.object({
    programme: z.enum(Object.keys(PROGRAMMES)).nullable().optional(),
    graduationYear: z.number().int().min(2000, 'Enter a year like 2027').max(2100, 'Enter a year like 2027').nullable().optional(),
}).strict().refine((b) => b.programme !== undefined || b.graduationYear !== undefined, 'Nothing to change');
