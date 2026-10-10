// Job alerts (P7-T1, F-19). An alert stores the API form of the jobs-page filters (what apiParams
// sends, minus paging, sort, "new this week" and "show hidden"), plus the company label.
import { apiParams } from "./filters";

const KEEP = ["q", "type", "workMode", "location", "skills", "companyId", "minStipend", "minCtc", "includeUndisclosed", "eligibleOnly"];

export function alertFilters(search) {
  const params = apiParams(search);
  const out = {};
  for (const k of KEEP) if (params[k] !== undefined) out[k] = String(params[k]);
  if (out.companyId && search.get("companyName")) out.companyName = search.get("companyName");
  return out;
}

// Back to jobs-page URL params ("Open this search").
export function alertSearch(filters) {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(filters ?? {})) {
    if (k === "minCtc") out.set("minCtcLpa", String(Number(v) / 100000));
    else out.set(k, String(v));
  }
  return out.toString();
}

const TYPE = { INTERNSHIP: "Internships", FULL_TIME: "Full-time" };
const MODE = { ONSITE: "On-site", HYBRID: "Hybrid", REMOTE: "Remote" };

// Same wording as the server's filterSummary.
export function alertSummary(f = {}) {
  const parts = [];
  if (f.q) parts.push(`“${f.q}”`);
  if (f.type) parts.push(TYPE[f.type] ?? f.type);
  if (f.workMode) parts.push(MODE[f.workMode] ?? f.workMode);
  if (f.location) parts.push(f.location);
  if (f.companyId) parts.push(f.companyName || `Company #${f.companyId}`);
  if (f.skills) parts.push(`Skills: ${f.skills}`);
  if (f.minStipend) parts.push(`Stipend ≥ ₹${f.minStipend}/month`);
  if (f.minCtc) parts.push(`CTC ≥ ₹${f.minCtc}/year`);
  if (f.eligibleOnly === "true") parts.push("Eligible for me");
  return parts.length ? parts.join(" · ") : "All new openings";
}

// A default name: the summary, shortened to the 60-character limit.
export const defaultAlertName = (filters) => {
  const s = alertSummary(filters);
  return s.length > 60 ? `${s.slice(0, 57)}…` : s;
};
