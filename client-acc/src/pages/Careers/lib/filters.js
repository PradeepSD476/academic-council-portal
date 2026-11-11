// Jobs page filter state lives in the URL (shareable, survives refresh). These helpers turn
// URLSearchParams into API params and back. Defaults are left out of the URL.

export const TYPES = [
  { value: "", label: "All" },
  { value: "INTERNSHIP", label: "Internships" },
  { value: "FULL_TIME", label: "Full-time" },
];
export const WORK_MODES = [
  { value: "", label: "Any work mode" },
  { value: "ONSITE", label: "On-site" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "REMOTE", label: "Remote" },
];
export const SEASONS = [
  { value: "", label: "Any season" },
  { value: "SUMMER", label: "Summer" },
  { value: "WINTER", label: "Winter" },
];
export const DURATIONS = [
  { value: "", label: "Any length" },
  { value: "2", label: "2 months or more" },
  { value: "6", label: "6 months or more" },
];
// "My application": the student's own tracking status (only they see it).
export const MY_STATUSES = [
  { value: "", label: "Any" },
  { value: "NOT_APPLIED", label: "Not applied yet" },
  { value: "NONE", label: "Not tracked" },
  { value: "INTERESTED", label: "Interested" },
  { value: "APPLIED", label: "Applied" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "OFFER", label: "Offer" },
  { value: "REJECTED", label: "Rejected" },
];
export const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "lastSeen", label: "Recently confirmed live" },
  { value: "deadline", label: "Deadline stated, soonest first" },
];
export const PAGE_SIZE = 20;

// Keys that narrow the results (counted on the mobile "Filters (n)" button).
const FILTER_KEYS = ["type", "workMode", "location", "skills", "minStipend", "minCtc", "eligibleOnly", "postedWithin", "companyId", "season", "minDurationMonths", "myStatus"];

// URLSearchParams -> params for GET /careers/postings.
export function apiParams(search) {
  const params = { limit: PAGE_SIZE };
  for (const key of ["q", "type", "workMode", "location", "skills", "sort", "page", "season", "myStatus"]) {
    const v = search.get(key);
    if (v) params[key] = v;
  }
  // Ignore a half-typed or negative amount instead of sending a request the API rejects.
  const stipend = Number(search.get("minStipend"));
  if (Number.isInteger(stipend) && stipend > 0) params.minStipend = stipend;
  // The CTC filter is typed in LPA; the API wants rupees per year.
  const lpa = Number(search.get("minCtcLpa"));
  if (lpa > 0) params.minCtc = Math.round(lpa * 100000);
  if (search.get("includeUndisclosed") === "false") params.includeUndisclosed = "false";
  if (search.get("eligibleOnly") === "true") params.eligibleOnly = "true";
  if (search.get("showHidden") === "true") params.showHidden = "true"; // P6-T9: only the ones marked "Not for me"
  // Company filter (P6-T5): companyName is only the label shown in the picker.
  const companyId = Number(search.get("companyId"));
  if (Number.isInteger(companyId) && companyId > 0) params.companyId = companyId;
  const months = Number(search.get("minDurationMonths"));
  if (Number.isInteger(months) && months >= 1 && months <= 12) params.minDurationMonths = months;
  const days = Number(search.get("postedWithin"));
  if (Number.isInteger(days) && days >= 1 && days <= 90) params.postedWithin = days;
  return params;
}

// Sets (or clears) keys and goes back to page 1 unless the page itself changes.
export function withChanges(search, changes) {
  const next = new URLSearchParams(search);
  for (const [key, value] of Object.entries(changes)) {
    if (value === "" || value === null || value === undefined || value === false) next.delete(key);
    else next.set(key, String(value));
  }
  if (!("page" in changes)) next.delete("page");
  return next;
}

export function activeFilterCount(search) {
  return FILTER_KEYS.filter((k) => (k === "minCtc" ? search.get("minCtcLpa") : search.get(k))).length;
}

export function hasAnyFilter(search) {
  return activeFilterCount(search) > 0 || Boolean(search.get("q")) || search.get("includeUndisclosed") === "false";
}

// Clears every filter but keeps the sort.
export function cleared(search) {
  const next = new URLSearchParams();
  if (search.get("sort")) next.set("sort", search.get("sort"));
  return next;
}
