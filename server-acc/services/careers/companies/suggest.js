// Suggests the company an existing Career Vault experience is about, from its title (P3-T2 backfill).
// Pure: the alias index (ACTIVE companies only) is passed in. Nothing is linked automatically; an
// admin applies or corrects every suggestion.
//   1. alias scan: the longest known alias that occurs in the title as whole words
//      ("amazon.com internship" -> amazon, "Placement at Microsoft India Development Center" -> the
//      full Microsoft alias). Aliases shorter than 4 characters (gs, ti, aws, amd) score lower.
//   2. patterns: the text after "at" / "@", or before "intern(ship)" / "interview", through
//      resolveName (exact -> normalised -> fuzzy), so a misspelt name can still be found.
import { resolveName } from './matcher.js';

export const SHORT_ALIAS = 4;
export const SHORT_ALIAS_SCORE = 0.8;

// Same folding as normalizeCompanyName but without dropping words, so aliases can be found inside.
export function scanText(text) {
    return String(text ?? '')
        .normalize('NFKD').replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}

const STOP = /\s*(?:[:|,(\-–—]|\bfor\b|\bin\b|\b20\d\d\b)/i;
const PATTERNS = [
    ['at', /\bat\s+(.+)$/i],
    ['@', /@\s*(.+)$/],
    ['intern', /^(.+?)\s+intern(?:ship)?\b/i],
    ['interview', /^(.+?)\s+interview\b/i],
];

// Candidate company names from the title patterns, in order.
export function patternCandidates(title) {
    const out = [];
    for (const [kind, re] of PATTERNS) {
        const m = String(title ?? '').match(re);
        if (!m) continue;
        const name = m[1].split(STOP)[0].trim();
        if (name) out.push({ kind, name });
    }
    return out;
}

// index: buildIndex() output. Returns { companyId, method, score, matched } or null.
export function suggestCompany(title, index, options = {}) {
    const text = ` ${scanText(title)} `;
    let best = null;
    for (const [alias, companyId] of index.byNormalized) {
        if (alias.length < 2 || !text.includes(` ${alias} `)) continue;
        if (!best || alias.length > best.matched.length) best = { companyId, method: 'alias', matched: alias };
    }
    if (best) return { ...best, score: best.matched.length < SHORT_ALIAS ? SHORT_ALIAS_SCORE : 1 };

    for (const { kind, name } of patternCandidates(title)) {
        const r = resolveName(name, index, options);
        if (r.companyId) return { companyId: r.companyId, method: `pattern:${kind}:${r.method}`, score: r.score, matched: name };
    }
    return null;
}
