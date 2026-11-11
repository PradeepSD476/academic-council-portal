// Per-board keyword rules (P7-T9, F-08): some boards are mostly noise (Paytm: tele-callers, sales).
// Checked after the global relevance rules, on the title only. Pure.
import { z } from 'zod';

export const MAX_KEYWORDS = 20;
const KEYWORD_MAX = 40;

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Whole words / phrases, case-insensitive: "sales" matches "Inside Sales Intern", not "Salesforce".
// A keyword that starts or ends with a symbol (e.g. "c++") is matched as plain text there.
function phrase(keyword) {
    const k = escape(keyword);
    const start = /^\w/.test(keyword) ? '\\b' : '';
    const end = /\w$/.test(keyword) ? '\\b' : '';
    return new RegExp(`${start}${k}${end}`, 'i');
}

// "Tele, sales,, Sales " -> ['tele', 'sales'].
export function normalizeKeywords(list) {
    const out = [];
    for (const raw of list ?? []) {
        const k = String(raw).trim().toLowerCase().replace(/\s+/g, ' ');
        if (k && !out.includes(k)) out.push(k);
    }
    return out;
}

const keywordList = z.array(z.string().trim().min(1, 'A keyword cannot be empty').max(KEYWORD_MAX, `Keep each keyword under ${KEYWORD_MAX} characters`))
    .max(MAX_KEYWORDS, `At most ${MAX_KEYWORDS} keywords`)
    .transform(normalizeKeywords);
export const keywordFields = { excludeTitleKeywords: keywordList.optional(), includeTitleKeywords: keywordList.optional() };

// null when the title stays, else 'exclude' (it contains an excluded keyword) or 'include' (the board
// has "only keep" keywords and the title has none of them). Exclude wins.
export function sourceRuleDrop(title, { excludeTitleKeywords, includeTitleKeywords } = {}) {
    const t = String(title ?? '');
    if ((excludeTitleKeywords ?? []).some((k) => phrase(k).test(t))) return 'exclude';
    const include = includeTitleKeywords ?? [];
    if (include.length && !include.some((k) => phrase(k).test(t))) return 'include';
    return null;
}

export const hasRules = (source) => Boolean(source?.excludeTitleKeywords?.length || source?.includeTitleKeywords?.length);
