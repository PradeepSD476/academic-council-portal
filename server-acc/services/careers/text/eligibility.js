// Eligibility that a job board states only in the description ("CGPA 8 and above", "2027 graduates of
// Circuital branches only"), read without the model (B-03). Every value found is a suggestion: the
// caller flags 'eligibility' so a reviewer confirms it before students see it. Pure.
import { academicYearStart } from '../academicYear.js';
import { branchCodes } from '../postings/branchCodes.js';

// "Circuital" = the circuit branches. Generous on purpose: a reviewer trims it, while a branch left
// out would hide the posting from eligible students under "Eligible for me".
export const CIRCUITAL_BRANCHES = ['CS', 'EE', 'EC', 'MC', 'AI'];

const NUM = String.raw`(\d{1,2}(?:\.\d{1,2})?)`;
const SCALE = String.raw`(?:\s*(?:\/|out of)\s*(\d{1,2}))?`;
// "CGPA of 7.5", "Minimum CPI: 8.5", "CGPA >= 7.0/10": the number follows the word closely.
const CPI_AFTER = new RegExp(String.raw`\b(?:cgpa|cpi|gpa)\b[^\d\n]{0,15}?${NUM}${SCALE}`, 'gi');
// "7.5+ CGPA", "8 CGPA or above".
const CPI_BEFORE = new RegExp(String.raw`${NUM}${SCALE}\s*\+?\s*(?:cgpa|cpi|gpa)\b`, 'gi');

const GRAD_YEAR = [
    /\b(20\d{2})\s*(?:graduates?|grads?|pass[- ]?outs?|passing out|batch)\b/gi,
    /\b(?:batch|class)\s+(?:of\s+)?['’]?(20\d{2})\b/gi,
    /\bgraduating\s+(?:in|by)\s+(?:[a-z]+\s+)?(20\d{2})\b/gi,
];
const BRANCH_LIST = /\b(?:branch(?:es)?|streams?|disciplines?)\s*(?::|-|–|allowed:?|eligible:?)\s*([^\n.;]{2,120})/i;
const MENTION = /\b(cgpa|cpi|gpa|eligibility criteria|eligible branches)\b/i;

function cpiCutoff(text) {
    const values = [];
    for (const pattern of [CPI_AFTER, CPI_BEFORE]) {
        for (const [, num, scale] of text.matchAll(pattern)) {
            const value = Number(num);
            if (scale && scale !== '10') continue; // a 4-point GPA is not a CPI
            if (value > 0 && value <= 10) values.push(value);
        }
    }
    // Several cutoffs (per branch, say): the lowest, so nobody eligible is hidden.
    return values.length ? Math.min(...values) : null;
}

// A graduation year -> year of study now: B.Tech (4 years) and dual degree (5 years).
function yearsForGraduation(gradYear, now) {
    const start = academicYearStart(now);
    const years = [];
    const btech = start + 5 - gradYear;
    const dual = start + 6 - gradYear;
    if (btech >= 1 && btech <= 4) years.push(btech);
    if (dual >= 1 && dual <= 5) years.push(dual);
    return years;
}

function studyYears(text, now) {
    const years = new Set();
    let gradMentioned = false;
    for (const pattern of GRAD_YEAR) {
        for (const [, year] of text.matchAll(pattern)) {
            gradMentioned = true;
            yearsForGraduation(Number(year), now).forEach((y) => years.add(y));
        }
    }
    if (/\bpre[- ]?final[- ]year\b/i.test(text)) [3, 4].forEach((y) => years.add(y));
    if (/(?<!pre[- ]?)\bfinal[- ]year\b/i.test(text.replace(/\bpre[- ]?final[- ]year\b/gi, ''))) [4, 5].forEach((y) => years.add(y));
    return { years: [...years].sort((a, b) => a - b), mentioned: gradMentioned || years.size > 0 };
}

// Returns { codes, listed }; listed = the text names allowed branches, even if we couldn't map them.
function branches(text) {
    if (/\bcircuit(?:al)?\s+branch/i.test(text)) return { codes: CIRCUITAL_BRANCHES, listed: true };
    const list = text.match(BRANCH_LIST)?.[1];
    if (!list) return { codes: [], listed: false };
    const names = list.split(/\s*(?:,|\/|&|\band\b|\bor\b)\s*/i).map((s) => s.replace(/\bonly\b/i, '').trim()).filter(Boolean);
    const { codes, unknown } = branchCodes(names);
    // One name we can't map and the whole list is left to the reviewer, never half-guessed.
    return { codes: unknown.length ? [] : codes, listed: true };
}

// Returns { minCpi: number | null, years: number[], branches: string[], mentioned }.
// mentioned: the text talks about eligibility at all, even when nothing could be read from it.
export function parseEligibility(text, now = new Date()) {
    const body = String(text ?? '');
    const minCpi = cpiCutoff(body);
    const study = studyYears(body, now);
    const branch = branches(body);
    const mentioned = minCpi !== null || study.mentioned || branch.listed || MENTION.test(body);
    return { minCpi, years: study.years, branches: branch.codes, mentioned };
}
