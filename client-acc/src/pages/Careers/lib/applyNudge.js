// "Did you apply?" nudge (P6-T4, F-26). Clicking Apply on a posting remembers the time in this
// browser only; the next time the student opens that posting or Saved, they are asked whether to
// mark it as Applied. Nothing reaches the server until they click. Storage can be missing or
// blocked: then there is simply no nudge.
const KEY = "careers.applyClicks";
const MAX_ENTRIES = 200;
// Statuses that already answer the question.
const ANSWERED = new Set(["APPLIED", "IN_PROGRESS", "OFFER", "REJECTED"]);

function read() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function write(clicks) {
  try {
    // Keep the newest entries only.
    const kept = Object.entries(clicks).sort((a, b) => b[1].at - a[1].at).slice(0, MAX_ENTRIES);
    localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(kept)));
  } catch {
    // Not remembered; harmless.
  }
}

// A new click asks again, even if an earlier nudge for the posting was dismissed.
export function recordApplyClick(postingId, now = Date.now()) {
  write({ ...read(), [postingId]: { at: now } });
}

// The time of the remembered click when the nudge should show, else null.
export function applyNudgeAt(postingId, applicationStatus) {
  const entry = read()[postingId];
  if (!entry || entry.dismissed || !Number.isFinite(entry.at) || ANSWERED.has(applicationStatus)) return null;
  return entry.at;
}

export function dismissApplyNudge(postingId) {
  const clicks = read();
  if (clicks[postingId]) write({ ...clicks, [postingId]: { ...clicks[postingId], dismissed: true } });
}

export function forgetApplyClick(postingId) {
  const clicks = read();
  delete clicks[postingId];
  write(clicks);
}
