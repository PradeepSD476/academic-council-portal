// Tunable rules for the relevance filter. ATS boards are global and mostly senior roles; without
// this filter the review queue floods and admins stop reviewing.

// Seniority in the title -> drop.
export const SENIOR_TITLE = /\b(senior|sr\.?|staff|principal|lead|leader|manager|director|head|vp|vice president|architect|chief|president|expert|specialist ii|ii|iii|iv)\b|\blevel\s*[2-9]\b|\bl[4-9]\b/i;

// Early-career signals in the title -> keep.
export const JUNIOR_TITLE = /\b(intern|internship|trainee|apprentice|apprenticeship|co-?op|graduate|new grad|campus|fresher|freshers|entry[\s-]level|junior|jr\.?|associate|sde[\s-]?(i|1)|engineer\s+(i|1)|analyst|early career|university)\b/i;

// Early-career signals in the description -> keep.
export const JUNIOR_DESCRIPTION = /\b0\s*(-|–|to)\s*[12]\+?\s*years?\b|\bfresh(er|ers)?\b|\bfresh graduates?\b|\brecent graduates?\b|\bnew grad(uate)?s?\b|\b20(2[5-9])\s*(batch|graduates?|pass[\s-]?outs?)\b|\bgraduating in 20(2[5-9])\b|\bno prior experience\b/i;

// Title words that make a posting an internship.
export const INTERNSHIP_TITLE = /\b(intern|internship|trainee|apprentice|apprenticeship|co-?op)\b/i;

// Remote postings are kept only if they are open to India.
export const REMOTE_OPEN_TO_INDIA = /\b(india|apac|asia|asia[\s-]pacific|anywhere|worldwide|global|any location)\b/i;

// Indian states and union territories: a posting naming one is in India even when the city
// isn't in normalize.js's alias list.
export const INDIAN_STATES = /\b(india|andhra pradesh|arunachal pradesh|assam|bihar|chhattisgarh|goa|gujarat|haryana|himachal pradesh|jharkhand|karnataka|kerala|madhya pradesh|maharashtra|manipur|meghalaya|mizoram|nagaland|odisha|orissa|punjab|rajasthan|sikkim|tamil nadu|telangana|tripura|uttar pradesh|uttarakhand|west bengal|delhi ncr|jammu|kashmir|ladakh|puducherry|pondicherry)\b/i;

// Every country except India, from the runtime's own ISO region names (no hand-maintained list
// to go stale), e.g. "Hong Kong SAR China" -> "hong kong", "Congo - Kinshasa" -> "congo".
function countryNames() {
    const display = new Intl.DisplayNames(['en'], { type: 'region' });
    const names = new Set();
    for (let a = 65; a <= 90; a++) {
        for (let b = 65; b <= 90; b++) {
            const code = String.fromCharCode(a, b);
            let name;
            try {
                name = display.of(code);
            } catch {
                continue; // not a valid region code
            }
            if (!name || name === code || /^(india|world|unknown region|european union|united nations|eurozone)$/i.test(name)) continue;
            const base = name.split(/ \(| SAR | - |, /)[0].trim().toLowerCase();
            if (base.length >= 4 && base !== 'india') names.add(base);
        }
    }
    return [...names];
}

const US_STATES = ['alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware', 'florida',
    'hawaii', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine', 'maryland',
    'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new hampshire',
    'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania',
    'rhode island', 'south carolina', 'south dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington',
    'west virginia', 'wisconsin', 'wyoming'];

// Well-known foreign cities and short forms that often appear without a country name.
const FOREIGN_CITIES = ['usa', 'u\\.s\\.a?', 'us', 'uk', 'u\\.k\\.', 'uae', 'emea', 'americas', 'latam', 'europe', 'nordics',
    'dc', 'nyc', 'sf', 'bay area', 'silicon valley', 'san francisco', 'seattle', 'boston', 'austin', 'chicago', 'los angeles',
    'denver', 'atlanta', 'toronto', 'vancouver', 'montreal', 'london', 'dublin', 'berlin', 'munich', 'paris', 'amsterdam',
    'zurich', 'stockholm', 'madrid', 'barcelona', 'lisbon', 'warsaw', 'milan', 'tokyo', 'seoul', 'sydney', 'melbourne',
    'dubai', 'tel aviv', 'manila', 'jakarta', 'bangkok', 'kuala lumpur', 'ho chi minh', 'sao paulo', 'mexico city'];

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const FOREIGN_PLACES = new RegExp(
    `\\b(${[...countryNames().map(escape), ...US_STATES, ...FOREIGN_CITIES].join('|')})\\b`,
    'i',
);
