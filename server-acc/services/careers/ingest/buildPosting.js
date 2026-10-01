// Turns one relevant RawPosting from an ATS adapter into Posting fields (Architecture 6.2, steps
// 2-6 and 8). Pure and deterministic: no LLM, no database. Unknown stays unknown (null / UNKNOWN /
// NOT_DISCLOSED) and is listed in uncertainFields so the review queue highlights it.
import { normalizeTitle, normalizeLocation } from '../text/normalize.js';
import { parseCompensation } from '../text/compensation.js';
import { simhash64 } from '../text/fingerprint.js';
import { extractSkills } from '../text/skills.js';
import { detectWorkMode } from '../text/workMode.js';

export const UNCERTAIN_FIELD_PENALTY = 0.15;

const EMPLOYMENT_INTERN = /\b(intern|internship|trainee|apprentice|apprenticeship|co-?op)\b/i;
const EMPLOYMENT_FULL_TIME = /\b(full[\s-]?time|permanent|regular)\b/i;

// The title decides first (relevance.type), then the ATS employment type ("Intern", "Full-time").
// An internship signal from either side wins, so an intern role is never shown as a job.
export function resolveType(relevanceType, employmentTypeText) {
    const employment = employmentTypeText ?? '';
    if (relevanceType === 'INTERNSHIP' || EMPLOYMENT_INTERN.test(employment)) return 'INTERNSHIP';
    if (relevanceType === 'FULL_TIME' || EMPLOYMENT_FULL_TIME.test(employment)) return 'FULL_TIME';
    return 'UNKNOWN';
}

// Stipend for internships (monthly), CTC otherwise (yearly). The unused side stays NOT_DISCLOSED.
export function compensationFields(text, type) {
    const fields = {
        compCurrency: 'INR',
        stipendMin: null, stipendMax: null, stipendDisclosure: 'NOT_DISCLOSED',
        ctcMin: null, ctcMax: null, ctcDisclosure: 'NOT_DISCLOSED',
        compensationRaw: null,
    };
    if (typeof text !== 'string' || !text.trim()) return fields;

    const kind = type === 'INTERNSHIP' ? 'stipend' : 'ctc';
    const parsed = parseCompensation(text, { kind });
    fields.compensationRaw = parsed.raw;
    fields.compCurrency = parsed.currency ?? 'INR';
    if (kind === 'stipend') {
        Object.assign(fields, { stipendMin: parsed.min, stipendMax: parsed.max, stipendDisclosure: parsed.disclosure });
    } else {
        Object.assign(fields, { ctcMin: parsed.min, ctcMax: parsed.max, ctcDisclosure: parsed.disclosure });
    }
    return fields;
}

function parseDate(value) {
    if (value === null || value === undefined || value === '') return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function confidenceFor(uncertainFields) {
    const score = 1 - UNCERTAIN_FIELD_PENALTY * uncertainFields.length;
    return Math.max(0, Math.round(score * 100) / 100);
}

// raw: RawPosting; relevance: result of evaluateRelevance (keep === true);
// company: { companyId, uncertain }.
export function buildPostingData(raw, { relevance, company }) {
    const title = raw.title.trim();
    const description = raw.descriptionText ?? '';
    const type = resolveType(relevance.type, raw.employmentTypeText);
    const comp = compensationFields(raw.compensationText, type);
    const location = raw.locationText?.trim() || null;

    const uncertainFields = [];
    if (type === 'UNKNOWN') uncertainFields.push('type');
    if (!location || relevance.location === 'unknown') uncertainFields.push('location');
    if (company.uncertain) uncertainFields.push('company');
    // Pay was stated but could not be read with certainty; the raw text is kept for the reviewer.
    if (comp.stipendDisclosure === 'UNCLEAR' || comp.ctcDisclosure === 'UNCLEAR') uncertainFields.push('compensation');

    return {
        companyId: company.companyId,
        roleTitle: title,
        roleTitleNormalized: normalizeTitle(title),
        type,
        location,
        locationNormalized: normalizeLocation(location),
        workMode: detectWorkMode({ workplaceText: raw.workplaceText, text: description }),
        skills: extractSkills(`${title}\n${description}`),
        ...comp,
        descriptionText: description,
        contentFingerprint: simhash64(description),
        applyUrl: raw.url,
        deadlineStated: parseDate(raw.deadline),
        extractionTier: 'STRUCTURED',
        extractionConfidence: confidenceFor(uncertainFields),
        uncertainFields,
    };
}
