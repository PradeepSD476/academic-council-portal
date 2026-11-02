// India Standard Time day / month boundaries as UTC instants (IST is UTC+5:30, no daylight saving).
// Pure; used by the LLM limits and the deadline checks.
const IST_OFFSET_MS = 330 * 60 * 1000;

export function istDayStart(now = new Date()) {
    const ist = new Date(now.getTime() + IST_OFFSET_MS);
    return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - IST_OFFSET_MS);
}

export function istMonthStart(now = new Date()) {
    const ist = new Date(now.getTime() + IST_OFFSET_MS);
    return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), 1) - IST_OFFSET_MS);
}
