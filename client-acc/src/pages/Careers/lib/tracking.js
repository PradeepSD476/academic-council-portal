// P4-lite helpers: application statuses and the "New since your last visit" marker.

// tone = the pill on the button and cards; dot / row = the menu (full class names so Tailwind sees them).
export const APPLICATION_STATUSES = [
  { value: "INTERESTED", label: "Interested", hint: "Thinking about applying", tone: "text-blue-700 bg-blue-50 border-blue-100", dot: "bg-blue-500", row: "bg-blue-50" },
  { value: "APPLIED", label: "Applied", hint: "Application sent", tone: "text-teal-700 bg-teal-50 border-teal-100", dot: "bg-teal-500", row: "bg-teal-50" },
  { value: "IN_PROGRESS", label: "In progress", hint: "Tests or interviews going on", tone: "text-amber-700 bg-amber-50 border-amber-100", dot: "bg-amber-500", row: "bg-amber-50" },
  { value: "OFFER", label: "Offer", hint: "You received an offer", tone: "text-emerald-700 bg-emerald-50 border-emerald-100", dot: "bg-emerald-500", row: "bg-emerald-50" },
  { value: "REJECTED", label: "Rejected", hint: "Not selected this time", tone: "text-slate-600 bg-slate-50 border-slate-200", dot: "bg-slate-400", row: "bg-slate-100" },
];

export const statusMeta = (value) => APPLICATION_STATUSES.find((s) => s.value === value) ?? null;

// One click moves along Interested → Applied → In progress. From there (and from Offer / Rejected)
// the outcome is picked from the menu, so a click never sets Rejected by accident.
const NEXT = { "": "INTERESTED", INTERESTED: "APPLIED", APPLIED: "IN_PROGRESS" };
export const nextStatus = (value) => NEXT[value ?? ""] ?? null;

// "New" = published after the student's previous visit to the jobs page. The previous visit is read
// once per browser session (kept in sessionStorage) so opening a posting and coming back doesn't
// clear the badges. Storage can be missing or blocked: then nothing is marked new.
const LAST_VISIT = "careers.lastVisit";
const BASELINE = "careers.visitBaseline";
// Fired when the jobs page records a visit, so the sidebar count clears at once (P6-T2).
export const LAST_VISIT_EVENT = "careers:lastVisit";

export function visitBaseline(now = Date.now()) {
  try {
    const kept = sessionStorage.getItem(BASELINE);
    if (kept !== null) return kept ? Number(kept) : null;
    const previous = localStorage.getItem(LAST_VISIT);
    sessionStorage.setItem(BASELINE, previous ?? "");
    localStorage.setItem(LAST_VISIT, String(now));
    window.dispatchEvent(new Event(LAST_VISIT_EVENT));
    return previous ? Number(previous) : null;
  } catch {
    return null;
  }
}

export function isNewSince(posting, baseline) {
  const shown = posting.publishedAt ?? posting.firstSeenAt;
  return Boolean(baseline && shown && new Date(shown).getTime() > baseline);
}

// The latest visit to the jobs page (ms), for the sidebar's "New for you" count (P6-T2). Unlike
// visitBaseline this is the newest value, so the count clears as soon as the jobs page is opened.
export function lastVisitAt() {
  try {
    const v = Number(localStorage.getItem(LAST_VISIT));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}
