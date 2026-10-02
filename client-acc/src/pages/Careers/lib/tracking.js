// P4-lite helpers: application statuses and the "New since your last visit" marker.

export const APPLICATION_STATUSES = [
  { value: "INTERESTED", label: "Interested", tone: "text-blue-700 bg-blue-50 border-blue-100" },
  { value: "APPLIED", label: "Applied", tone: "text-teal-700 bg-teal-50 border-teal-100" },
  { value: "IN_PROGRESS", label: "In progress", tone: "text-amber-700 bg-amber-50 border-amber-100" },
  { value: "OFFER", label: "Offer", tone: "text-emerald-700 bg-emerald-50 border-emerald-100" },
  { value: "REJECTED", label: "Rejected", tone: "text-slate-600 bg-slate-50 border-slate-200" },
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

export function visitBaseline(now = Date.now()) {
  try {
    const kept = sessionStorage.getItem(BASELINE);
    if (kept !== null) return kept ? Number(kept) : null;
    const previous = localStorage.getItem(LAST_VISIT);
    sessionStorage.setItem(BASELINE, previous ?? "");
    localStorage.setItem(LAST_VISIT, String(now));
    return previous ? Number(previous) : null;
  } catch {
    return null;
  }
}

export function isNewSince(posting, baseline) {
  const shown = posting.publishedAt ?? posting.firstSeenAt;
  return Boolean(baseline && shown && new Date(shown).getTime() > baseline);
}
