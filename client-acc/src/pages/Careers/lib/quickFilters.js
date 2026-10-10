// Quick filter chips above the jobs list (P6-T3, F-27). Each chip only sets URL params, so the
// result is the same as setting those filters by hand and the link stays shareable. Chips combine;
// clicking an active chip removes its params.
export const QUICK_FILTERS = [
  { id: "forMe", label: "For me", params: { eligibleOnly: "true" } },
  { id: "internships", label: "Internships", params: { type: "INTERNSHIP" } },
  { id: "remote", label: "Remote", params: { workMode: "REMOTE" } },
  { id: "week", label: "New this week", params: { postedWithin: "7" } },
];

export const isChipActive = (search, chip) => Object.entries(chip.params).every(([k, v]) => search.get(k) === v);

// The changes to pass to withChanges() for a click on the chip.
export function chipChanges(search, chip) {
  const active = isChipActive(search, chip);
  return Object.fromEntries(Object.keys(chip.params).map((k) => [k, active ? "" : chip.params[k]]));
}

// "My last filters": the filter part of the URL (not the page), remembered in this browser.
const KEY = "careers.lastFilters";
export const FILTER_PARAMS = ["q", "type", "workMode", "location", "skills", "minStipend", "minCtcLpa", "includeUndisclosed", "eligibleOnly", "postedWithin", "companyId", "companyName", "season", "minDurationMonths", "sort"];

export function filterPart(search) {
  const out = new URLSearchParams();
  for (const k of FILTER_PARAMS) if (search.get(k)) out.set(k, search.get(k));
  return out.toString();
}

export function rememberFilters(search) {
  const part = filterPart(search);
  if (!part) return;
  try {
    localStorage.setItem(KEY, part);
  } catch {
    // Not remembered in this browser; the chip just doesn't show.
  }
}

export function lastFilters() {
  try {
    return localStorage.getItem(KEY) || null;
  } catch {
    return null;
  }
}
