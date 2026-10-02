// Text helpers for the student jobs pages. Honest data: unknown pay is "Undisclosed", never ₹0;
// freshness only states what was observed; no countdowns.

const inr = new Intl.NumberFormat("en-IN");
const DAY = 24 * 60 * 60 * 1000;

// 50000 -> "₹50,000"; non-INR amounts keep their own currency, no conversion.
export function money(amount, currency = "INR") {
  if (currency === "INR") return `₹${inr.format(amount)}`;
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${inr.format(amount)}`;
  }
}

// 1200000 -> "12 LPA", 1250000 -> "12.5 LPA"
const lpa = (amount) => `${Number((amount / 100000).toFixed(2))}`;

function range(min, max, fmt) {
  if (min != null && max != null && min !== max) return `${fmt(min)}–${fmt(max).replace(/^[^\d]+/, "")}`;
  return fmt(max ?? min);
}

// Which pay a posting shows: stipend for internships, CTC for full-time; for an unknown type,
// whichever is disclosed (stipend first).
function payKind(p) {
  if (p.type === "FULL_TIME") return "ctc";
  if (p.type === "INTERNSHIP") return "stipend";
  return ["DISCLOSED", "RANGE"].includes(p.ctcDisclosure) && !["DISCLOSED", "RANGE"].includes(p.stipendDisclosure) ? "ctc" : "stipend";
}

// { tone: 'value' | 'undisclosed' | 'unclear', text }
export function compensation(p) {
  const kind = payKind(p);
  const disclosure = p[`${kind}Disclosure`];
  const min = p[`${kind}Min`];
  const max = p[`${kind}Max`];
  if (disclosure === "UNCLEAR") return { tone: "unclear", text: "Pay mentioned: see details" };
  if (!["DISCLOSED", "RANGE"].includes(disclosure) || (min == null && max == null)) return { tone: "undisclosed", text: "Undisclosed" };
  if (kind === "stipend") return { tone: "value", text: `${range(min, max, (n) => money(n, p.compCurrency))} /mo` };
  if (p.compCurrency === "INR") return { tone: "value", text: `₹${range(min, max, lpa)} LPA` };
  return { tone: "value", text: `${range(min, max, (n) => money(n, p.compCurrency))} /yr` };
}

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Calendar days, so 11 pm yesterday is "yesterday", not "today".
// "today", "yesterday", "6 days ago", "3 weeks ago", "2 months ago"
export function daysAgo(date, now = new Date()) {
  const days = Math.round((startOfDay(now) - startOfDay(new Date(date))) / DAY);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

// The freshness line: { text, tone: 'fresh' | 'ok' | 'stale' }.
export function freshness(p, now = new Date()) {
  const confirmedDays = (now - new Date(p.lastSeenLiveAt)) / DAY;
  const confirmed = `confirmed live ${daysAgo(p.lastSeenLiveAt, now)}`;
  return {
    text: `First seen ${daysAgo(p.firstSeenAt, now)} · ${confirmed}`,
    tone: confirmedDays <= 1 ? "fresh" : confirmedDays > 3 ? "stale" : "ok",
  };
}

const cpi = (n) => Number(n).toFixed(1);
const years = (list) => list.map((y) => ["1st", "2nd", "3rd", "4th", "5th"][y - 1] ?? `${y}th`).join(", ");

// The eligibility badge for a card: { tone, text }.
export function eligibilityText(e) {
  switch (e?.status) {
    case "ELIGIBLE":
      return { tone: "eligible", text: "Eligible" };
    case "NEEDS_CPI":
      return { tone: "needsCpi", text: `CPI ≥ ${cpi(e.minCpi)} · add your CPI` };
    case "UNKNOWN":
      return { tone: "unknown", text: "Has branch/year limits · add your roll number" };
    case "NOT_ELIGIBLE": {
      const parts = e.reasons.map((r) => {
        if (r.field === "branch") return `${r.allowed.join(", ")} only`;
        if (r.field === "year") return `${years(r.allowed)} year only`;
        return `CPI ≥ ${cpi(r.min)}`;
      });
      return { tone: "notEligible", text: `Not eligible: ${parts.join(" · ")}` };
    }
    default:
      return { tone: "unknown", text: "Eligibility not stated" };
  }
}

// "1 opening", "2 openings"
export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// "12 Oct 2026". A deadline is a calendar date; show it in UTC so it never shifts a day.
export const formatDate = (date, { utc = false } = {}) =>
  new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", ...(utc ? { timeZone: "UTC" } : {}) });

// How the details were collected (Design §9: label automated data in words).
export function collectedBy(tier) {
  if (tier === "LLM_FAST" || tier === "LLM_STRONG") return "Details extracted automatically and reviewed by ACC.";
  if (tier === "MANUAL") return "Details entered by ACC.";
  return "Details taken from the company's job listing and reviewed by ACC.";
}

// A student's shared link, in plain words: { label, tone, detail? }.
export function submissionStatus(s) {
  if (s.postingLive) return { label: "Live on the portal", tone: "live" };
  switch (s.status) {
    case "RECEIVED":
    case "PROCESSING":
    case "EXTRACTING":
      return { label: "Being processed", tone: "info" };
    case "PENDING_REVIEW":
      return { label: "Waiting for ACC review", tone: "info" };
    case "DUPLICATE":
      return { label: "Already listed", tone: "neutral", detail: "This job was already on the portal or in review." };
    case "STORED_ONLY":
      return { label: "Saved for ACC", tone: "neutral", detail: "This site can't be read automatically; an admin will add the details." };
    case "FAILED":
      return { label: "Couldn't be read", tone: "failed", detail: s.error };
    default:
      return { label: s.status, tone: "neutral" };
  }
}

// Only http(s) URLs become links (never javascript: or data:).
export function safeHref(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}
