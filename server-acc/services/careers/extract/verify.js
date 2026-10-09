// A model's extraction is not trusted; code checks it against the page text (Architecture 8.2).
// Pure. Observed with qwen2.5:7b: an internship labelled FULL_TIME, overall_confidence 100, pay
// paraphrased instead of copied. So, for every provider:
//   1. grounding   - names, title, pay text, location, skills, branches, CPI must appear in the input;
//                    anything that doesn't is dropped and its field marked uncertain
//   2. overrides   - type from the title rules, work mode from keywords, skills unioned with the dictionary
//   3. pay numbers - always from parseCompensation (in applyExtraction), never from the model
//   4. confidence  - computed here: model value (0.5 if outside 0..1), -0.15 per dropped field,
//                    -0.10 if the type was overridden; capped at 0.7 for a local model so every
//                    local extraction is reviewed in the Flagged tab
import { guessType } from '../text/relevance.js';
import { detectWorkMode } from '../text/workMode.js';
import { extractSkills, canonicalSkillName } from '../text/skills.js';
import { branchCodes } from '../postings/branchCodes.js';
import { parseEligibility } from '../text/eligibility.js';

export const DROPPED_FIELD_PENALTY = 0.15;
export const TYPE_OVERRIDE_PENALTY = 0.1;
export const LOCAL_MODEL_CAP = 0.7;
export const INVALID_CONFIDENCE = 0.5;

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// Lower-case, unify dashes/quotes/spaces, collapse whitespace: "₹40,000 – 60,000" == "₹40,000 - 60,000".
export function normalizeForMatch(s) {
    return String(s ?? '')
        .toLowerCase()
        .replace(/[‐-―−]/g, '-')
        .replace(/[‘’]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
}

export const grounded = (value, haystack) => {
    const needle = normalizeForMatch(value);
    return needle.length > 0 && haystack.includes(needle);
};

// A deadline counts only if it is a real date and its day and month are written in the page.
export function deadlineGrounded(value, haystack) {
    if (!value) return false;
    const date = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return false;
    const day = date.getUTCDate();
    const month = date.getUTCMonth();
    const dayOk = new RegExp(`(^|[^0-9])0?${day}(st|nd|rd|th)?([^0-9]|$)`).test(haystack);
    const monthOk = haystack.includes(MONTHS[month]) || new RegExp(`(^|[^0-9])0?${month + 1}([^0-9]|$)`).test(haystack);
    return dayOk && monthOk;
}

// A CPI counts only when the number is written within ~30 characters of CGPA / CPI / GPA (B-09):
// "7 days a week" must not ground a cutoff of 7. "8" also matches "8.0", "7.5" matches "7.50".
const CPI_WORD = /\b(cgpa|cpi|gpa)\b/;
export function cpiGrounded(value, haystack) {
    if (typeof value !== 'number' || !(value >= 0 && value <= 10)) return false;
    const [int, frac] = String(value).split('.');
    const number = new RegExp(`(?<![\\d.])${int}${frac ? `\\.${frac}0*` : '(?:\\.0+)?'}(?!\\.?\\d)`, 'g');
    for (const m of haystack.matchAll(number)) {
        if (CPI_WORD.test(haystack.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30))) return true;
    }
    return false;
}

// Years of study the page states (B-09): "3rd year", "third-year", "3rd or 4th year", "(pre-)final
// year" and graduation batches ("2027 graduates"), the last two through text/eligibility.js.
const ORDINALS = { 1: '1st|first', 2: '2nd|second', 3: '3rd|third', 4: '4th|fourth', 5: '5th|fifth' };
export function statedYears(haystack, now = new Date()) {
    const years = new Set(parseEligibility(haystack, now).years);
    for (const [year, words] of Object.entries(ORDINALS)) {
        if (new RegExp(`\\b(?:${words})\\b(?=[^.\\n]{0,20}\\byears?\\b)`).test(haystack)) years.add(Number(year));
    }
    return years;
}

const validConfidence = (n) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1;

