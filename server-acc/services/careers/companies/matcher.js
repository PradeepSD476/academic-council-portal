// Company name resolution, cheapest first: exact alias -> normalised alias -> fuzzy. Pure: the
// index is passed in, so this runs without a DB and is fully unit-tested.
import { distance } from 'fastest-levenshtein';
import { normalizeCompanyName } from '../text/normalize.js';

export const DEFAULT_FUZZY_THRESHOLD = 0.92;
// Short names are too easy to confuse ("Meta" vs "Beta"), so fuzzy matching ignores them.
export const FUZZY_MIN_LENGTH = 5;

function exactKey(name) {
    return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

// aliases: [{ companyId, alias, normalizedAlias }]. Callers pass only ACTIVE and CANDIDATE
// companies; MERGED companies have had their aliases moved to the survivor.
export function buildIndex(aliases) {
    const byExact = new Map();
    const byNormalized = new Map();
    for (const a of aliases) {
        if (a.alias) byExact.set(exactKey(a.alias), a.companyId);
        const norm = a.normalizedAlias ?? normalizeCompanyName(a.alias);
        if (norm) byNormalized.set(norm, a.companyId);
    }
    return { byExact, byNormalized };
}

// Lets a long-running job keep one index current after it creates a company.
export function addToIndex(index, { companyId, alias, normalizedAlias }) {
    if (alias) index.byExact.set(exactKey(alias), companyId);
    if (normalizedAlias) index.byNormalized.set(normalizedAlias, companyId);
}

export function similarity(a, b) {
    const longest = Math.max(a.length, b.length);
    if (longest === 0) return 1;
    return 1 - distance(a, b) / longest;
}

// Returns { companyId, method: 'exact'|'normalized'|'fuzzy'|'none', score, normalized }.
// A fuzzy result is a guess: callers must mark the company as uncertain for admin review.
export function resolveName(rawName, index, { fuzzyThreshold = DEFAULT_FUZZY_THRESHOLD } = {}) {
    const none = { companyId: null, method: 'none', score: 0, normalized: '' };
    if (typeof rawName !== 'string' || !rawName.trim()) return none;

    const exact = index.byExact.get(exactKey(rawName));
    const normalized = normalizeCompanyName(rawName);
    if (exact !== undefined) return { companyId: exact, method: 'exact', score: 1, normalized };
    if (!normalized) return none;

    const byNorm = index.byNormalized.get(normalized);
    if (byNorm !== undefined) return { companyId: byNorm, method: 'normalized', score: 1, normalized };

    if (normalized.length < FUZZY_MIN_LENGTH) return { ...none, normalized };
    let best = null;
    let tie = false;
    for (const [candidate, companyId] of index.byNormalized) {
        if (candidate.length < FUZZY_MIN_LENGTH) continue;
        const score = similarity(normalized, candidate);
        if (!best || score > best.score) {
            best = { companyId, score };
            tie = false;
        } else if (score === best.score && companyId !== best.companyId) {
            tie = true;
        }
    }
    // Two different companies equally close means we can't tell which one was meant.
    if (best && !tie && best.score >= fuzzyThreshold) {
        return { companyId: best.companyId, method: 'fuzzy', score: best.score, normalized };
    }
    return { ...none, normalized };
}
