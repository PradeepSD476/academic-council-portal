import { useMemo } from "react";
import { SlidersHorizontal } from "lucide-react";
import DraftInput from "./DraftInput";
import { TYPES, WORK_MODES, SORTS, hasAnyFilter } from "../lib/filters";

const label = "block text-xs font-semibold text-slate-600 mb-1.5";
const group = "text-[10px] font-bold uppercase tracking-wider text-slate-500";
const select = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-[var(--color-primary)] bg-sky-50/50 focus:outline-none focus:border-[var(--color-secondary)] transition cursor-pointer";

// search: URLSearchParams; onChange({ key: value }); meta: the list response's meta (for counts).
export default function JobFilters({ search, onChange, meta, onClear }) {
  const get = (key) => search.get(key) ?? "";
  const type = get("type");
  // One stable handler per text field, so a re-render doesn't restart the input's commit timer.
  const commit = useMemo(
    () => Object.fromEntries(["location", "skills", "minStipend", "minCtcLpa"].map((k) => [k, (v) => onChange({ [k]: v.trim() })])),
    [onChange],
  );
  const includeUndisclosed = search.get("includeUndisclosed") !== "false";
  const eligibleOnly = search.get("eligibleOnly") === "true";
  const payFilter = Boolean(get("minStipend") || get("minCtcLpa"));

  return (
    <section aria-labelledby="filters-title" className="p-5 rounded-2xl border border-slate-200 bg-white/95 shadow-xs space-y-5">
      <div className="flex items-center justify-between">
        <h2 id="filters-title" className="flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">
          <SlidersHorizontal size={16} className="text-[var(--color-secondary)]" aria-hidden="true" /> Filters
        </h2>
        {hasAnyFilter(search) && (
          <button type="button" onClick={onClear} className="text-xs font-semibold text-[var(--color-secondary)] hover:underline cursor-pointer">
            Clear all
          </button>
        )}
      </div>

      <fieldset>
        <legend className={`${group} mb-2`}>Type</legend>
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((t) => (
            <button
              key={t.value || "all"}
              type="button"
              aria-pressed={type === t.value}
              onClick={() => onChange({ type: t.value, ...(t.value === "INTERNSHIP" ? { minCtcLpa: "" } : t.value === "FULL_TIME" ? { minStipend: "" } : {}) })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${type === t.value
                ? "bg-[var(--color-secondary-light)] border-blue-200 text-[var(--color-secondary)]"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="f-workmode" className={label}>Work mode</label>
        <select id="f-workmode" value={get("workMode")} onChange={(e) => onChange({ workMode: e.target.value })} className={select}>
          {WORK_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="f-location" className={label}>Location</label>
        <DraftInput id="f-location" value={get("location")} onCommit={commit.location} placeholder="e.g. Bengaluru, Remote" maxLength={60} />
      </div>

      <div>
        <label htmlFor="f-skills" className={label}>Skills</label>
        <DraftInput id="f-skills" value={get("skills")} onCommit={commit.skills} placeholder="e.g. React, Python" maxLength={300} />
        <p className="mt-1 text-[11px] text-slate-500">Comma-separated. Shows postings with any of them.</p>
      </div>

      <fieldset className="space-y-3">
        <legend className={`${group} mb-2`}>Pay</legend>
        {type !== "FULL_TIME" && (
          <div>
            <label htmlFor="f-stipend" className={label}>Minimum stipend (₹ per month)</label>
            <DraftInput id="f-stipend" type="number" inputMode="numeric" min="0" step="1000" value={get("minStipend")} onCommit={commit.minStipend} placeholder="e.g. 20000" />
          </div>
        )}
        {type !== "INTERNSHIP" && (
          <div>
            <label htmlFor="f-ctc" className={label}>Minimum CTC (lakh per year)</label>
            <DraftInput id="f-ctc" type="number" inputMode="decimal" min="0" step="0.5" value={get("minCtcLpa")} onCommit={commit.minCtcLpa} placeholder="e.g. 12" />
          </div>
        )}
        <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
          <input type="checkbox" checked={includeUndisclosed} onChange={(e) => onChange({ includeUndisclosed: e.target.checked ? "" : "false" })} className="mt-0.5 accent-[var(--color-secondary)]" />
          <span>
            Include postings with undisclosed pay
            {payFilter && includeUndisclosed && meta && <span className="block text-slate-500">{meta.undisclosedIncluded} included</span>}
          </span>
        </label>
        {/* Most boards publish no pay, so a pay filter alone mostly matches undisclosed postings (B-21). */}
        {payFilter && <p className="text-[11px] text-slate-500">Most company job boards don’t publish pay, so most openings are “Undisclosed”.</p>}
      </fieldset>

      <fieldset>
        <legend className={`${group} mb-2`}>Eligibility</legend>
        <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
          <input type="checkbox" checked={eligibleOnly} onChange={(e) => onChange({ eligibleOnly: e.target.checked ? "true" : "" })} className="mt-0.5 accent-[var(--color-secondary)]" />
          <span>
            Eligible for me
            {eligibleOnly && meta?.eligibility?.applied && <span className="block text-slate-500">{meta.hiddenByEligibility} hidden</span>}
          </span>
        </label>
      </fieldset>

      <div>
        <label htmlFor="f-sort" className={label}>Sort</label>
        <select id="f-sort" value={get("sort") || "newest"} onChange={(e) => onChange({ sort: e.target.value === "newest" ? "" : e.target.value })} className={select}>
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
    </section>
  );
}
