// Internship season, start month and length from the title and description (F-25), read without the
// model, like the eligibility parser (B-03). Every value is a suggestion: the caller flags 'season' so
// a reviewer confirms it. Nothing is inferred that the text does not say: a season comes only from
// the words "summer" / "winter" next to an internship word or a year (a January start is not called
// "winter"), and a start month only from a stated month and year. Pure.

const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH = String.raw`(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?`;
const NUM = String.raw`(\d{1,2}|${Object.keys(NUMBER_WORDS).join('|')})`;

export const MAX_DURATION_MONTHS = 12;
const WEEKS_PER_MONTH = 4.345;

const SEASON_WORDS = { SUMMER: 'summer', WINTER: 'winter' };
// "Summer 2026", "summer intern(ship)", "2026 summer". In a title the word alone is enough.
function season(title, text) {
    for (const [value, word] of Object.entries(SEASON_WORDS)) {
        if (new RegExp(String.raw`\b${word}\b`, 'i').test(title)) return value;
        const near = new RegExp(String.raw`\b${word}\s+(?:20\d{2}|intern(?:ship)?s?|training|program(?:me)?)\b|\b20\d{2}\s+${word}\b`, 'i');
        if (near.test(text)) return value;
    }
    return null;
}

const toNumber = (s) => NUMBER_WORDS[s.toLowerCase()] ?? Number(s);
const monthIndex = (s) => MONTHS.indexOf(s.slice(0, 3).toLowerCase());
const monthDate = (m, y) => new Date(Date.UTC(Number(y), monthIndex(m), 1));

// "N months" / "N-month" / "10-12 weeks", only when it is about the internship: followed by an
// internship word or preceded by "duration" / "for a". "6 months of experience", "6 months – 2 years
// experience" and "6 months ago" are not lengths.
const DURATION = new RegExp(String.raw`\b${NUM}(?:\s*(?:-|–|to)\s*(\d{1,2}))?[\s-]*(months?|weeks?)\b`, 'gi');
const AFTER_OK = /^[\s-]*(?:long\s+|paid\s+|full[- ]time\s+|onsite\s+|on-site\s+|remote\s+|backend\s+|frontend\s+)*(?:intern|internship|apprentice|program|programme|training|project|duration)/i;
const BEFORE_OK = /(?:duration|period|tenure|length)\s*[:\-–]?\s*$|\bfor\s+(?:a\s+|an\s+)?$/i;
const AFTER_BAD = /^[\s,]*(?:(?:-|–|to)\s*\d+\s*(?:years?|yrs?)\s*)?(?:of\s+)?(?:experience|exp\b|work\s+experience|ago)/i;

function duration(text) {
    for (const m of text.matchAll(DURATION)) {
        const before = text.slice(Math.max(0, m.index - 25), m.index);
        const after = text.slice(m.index + m[0].length, m.index + m[0].length + 40);
        if (AFTER_BAD.test(after)) continue;
        if (!AFTER_OK.test(after) && !BEFORE_OK.test(before)) continue;
        const top = m[2] ? Number(m[2]) : toNumber(m[1]);
        const months = /^week/i.test(m[3]) ? Math.round(top / WEEKS_PER_MONTH) : top;
        if (months >= 1 && months <= MAX_DURATION_MONTHS) return months;
    }
    return null;
}

// "January 2027 to May 2027", "Jan – Jun 2027": start and inclusive length.
const RANGE = new RegExp(String.raw`\b${MONTH}\s*(20\d{2})?\s*(?:-|–|to|until|till)\s*${MONTH}\s*(20\d{2})\b`, 'i');
// "start in May 2026", "starting in Jan 2027", "from May 2026", "joining in June 2026".
const START = new RegExp(String.raw`\b(?:start(?:s|ing)?|from|joining|commencing|beginning)\s+(?:in\s+|on\s+|from\s+)?${MONTH}\s*,?\s*(20\d{2})\b`, 'i');

function range(text) {
    const r = text.match(RANGE);
    if (!r) return null;
    const startYear = r[2] ?? r[4];
    const start = monthDate(r[1], startYear);
    const end = monthDate(r[3], r[4]);
    const months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth() + 1;
    if (months < 1 || months > MAX_DURATION_MONTHS) return null;
    return { start, months };
}

// Returns { season: SUMMER | WINTER | null, startMonth: Date (1st of the month, UTC) | null,
// durationMonths: number | null, found }.
export function parseSeason(title, description) {
    const t = String(title ?? '');
    const text = `${t}\n${description ?? ''}`;
    const span = range(text);
    const start = text.match(START);
    const result = {
        season: season(t, text),
        startMonth: span?.start ?? (start ? monthDate(start[1], start[2]) : null),
        durationMonths: duration(text) ?? span?.months ?? null,
    };
    return { ...result, found: Object.values(result).some((v) => v !== null) };
}
