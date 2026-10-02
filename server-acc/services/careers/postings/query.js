// Student posting search: query string -> Prisma where / orderBy (Architecture 9.1). Pure, so every
// clause is unit-tested. Honest data rules:
//   - pay filters never drop a posting only because its pay is unknown, unless the student unticks
//     "include undisclosed" (null-safe compensation clause)
//   - the eligibility filter only applies when the student has a roll number, and a posting that
//     states nothing (or a CPI cutoff the student hasn't answered) still passes
import { z } from 'zod';
import { normalizeLocation } from '../text/normalize.js';
import { canonicalSkillName } from '../text/skills.js';

export const MAX_LIMIT = 50;
export const DEFAULT_LIMIT = 20;

const bool = (fallback) => z.enum(['true', 'false']).optional().transform((v) => (v === undefined ? fallback : v === 'true'));
const amount = z.coerce.number().int().min(0).max(100_000_000).optional();

export const postingsQuery = z.object({
    q: z.string().trim().max(100).optional().transform((v) => v || undefined),
    type: z.enum(['INTERNSHIP', 'FULL_TIME']).optional(),
    workMode: z.enum(['ONSITE', 'HYBRID', 'REMOTE']).optional(),
    location: z.string().trim().max(60).optional().transform((v) => v || undefined),
    skills: z.string().max(300).optional()
        .transform((v) => (v ? [...new Set(v.split(',').map((s) => s.trim()).filter(Boolean).map((s) => canonicalSkillName(s) ?? s))].slice(0, 10) : [])),
    companyId: z.coerce.number().int().positive().optional(),
    minStipend: amount,
    minCtc: amount,
    includeUndisclosed: bool(true),
    eligibleOnly: bool(false),
    sort: z.enum(['newest', 'lastSeen']).default('newest'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
});

const DISCLOSED = ['DISCLOSED', 'RANGE'];
const UNDISCLOSED = ['NOT_DISCLOSED', 'UNCLEAR'];

// Null-safe "pay at least N". prefix = 'stipend' | 'ctc'. A stipend filter skips full-time roles and
// a CTC filter skips internships (they don't have that kind of pay; C-68).
export function compensationWhere(prefix, min, includeUndisclosed) {
    const disclosure = `${prefix}Disclosure`;
    const max = `${prefix}Max`;
    const minField = `${prefix}Min`;
    const otherType = prefix === 'stipend' ? 'FULL_TIME' : 'INTERNSHIP';
    return {
        AND: [
            { type: { not: otherType } },
            {
                OR: [
                    {
                        compCurrency: 'INR',
                        [disclosure]: { in: DISCLOSED },
                        OR: [{ [max]: { gte: min } }, { [max]: null, [minField]: { gte: min } }],
                    },
                    ...(includeUndisclosed ? [{ [disclosure]: { in: UNDISCLOSED } }, { compCurrency: { not: 'INR' } }] : []),
                ],
            },
        ],
    };
}

// "Not stated": an empty list, or NULL (Postgres array columns have no default, and rows written
// without the field hold NULL, which isEmpty does not match).
const notStated = (field) => [{ [field]: { isEmpty: true } }, { [field]: { equals: null } }];

// profile: from eligibility.js. Returns the where clause, or null when it can't apply.
export function eligibilityWhere(profile) {
    if (!profile.hasRollNumber) return null;
    return {
        AND: [
            { OR: [...notStated('eligibleBranches'), { eligibleBranches: { has: profile.branchName } }] },
            { OR: [...notStated('eligibleYears'), { eligibleYears: { has: profile.academicYear } }] },
            ...(profile.cpi !== null ? [{ OR: [{ minCpi: null }, { minCpi: { lte: profile.cpi } }] }] : []),
        ],
    };
}

// Everything except eligibility, LIVE only. includeUndisclosed can be overridden to count how many
// results came in only through the undisclosed branch.
export function baseWhere(params, { includeUndisclosed = params.includeUndisclosed } = {}) {
    const and = [{ status: 'LIVE' }];
    if (params.q) {
        const skill = canonicalSkillName(params.q);
        and.push({
            OR: [
                { roleTitle: { contains: params.q, mode: 'insensitive' } },
                { company: { name: { contains: params.q, mode: 'insensitive' } } },
                ...(skill ? [{ skills: { has: skill } }] : []),
            ],
        });
    }
    if (params.type) and.push({ type: params.type });
    if (params.workMode) and.push({ workMode: params.workMode });
    if (params.location) {
        // "Bangalore" and "Bengaluru" both normalise to bengaluru; a multi-city posting is
        // stored as "bengaluru|hyderabad", so match each normalised city.
        const cities = (normalizeLocation(params.location) ?? '').split('|').filter(Boolean);
        and.push({ OR: cities.map((c) => ({ locationNormalized: { contains: c } })) });
    }
    if (params.skills.length) and.push({ skills: { hasSome: params.skills } });
    if (params.companyId) and.push({ companyId: params.companyId });
    if (params.minStipend !== undefined) and.push(compensationWhere('stipend', params.minStipend, includeUndisclosed));
    if (params.minCtc !== undefined) and.push(compensationWhere('ctc', params.minCtc, includeUndisclosed));
    return { AND: and };
}

export const withEligibility = (where, eligibility) => (eligibility ? { AND: [...where.AND, eligibility] } : where);

export const orderByFor = (sort) => (sort === 'lastSeen'
    ? [{ lastSeenLiveAt: 'desc' }, { id: 'desc' }]
    : [{ publishedAt: 'desc' }, { id: 'desc' }]);

export const hasPayFilter = (params) => params.minStipend !== undefined || params.minCtc !== undefined;
