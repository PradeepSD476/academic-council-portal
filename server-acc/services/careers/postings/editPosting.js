// Admin edits to a posting (review queue PATCH / approve-with-edits / manual entry).
// One schema and one set of honest-data rules for all three, so a reviewer can never save a
// posting that says "₹0" for unknown pay, or a range without numbers.
import { z } from 'zod';
import { CareersError } from '../errors.js';
import { normalizeTitle, normalizeLocation } from '../text/normalize.js';
import { simhash64 } from '../text/fingerprint.js';
import { canonicalSkillName } from '../text/skills.js';

const money = z.number().int().min(0).max(1_000_000_000).nullable();
const disclosure = z.enum(['DISCLOSED', 'RANGE', 'NOT_DISCLOSED', 'UNCLEAR']);
const text = (max) => z.string().trim().min(1).max(max);
const optionalText = (max) => z.string().trim().max(max).nullable().transform((s) => (s ? s : null));

// Every field an admin may set. All optional: PATCH sends only what changed.
export const postingFields = z.object({
    companyId: z.number().int().positive(),
    roleTitle: text(200),
    type: z.enum(['INTERNSHIP', 'FULL_TIME', 'UNKNOWN']),
    ppoMentioned: z.boolean().nullable(),
    location: optionalText(300),
    workMode: z.enum(['ONSITE', 'HYBRID', 'REMOTE', 'UNKNOWN']),
    skills: z.array(z.string().trim().min(1).max(60)).max(40),
    compCurrency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, 'Use a 3-letter currency code.'),
    stipendMin: money,
    stipendMax: money,
    stipendDisclosure: disclosure,
    ctcMin: money,
    ctcMax: money,
    ctcDisclosure: disclosure,
    compensationRaw: optionalText(500),
    descriptionText: text(100_000),
    applyUrl: z.url({ protocol: /^https?$/ }).max(2000),
    eligibleBranches: z.array(z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, 'Branch codes are 2 letters, e.g. CS.')).max(30),
    eligibleYears: z.array(z.number().int().min(1).max(5)).max(5),
    minCpi: z.number().min(0).max(10).nullable(),
    deadlineStated: z.coerce.date().nullable(),
}).partial().strict();

// The derived columns follow the fields they come from.
function derived(fields) {
    const out = {};
    if (fields.roleTitle !== undefined) out.roleTitleNormalized = normalizeTitle(fields.roleTitle);
    if (fields.location !== undefined) out.locationNormalized = normalizeLocation(fields.location);
    if (fields.descriptionText !== undefined) out.contentFingerprint = simhash64(fields.descriptionText);
    return out;
}

// Pay rules (checked on the merged result, not the patch alone):
//   DISCLOSED / RANGE need numbers (min <= max; DISCLOSED means one amount)
//   NOT_DISCLOSED / UNCLEAR must not carry numbers; UNCLEAR also needs the raw wording
export function checkCompensation(p) {
    const problems = [];
    for (const side of ['stipend', 'ctc']) {
        const d = p[`${side}Disclosure`];
        const min = p[`${side}Min`];
        const max = p[`${side}Max`];
        if (d === 'DISCLOSED' || d === 'RANGE') {
            if (min === null || min === undefined || max === null || max === undefined) problems.push(`${side}: ${d} needs both amounts.`);
            else if (min > max) problems.push(`${side}: minimum is above maximum.`);
            else if (d === 'DISCLOSED' && min !== max) problems.push(`${side}: DISCLOSED is one amount; use RANGE for two.`);
            else if (d === 'RANGE' && min === max) problems.push(`${side}: a RANGE needs two different amounts.`);
        } else if ((min ?? null) !== null || (max ?? null) !== null) {
            problems.push(`${side}: ${d} must not have amounts (unknown pay is never a number).`);
        }
        if (d === 'UNCLEAR' && !p.compensationRaw) problems.push(`${side}: UNCLEAR needs the original pay wording (compensationRaw).`);
    }
    return problems;
}

// Decimal -> number, Date -> ISO string, undefined -> null: comparable and JSON-safe.
function plain(v) {
    if (v instanceof Date) return v.toISOString();
    if (v !== null && typeof v === 'object' && typeof v.toNumber === 'function') return v.toNumber();
    return v ?? null;
}

const same = (a, b) => JSON.stringify(plain(a)) === JSON.stringify(plain(b));

// Returns { data, changes } for prisma.posting.update, or throws 400.
//   data: only the fields that really change (+ derived columns, + uncertainFields minus edited ones)
//   changes: { field: { from, to } } for the PostingReview audit row
export function planEdit(posting, rawEdits) {
    const edits = postingFields.parse(rawEdits ?? {});
    if (edits.skills) edits.skills = mergeSkills(edits.skills);

    const changes = {};
    const data = {};
    for (const [field, value] of Object.entries(edits)) {
        if (same(posting[field], value)) continue;
        changes[field] = { from: plain(posting[field]), to: plain(value) };
        data[field] = value;
    }

    const merged = { ...posting, ...data };
    const problems = checkCompensation(merged);
    if (problems.length) throw new CareersError(400, 'VALIDATION_ERROR', problems[0], problems);

    Object.assign(data, derived(data));
    // A field the admin set is no longer uncertain.
    const confirmed = new Set(Object.keys(changes).map((f) => (/^(stipend|ctc|comp)/.test(f) ? 'compensation' : f === 'companyId' ? 'company' : f)));
    const remaining = (posting.uncertainFields ?? []).filter((f) => !confirmed.has(f));
    if (remaining.length !== (posting.uncertainFields ?? []).length) data.uncertainFields = remaining;
    return { data, changes };
}

// Known skills get their canonical spelling; unknown ones (an admin typed them) are kept as typed.
function mergeSkills(list) {
    const out = [];
    const seen = new Set();
    for (const s of list) {
        const canonical = canonicalSkillName(s) ?? s;
        const key = canonical.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            out.push(canonical);
        }
    }
    return out;
}
