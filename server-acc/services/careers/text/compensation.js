// Parses pay text into numbers deterministically (cost-cascade tier 2; the LLM only copies the
// verbatim span). Honest-data rules:
//   - unknown is never 0: nothing stated / "competitive" -> NOT_DISCLOSED with null amounts
//   - numbers we can't place with certainty (no period for a stipend, weekly pay, ...) -> UNCLEAR,
//     null amounts, and the raw text kept so the UI can show it verbatim
//   - 0 is only returned when the text says the role is unpaid
// Stipend amounts are per month; CTC amounts are per year. Nothing is converted between periods.

const UNPAID = /\b(unpaid|no stipend|without stipend|stipend\s*[:-]?\s*(nil|none|0)\b|volunteer(ing)? role)\b/i;

const CURRENCY = [
    [/₹|\brs\.?(?=\s*\d)|\brs\b|\binr\b|\brupees?\b/i, 'INR'],
    [/\$|\busd\b/i, 'USD'],
    [/€|\beur\b/i, 'EUR'],
    [/£|\bgbp\b/i, 'GBP'],
];

const PER_MONTH = /(per|\/|a|each)\s*(month|mo)\b|\bmonthly\b|\bp\.?\s?m\.?(?![a-z])|\/\s*m\b|\bpm\b/i;
const PER_YEAR = /(per|\/|a|each)\s*(annum|year|yr)\b|\bannual(ly)?\b|\bp\.?\s?a\.?(?![a-z])|\blpa\b|\bper annum\b/i;
const OTHER_PERIOD = /(per|\/|a|each)\s*(week|wk|day|hour|hr)\b|\bweekly\b|\bhourly\b|\bdaily\b/i;

// amount = optional currency, number (Indian 1,00,000 or Western 100,000 grouping, or decimal), optional unit
const AMOUNT = /(₹|rs\.?|inr|\$|usd|€|eur|£|gbp)?\s*(\d{1,3}(?:,\d{2,3})+|\d+(?:\.\d+)?)\s*(k|l|lakhs?|lacs?|lpa|cr|crores?|mn|million|m)?(?![a-z0-9])/gi;
const RANGE_GLUE = /^\s*(-|–|—|to)\s*$/i;

const UNIT_FACTOR = { k: 1e3, l: 1e5, lakh: 1e5, lakhs: 1e5, lac: 1e5, lacs: 1e5, lpa: 1e5, cr: 1e7, crore: 1e7, crores: 1e7, mn: 1e6, million: 1e6, m: 1e6 };

function detectCurrency(text) {
    for (const [pattern, code] of CURRENCY) if (pattern.test(text)) return code;
    return null;
}

function findAmounts(text) {
    const out = [];
    for (const m of text.matchAll(AMOUNT)) {
        const [, currency, digits, rawUnit] = m;
        const unit = rawUnit?.toLowerCase();
        const value = Number(digits.replace(/,/g, ''));
        if (!Number.isFinite(value)) continue;
        out.push({ value, unit, hasCurrency: Boolean(currency), start: m.index, end: m.index + m[0].length });
    }
    return out;
}

// Plain numbers such as "6 months" or "2026" are not pay; an amount needs a currency, a unit, or
// to be large enough to be money on its own.
function isMoneyLike(a) {
    if (a.hasCurrency || a.unit) return true;
    if (Number.isInteger(a.value) && a.value >= 1900 && a.value <= 2100) return false;
    return a.value >= 1000;
}

function scaled(a, fallbackUnit) {
    const unit = a.unit ?? fallbackUnit;
    const factor = unit ? UNIT_FACTOR[unit] ?? 1 : 1;
    return Math.round(a.value * factor);
}

function pickAmounts(text) {
    const amounts = findAmounts(text);
    for (let i = 0; i < amounts.length; i++) {
        const a = amounts[i];
        const b = amounts[i + 1];
        if (b && RANGE_GLUE.test(text.slice(a.end, b.start)) && (isMoneyLike(a) || isMoneyLike(b))) {
            // "12-18 LPA": the unit written once applies to both ends.
            const unit = b.unit ?? a.unit;
            return { low: scaled(a, unit), high: scaled(b, unit), unit, amounts: [a, b] };
        }
        if (isMoneyLike(a)) return { low: scaled(a), high: scaled(a), unit: a.unit, amounts: [a] };
    }
    return null;
}

const notDisclosed = (raw) => ({ min: null, max: null, disclosure: 'NOT_DISCLOSED', currency: null, raw });
const unclear = (raw, currency) => ({ min: null, max: null, disclosure: 'UNCLEAR', currency, raw });

// kind: 'stipend' (monthly) | 'ctc' (yearly)
export function parseCompensation(text, { kind = 'stipend' } = {}) {
    if (typeof text !== 'string' || !text.trim()) return notDisclosed(null);
    const raw = text.trim().replace(/\s+/g, ' ').slice(0, 300);

    if (kind === 'stipend' && UNPAID.test(raw)) {
        return { min: 0, max: 0, disclosure: 'DISCLOSED', currency: 'INR', raw };
    }

    const picked = pickAmounts(raw);
    // "competitive", "as per industry standards", or any text without an amount.
    if (!picked) return notDisclosed(raw);

    const currency = detectCurrency(raw) ?? 'INR';
    const indianUnit = ['l', 'lakh', 'lakhs', 'lac', 'lacs', 'lpa', 'cr', 'crore', 'crores'].includes(picked.unit);
    const monthly = PER_MONTH.test(raw);
    const yearly = PER_YEAR.test(raw) || picked.unit === 'lpa';

    if (OTHER_PERIOD.test(raw) && !monthly && !yearly) return unclear(raw, currency);
    if (monthly && yearly) return unclear(raw, currency);

    if (kind === 'stipend') {
        // A stipend must say it is monthly; "1.2L" alone could be a month or a whole internship.
        if (!monthly) return unclear(raw, currency);
    } else {
        // CTC is annual by definition in India when written in lakh/crore; otherwise require "per annum".
        if (monthly || (!yearly && !indianUnit)) return unclear(raw, currency);
    }

    const min = Math.min(picked.low, picked.high);
    const max = Math.max(picked.low, picked.high);
    return { min, max, disclosure: min === max ? 'DISCLOSED' : 'RANGE', currency, raw };
}
