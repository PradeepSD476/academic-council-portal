// Deterministic normalisers (cost-cascade tier 2). Pure functions: no DB, no network.
// They produce comparison keys for company resolution and posting deduplication; they are never
// shown to students.

// Trailing tokens that don't distinguish one organisation from another. Stripped repeatedly from
// the end: "Google India Pvt Ltd" -> "google".
const TRAILING_NOISE = new Set([
    'private', 'pvt', 'limited', 'ltd', 'llc', 'llp', 'lp', 'inc', 'incorporated', 'corp',
    'corporation', 'co', 'company', 'gmbh', 'plc', 'ag', 'sa', 'bv', 'india', 'com',
    // left behind by "X & Co." once "co" is stripped
    'and',
]);

function foldAccents(text) {
    return text.normalize('NFKD').replace(/\p{M}+/gu, '');
}

function collapse(text) {
    return text.replace(/\s+/g, ' ').trim();
}

export function normalizeCompanyName(name) {
    if (typeof name !== 'string') return '';
    let s = foldAccents(name).toLowerCase();
    s = s.replace(/&/g, ' and ');
    s = s.replace(/[^a-z0-9]+/g, ' ');
    const tokens = collapse(s).split(' ').filter(Boolean);
    if (tokens[0] === 'the' && tokens.length > 1) tokens.shift();
    // Keep at least one token so a name made only of noise ("Company") is not erased.
    while (tokens.length > 1 && TRAILING_NOISE.has(tokens[tokens.length - 1])) tokens.pop();
    return tokens.join(' ');
}

const TITLE_SYNONYMS = [
    [/\bsoftware development engineer\b/g, 'software engineer'],
    [/\bsoftware dev engineer\b/g, 'software engineer'],
    [/\b(sde|swe)\b/g, 'software engineer'],
    [/\binternship\b/g, 'intern'],
];

// Words that describe the hiring cycle, not the role.
const TITLE_NOISE = /\b(summer|winter|spring|fall|autumn|batch|cohort)\b/g;

export function normalizeTitle(title) {
    if (typeof title !== 'string') return '';
    let s = foldAccents(title).toLowerCase();
    s = s.replace(/\([^)]*\)|\[[^\]]*\]|\{[^}]*\}/g, ' ');
    s = s.replace(/\b20\d\d\b/g, ' ');
    s = s.replace(/[^a-z0-9]+/g, ' ');
    s = s.replace(TITLE_NOISE, ' ');
    for (const [pattern, replacement] of TITLE_SYNONYMS) s = s.replace(pattern, replacement);
    const tokens = collapse(s).split(' ').filter(Boolean);
    // "Software Engineer I" / "SDE-1" are the same entry-level role as "Software Engineer".
    // "intern" is deliberately kept so an internship never dedupes with a full-time role.
    while (tokens.length > 1 && ['i', '1'].includes(tokens[tokens.length - 1])) tokens.pop();
    return tokens.join(' ');
}

// canonical city -> spellings seen in postings. Also used by the relevance filter.
export const INDIA_CITY_ALIASES = {
    bengaluru: ['bengaluru', 'bangalore', 'blr'],
    hyderabad: ['hyderabad', 'secunderabad'],
    pune: ['pune'],
    mumbai: ['mumbai', 'bombay', 'navi mumbai', 'thane'],
    delhi: ['delhi', 'new delhi', 'delhi ncr', 'ncr'],
    gurugram: ['gurugram', 'gurgaon'],
    noida: ['noida', 'greater noida'],
    chennai: ['chennai', 'madras'],
    kolkata: ['kolkata', 'calcutta'],
    ahmedabad: ['ahmedabad'],
    jaipur: ['jaipur'],
    chandigarh: ['chandigarh', 'mohali'],
    kochi: ['kochi', 'cochin'],
    indore: ['indore'],
    patna: ['patna'],
    thiruvananthapuram: ['thiruvananthapuram', 'trivandrum'],
    coimbatore: ['coimbatore'],
    bhubaneswar: ['bhubaneswar'],
    mysuru: ['mysuru', 'mysore'],
};

const CITY_PATTERNS = Object.entries(INDIA_CITY_ALIASES).map(([canonical, spellings]) => [
    canonical,
    new RegExp(`\\b(${spellings.map((sp) => sp.replace(/ /g, '\\s+')).join('|')})\\b`),
]);

const REMOTE_PATTERN = /\b(remote|work from home|wfh|anywhere)\b/;

// Returns a stable key such as "bengaluru", "bengaluru|hyderabad", "remote" or "bengaluru|remote",
// or null when no location is given. Unknown places fall back to their cleaned-up text, so two
// postings with the same unusual location still compare equal.
export function normalizeLocation(text) {
    if (typeof text !== 'string') return null;
    const s = collapse(foldAccents(text).toLowerCase().replace(/[^a-z0-9]+/g, ' '));
    if (!s) return null;

    const found = new Set();
    for (const [canonical, pattern] of CITY_PATTERNS) {
        if (pattern.test(s)) found.add(canonical);
    }
    if (REMOTE_PATTERN.test(s)) found.add('remote');
    if (found.size === 0 && /\bindia\b/.test(s)) found.add('india');
    if (found.size === 0) return s;
    return [...found].sort().join('|');
}
