import { DateTime } from 'luxon';

export const headerKey = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
export const splitCell = (value, separators) => separators.reduce((items, sep) => items.flatMap((x) => x.split(sep)), [String(value ?? '')]).map((x) => x.trim()).filter(Boolean);
export function normaliseRoll(value, config) {
    let roll = String(value ?? '');
    if (config.roll.trim) roll = roll.trim();
    if (config.roll.uppercase) roll = roll.toUpperCase();
    return roll;
}
export const validRoll = (roll, config) => new RegExp(config.roll.pattern).test(roll);
export const normaliseRoom = (value) => String(value ?? '').trim().replace(/^(\d+)\.0+$/, '$1');
export function normaliseUnit(value, config) {
    const codes = String(value ?? '').split(config.separators.unit).map((s) => s.trim().toUpperCase());
    if (!codes.length || codes.some((s) => !new RegExp(config.coursePattern).test(s))) return null;
    return [...new Set(codes)].sort().join(config.separators.unit);
}
export function parseDate(value, config, context = '') {
    let date;
    // Excel dates represent calendar fields, not instants in the server's local timezone.
    if (value instanceof Date) date = DateTime.fromObject({ year: value.getUTCFullYear(), month: value.getUTCMonth() + 1, day: value.getUTCDate() }, { zone: config.timezone });
    else if (typeof value === 'number') date = DateTime.fromISO('1899-12-30', { zone: config.timezone }).plus({ days: Math.floor(value) });
    else for (const format of config.dateFormats) {
        const candidate = DateTime.fromFormat(String(value ?? '').trim(), format, { zone: config.timezone, locale: 'en' });
        if (candidate.isValid) { date = candidate; break; }
    }
    if (!date?.isValid) throw new Error(`Cannot parse date '${String(value)}' ${context}`.trim());
    return date.toISODate();
}
export function targetDate(value, timezone) {
    if (value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !DateTime.fromISO(value, { zone: timezone }).isValid)) throw new Error('Date must be a valid YYYY-MM-DD date');
    return value || DateTime.now().setZone(timezone).toISODate();
}