// output: validated model output (schema.js); input: the page text sent to the model.
// Returns { isJobPosting, fields, uncertainFields, confidence, corrections }.
export function verifyExtraction(output, input, { provider = 'ollama', now = new Date() } = {}) {
    const haystack = normalizeForMatch(input);
    const uncertain = new Set();
    const corrections = [];
    let dropped = 0;

    const keep = (field, value, uncertainKey) => {
        if (value === null || value === undefined) return null;
        if (grounded(value, haystack)) return value;
        dropped++;
        uncertain.add(uncertainKey);
        corrections.push(`${field} "${String(value).slice(0, 60)}" is not in the page; dropped`);
        return null;
    };

    const companyName = keep('company_name', output.company_name, 'company');
    const roleTitle = keep('role_title', output.role_title, 'roleTitle');
    const location = keep('location', output.location, 'location');
    const compensationText = keep('compensation_text', output.compensation_text, 'compensation');

    // Skills: model skills must be in the text; then the dictionary's own matches are added.
    const modelSkills = output.skills.filter((s) => grounded(s, haystack));
    if (modelSkills.length < output.skills.length) {
        dropped++;
        uncertain.add('skills');
        corrections.push(`${output.skills.length - modelSkills.length} skill(s) not in the page; dropped`);
    }
    const skills = [...new Set([...modelSkills.map((s) => canonicalSkillName(s) ?? s), ...extractSkills(input)])];

    let deadline = output.deadline_stated;
    if (deadline && !deadlineGrounded(deadline, haystack)) {
        dropped++;
        uncertain.add('deadline');
        corrections.push(`deadline "${deadline}" is not written in the page; dropped`);
        deadline = null;
    }

    // Eligibility: branch names must be in the text and map to an IIT Patna code; CPI must be 0..10
    // and written next to CGPA / CPI / GPA; years must be 1..5 and stated in the text.
    const groundedBranches = output.eligibility.branches.filter((b) => grounded(b, haystack));
    const { codes: eligibleBranches, unknown } = branchCodes(groundedBranches);
    const stated = statedYears(haystack, now);
    const eligibleYears = [...new Set(output.eligibility.years.filter((y) => y >= 1 && y <= 5 && stated.has(y)))];
    let minCpi = output.eligibility.min_cpi;
    if (minCpi !== null && !cpiGrounded(minCpi, haystack)) {
        corrections.push(`min CPI ${minCpi} is not written in the page; dropped`);
        minCpi = null;
        dropped++;
        uncertain.add('eligibility');
    }
    if (groundedBranches.length < output.eligibility.branches.length || unknown.length || eligibleYears.length < output.eligibility.years.length) {
        uncertain.add('eligibility');
        corrections.push('some eligibility values were not in the page or not recognised; dropped');
    }

    // Type: the title rule wins over the model. Work mode: keywords win when they find something.
    let type = output.type;
    let typeOverridden = false;
    const ruleType = guessType(roleTitle ?? output.role_title ?? '');
    if (ruleType && ruleType !== type) {
        corrections.push(`type ${type} overridden to ${ruleType} from the title`);
        type = ruleType;
        typeOverridden = true;
    }
    if (type === 'UNKNOWN') uncertain.add('type');
    const keywordMode = detectWorkMode({ text: input });
    const workMode = keywordMode !== 'UNKNOWN' ? keywordMode : output.work_mode;

    // PPO only counts when the page says so.
    const ppoMentioned = output.ppo_mentioned === true && !/\b(ppo|pre[\s-]?placement offer)\b/i.test(input) ? null : output.ppo_mentioned;

    // Apply link: only one that is written in the page; otherwise the caller uses the page URL.
    const applyUrl = output.apply_url && /^https?:\/\//i.test(output.apply_url) && grounded(output.apply_url, haystack) ? output.apply_url : null;

    if (!location) uncertain.add('location');

    // qwen2.5:7b said "not a job posting" for a plain job page with a clear title (1 Oct 2026), so the
    // flag alone never discards a posting that has a grounded title: it is kept and flagged instead.
    if (!output.is_job_posting && roleTitle) {
        dropped++;
        uncertain.add('isJobPosting');
        corrections.push('the model said this is not a job posting, but it names a role; kept for review');
    }

    let confidence = validConfidence(output.overall_confidence) ? output.overall_confidence : INVALID_CONFIDENCE;
    if (!validConfidence(output.overall_confidence)) corrections.push(`model confidence ${output.overall_confidence} is not between 0 and 1; using ${INVALID_CONFIDENCE}`);
    confidence -= DROPPED_FIELD_PENALTY * dropped;
    if (typeOverridden) confidence -= TYPE_OVERRIDE_PENALTY;
    if (provider === 'ollama') confidence = Math.min(confidence, LOCAL_MODEL_CAP);
    confidence = Math.max(0, Math.round(confidence * 100) / 100);

    return {
        isJobPosting: output.is_job_posting,
        fields: {
            companyName, roleTitle, type, location, workMode, skills, compensationText, deadline, applyUrl,
            ppoMentioned, eligibleBranches, eligibleYears, minCpi,
        },
        uncertainFields: [...uncertain],
        confidence,
        corrections,
    };
}
