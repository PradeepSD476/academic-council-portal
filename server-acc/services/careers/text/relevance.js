// Keeps only postings an IIT Patna student can plausibly apply to: in India (or remote and open
// to India) and early-career. Every drop has a reason so SourceRun can report fetched vs kept.
import { normalizeLocation, INDIA_CITY_ALIASES } from './normalize.js';
import {
    SENIOR_TITLE, JUNIOR_TITLE, JUNIOR_DESCRIPTION, INTERNSHIP_TITLE, REMOTE_OPEN_TO_INDIA, FOREIGN_PLACES,
} from './relevanceRules.js';

const INDIAN_KEYS = new Set([...Object.keys(INDIA_CITY_ALIASES), 'india']);

// INTERNSHIP for intern-type titles, FULL_TIME for other explicit early-career titles, else null
// (unknown: callers must not guess).
export function guessType(title) {
    if (typeof title !== 'string') return null;
    if (INTERNSHIP_TITLE.test(title)) return 'INTERNSHIP';
    if (/\b(new grad|graduate|campus|fresher|entry[\s-]level|junior|sde[\s-]?(i|1)|engineer\s+(i|1))\b/i.test(title)) return 'FULL_TIME';
    return null;
}

// 'india' | 'remote-india' | 'foreign' | 'unknown'
// Only a named foreign place makes a posting foreign. A place we don't recognise (an Indian city
// missing from the alias list, say) is 'unknown' and kept for a human to check, not dropped.
export function classifyLocation(locationText) {
    const key = normalizeLocation(locationText);
    if (key === null) return 'unknown';
    const text = String(locationText);
    const parts = key.split('|');
    if (parts.some((p) => INDIAN_KEYS.has(p))) return 'india';
    if (parts.includes('remote')) {
        if (REMOTE_OPEN_TO_INDIA.test(text)) return 'remote-india';
        return FOREIGN_PLACES.test(text) ? 'foreign' : 'remote-india';
    }
    return FOREIGN_PLACES.test(text) ? 'foreign' : 'unknown';
}

// Returns { keep, reason, type, location }.
//   reason:   'ok' | 'location' | 'seniority' | 'level'
//   type:     INTERNSHIP | FULL_TIME | UNKNOWN
//   location: result of classifyLocation (callers flag 'unknown' as uncertain)
export function evaluateRelevance({ title, locationText, descriptionText } = {}) {
    const t = typeof title === 'string' ? title : '';
    const location = classifyLocation(locationText);
    if (location === 'foreign') return { keep: false, reason: 'location', type: 'UNKNOWN', location };
    if (SENIOR_TITLE.test(t) && !INTERNSHIP_TITLE.test(t)) return { keep: false, reason: 'seniority', type: 'UNKNOWN', location };

    const juniorTitle = JUNIOR_TITLE.test(t);
    const juniorText = JUNIOR_DESCRIPTION.test(descriptionText ?? '');
    if (!juniorTitle && !juniorText) return { keep: false, reason: 'level', type: 'UNKNOWN', location };

    const type = guessType(t) ?? (juniorText ? 'FULL_TIME' : 'UNKNOWN');
    return { keep: true, reason: 'ok', type, location };
}
