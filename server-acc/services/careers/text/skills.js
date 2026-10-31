// Dictionary-based skill extraction (tier 2). Deterministic and explainable: a skill is listed
// only when one of its spellings appears as a whole word.
import { SKILLS } from './skillsDictionary.js';

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

// "Whole word" for spellings that start/end with symbols (c++, .net, c#) means: not glued to
// other letters, digits or a dot (so "js" in "Node.js" is not JavaScript).
const PATTERNS = Object.entries(SKILLS).map(([canonical, spellings]) => [
    canonical,
    new RegExp(`(?<![a-z0-9.])(?:${spellings.map(escape).join('|')})(?![a-z0-9+#])`, 'i'),
]);

// Returns canonical names in dictionary order (stable output, easy to test and diff).
export function extractSkills(text) {
    if (typeof text !== 'string' || !text.trim()) return [];
    return PATTERNS.filter(([, pattern]) => pattern.test(text)).map(([canonical]) => canonical);
}

// Maps free-form skill strings (e.g. from an LLM) to canonical names; unknown ones are dropped.
export function canonicalizeSkills(list) {
    const found = new Set();
    for (const item of list ?? []) {
        for (const skill of extractSkills(String(item))) found.add(skill);
    }
    return PATTERNS.map(([canonical]) => canonical).filter((c) => found.has(c));
}

// Exact lookup for one skill name typed by a person: "reactjs" -> "React". Unlike canonicalizeSkills
// it never extracts a skill from inside a longer name ("Figma Jam" stays unknown -> null).
const EXACT = new Map(Object.entries(SKILLS).flatMap(([canonical, spellings]) => [canonical, ...spellings].map((sp) => [sp.toLowerCase(), canonical])));

export function canonicalSkillName(name) {
    return EXACT.get(String(name).trim().toLowerCase().replace(/\s+/g, ' ')) ?? null;
}
