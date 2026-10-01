// Posting form <-> API values. The form keeps strings (what inputs hold); the API gets typed values.
// Honest-data rule mirrored from the server: undisclosed or unclear pay never carries a number.

export const TYPES = [
  { value: "INTERNSHIP", label: "Internship" },
  { value: "FULL_TIME", label: "Full-time" },
  { value: "UNKNOWN", label: "Not stated" },
];

export const WORK_MODES = [
  { value: "ONSITE", label: "On-site" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "REMOTE", label: "Remote" },
  { value: "UNKNOWN", label: "Not stated" },
];

export const DISCLOSURES = [
  { value: "NOT_DISCLOSED", label: "Undisclosed" },
  { value: "DISCLOSED", label: "One amount" },
  { value: "RANGE", label: "Range" },
  { value: "UNCLEAR", label: "Mentioned, unclear" },
];

export const REJECT_REASONS = [
  "Not an early-career role",
  "Location not open to India",
  "Duplicate of another posting",
  "Not a real opening / spam",
  "Closed or expired",
];

const str = (v) => (v === null || v === undefined ? "" : String(v));

export function toForm(p = {}) {
  return {
    roleTitle: str(p.roleTitle),
    type: p.type || "UNKNOWN",
    location: str(p.location),
    workMode: p.workMode || "UNKNOWN",
    ppoMentioned: p.ppoMentioned === true ? "yes" : p.ppoMentioned === false ? "no" : "",
    skills: (p.skills || []).join(", "),
    compCurrency: p.compCurrency || "INR",
    stipendDisclosure: p.stipendDisclosure || "NOT_DISCLOSED",
    stipendMin: str(p.stipendMin),
    stipendMax: str(p.stipendMax),
    ctcDisclosure: p.ctcDisclosure || "NOT_DISCLOSED",
    ctcMin: str(p.ctcMin),
    ctcMax: str(p.ctcMax),
    compensationRaw: str(p.compensationRaw),
    applyUrl: str(p.applyUrl),
    descriptionText: str(p.descriptionText),
    eligibleBranches: (p.eligibleBranches || []).join(", "),
    eligibleYears: (p.eligibleYears || []).join(", "),
    minCpi: p.minCpi === null || p.minCpi === undefined ? "" : String(Number(p.minCpi)),
    deadlineStated: p.deadlineStated ? String(p.deadlineStated).slice(0, 10) : "",
  };
}

const list = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);
const num = (s) => (s.trim() === "" ? null : Number(s.replace(/[,\s]/g, "")));

function pay(form, side) {
  const disclosure = form[`${side}Disclosure`];
  const min = num(form[`${side}Min`]);
  const max = disclosure === "DISCLOSED" ? min : num(form[`${side}Max`]);
  const hasNumbers = disclosure === "DISCLOSED" || disclosure === "RANGE";
  return {
    [`${side}Disclosure`]: disclosure,
    [`${side}Min`]: hasNumbers ? min : null,
    [`${side}Max`]: hasNumbers ? max : null,
  };
}

export function fromForm(form) {
  return {
    roleTitle: form.roleTitle.trim(),
    type: form.type,
    location: form.location.trim() || null,
    workMode: form.workMode,
    ppoMentioned: form.ppoMentioned === "" ? null : form.ppoMentioned === "yes",
    skills: list(form.skills),
    compCurrency: form.compCurrency.trim().toUpperCase() || "INR",
    ...pay(form, "stipend"),
    ...pay(form, "ctc"),
    compensationRaw: form.compensationRaw.trim() || null,
    applyUrl: form.applyUrl.trim(),
    descriptionText: form.descriptionText.trim(),
    eligibleBranches: list(form.eligibleBranches).map((b) => b.toUpperCase()),
    eligibleYears: list(form.eligibleYears).map(Number),
    minCpi: num(form.minCpi),
    deadlineStated: form.deadlineStated ? new Date(`${form.deadlineStated}T00:00:00Z`).toISOString() : null,
  };
}

// Only the fields that differ from the original posting (so the audit log stays meaningful).
export function changedFields(original, form) {
  const before = fromForm(toForm(original));
  const after = fromForm(form);
  return Object.fromEntries(Object.entries(after).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(before[k])));
}

export const formatInr = (n) => new Intl.NumberFormat("en-IN").format(n);
