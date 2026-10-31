// The editable posting fields, shared by the review editor and manual entry.
import { AlertTriangle } from "lucide-react";
import UncertainField, { FieldGroup } from "./UncertainField";
import { DISCLOSURES, TYPES, WORK_MODES } from "./postingForm";
import { inputClass } from "./ui";

// What each flag is called in the summary, and the field it jumps to.
const FLAGS = {
  company: { label: "Company", ids: ["pe-company", "mp-company"] },
  roleTitle: { label: "Role title", ids: ["pf-title"] },
  type: { label: "Type", ids: ["pf-type"] },
  location: { label: "Location", ids: ["pf-location"] },
  compensation: { label: "Pay", ids: ["pf-stipend-disclosure"] },
  skills: { label: "Skills", ids: ["pf-skills"] },
  eligibility: { label: "Eligibility", ids: ["pf-branches"] },
  applyUrl: { label: "Apply link", ids: ["pf-url"] },
  deadline: { label: "Deadline", ids: ["pf-deadline"] },
  season: { label: "Internship timing", ids: ["pf-season"] },
  description: { label: "Description", ids: ["pf-desc"] },
  relevance: { label: "Whether it suits IIT Patna students", ids: [] },
};

function jumpTo(ids) {
  for (const id of ids) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (!label) continue;
    label.scrollIntoView({ behavior: "smooth", block: "center" });
    document.getElementById(id)?.focus({ preventScroll: true });
    return;
  }
}

// One line above the form, instead of a box around every field.
function UnsureSummary({ uncertain, confidence }) {
  const flags = [...new Set(uncertain)].filter((k) => FLAGS[k]);
  if (!flags.length) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
      <p>
        <span className="font-semibold">Check {flags.length === 1 ? "this" : `these ${flags.length}`} first</span>
        {confidence !== null && confidence !== undefined && <span className="text-amber-700"> (extractor confidence {confidence.toFixed(2)})</span>}:{" "}
        {flags.map((k, i) => (
          <span key={k}>
            {i > 0 && " · "}
            {FLAGS[k].ids.length ? (
              <button type="button" onClick={() => jumpTo(FLAGS[k].ids)}
                className="font-semibold underline decoration-amber-300 underline-offset-2 hover:decoration-amber-700 cursor-pointer">
                {FLAGS[k].label}
              </button>
            ) : <span className="font-semibold">{FLAGS[k].label}</span>}
          </span>
        ))}
      </p>
    </div>
  );
}

function Select({ id, value, onChange, options }) {
  return (
    <select id={id} className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function PayFields({ side, label, form, set }) {
  const disclosure = form[`${side}Disclosure`];
  const id = (s) => `pf-${side}-${s}`;
  return (
    <UncertainField id={id("disclosure")} label={label}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Select id={id("disclosure")} value={disclosure} onChange={(v) => set(`${side}Disclosure`, v)} options={DISCLOSURES} />
        {(disclosure === "DISCLOSED" || disclosure === "RANGE") && (
          <>
            <label htmlFor={id("min")} className="sr-only">{label} {disclosure === "RANGE" ? "minimum" : "amount"}</label>
            <input id={id("min")} inputMode="numeric" className={inputClass} placeholder={disclosure === "RANGE" ? "Min" : "Amount"}
              value={form[`${side}Min`]} onChange={(e) => set(`${side}Min`, e.target.value)} />
          </>
        )}
        {disclosure === "RANGE" && (
          <>
            <label htmlFor={id("max")} className="sr-only">{label} maximum</label>
            <input id={id("max")} inputMode="numeric" className={inputClass} placeholder="Max" value={form[`${side}Max`]} onChange={(e) => set(`${side}Max`, e.target.value)} />
          </>
        )}
      </div>
    </UncertainField>
  );
}

// form: see postingForm.toForm; set(field, value); uncertain: string[] from the posting;
// linkCheck: applyLinkCheck() for the current apply link, or null.
export default function PostingFields({ form, set, uncertain = [], confidence = null, companySlot, linkCheck = null }) {
  const unsure = (key) => uncertain.includes(key);
  return (
    <div className="space-y-5">
      <UnsureSummary uncertain={uncertain} confidence={confidence} />
      {companySlot}
      <UncertainField id="pf-title" label="Role title" uncertain={unsure("roleTitle")} confidence={confidence}>
        <input id="pf-title" className={inputClass} value={form.roleTitle} onChange={(e) => set("roleTitle", e.target.value)} required maxLength={200} />
      </UncertainField>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <UncertainField id="pf-type" label="Type" uncertain={unsure("type")} confidence={confidence}>
          <Select id="pf-type" value={form.type} onChange={(v) => set("type", v)} options={TYPES} />
        </UncertainField>
        <UncertainField id="pf-mode" label="Work mode">
          <Select id="pf-mode" value={form.workMode} onChange={(v) => set("workMode", v)} options={WORK_MODES} />
        </UncertainField>
        <UncertainField id="pf-ppo" label="PPO mentioned">
          <Select id="pf-ppo" value={form.ppoMentioned} onChange={(v) => set("ppoMentioned", v)}
            options={[{ value: "", label: "Not stated" }, { value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
        </UncertainField>
      </div>

      <UncertainField id="pf-location" label="Location" uncertain={unsure("location")} confidence={confidence} hint="As the source states it, e.g. “Bengaluru; Remote - India”. Leave empty if not stated.">
        <input id="pf-location" className={inputClass} value={form.location} onChange={(e) => set("location", e.target.value)} maxLength={300} />
      </UncertainField>

      <FieldGroup title="Pay" uncertain={unsure("compensation")} confidence={confidence} className="space-y-4">
        <PayFields side="stipend" label="Stipend (per month)" form={form} set={set} />
        <PayFields side="ctc" label="CTC (per year)" form={form} set={set} />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <UncertainField id="pf-currency" label="Currency">
            <input id="pf-currency" className={inputClass} value={form.compCurrency} maxLength={3} onChange={(e) => set("compCurrency", e.target.value)} />
          </UncertainField>
          <UncertainField id="pf-raw" label="Pay wording from the source" className="sm:col-span-3" hint="Required when pay is “Mentioned, unclear”. Shown to students verbatim.">
            <input id="pf-raw" className={inputClass} value={form.compensationRaw} onChange={(e) => set("compensationRaw", e.target.value)} maxLength={500} />
          </UncertainField>
        </div>
      </FieldGroup>

      <UncertainField id="pf-skills" label="Skills" uncertain={unsure("skills")} confidence={confidence} hint="Comma separated.">
        <input id="pf-skills" className={inputClass} value={form.skills} onChange={(e) => set("skills", e.target.value)} />
      </UncertainField>

      <FieldGroup title="Eligibility" uncertain={unsure("eligibility")} confidence={confidence} className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <UncertainField id="pf-branches" label="Branches" className="sm:col-span-2" hint="Roll-number codes, e.g. CS, EE. Empty = not stated.">
          <input id="pf-branches" className={inputClass} value={form.eligibleBranches} onChange={(e) => set("eligibleBranches", e.target.value)} />
        </UncertainField>
        <UncertainField id="pf-years" label="Years" hint="e.g. 3, 4">
          <input id="pf-years" className={inputClass} value={form.eligibleYears} onChange={(e) => set("eligibleYears", e.target.value)} />
        </UncertainField>
        <UncertainField id="pf-grad" label="Graduating in" hint="Batches, e.g. 2027">
          <input id="pf-grad" className={inputClass} value={form.eligibleGradYears} onChange={(e) => set("eligibleGradYears", e.target.value)} />
        </UncertainField>
        <UncertainField id="pf-cpi" label="Min CPI">
          <input id="pf-cpi" type="number" step="0.01" min="0" max="10" className={inputClass} value={form.minCpi} onChange={(e) => set("minCpi", e.target.value)} />
        </UncertainField>
      </FieldGroup>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <UncertainField id="pf-url" label="Apply link" className="sm:col-span-2" uncertain={unsure("applyUrl")} confidence={confidence}>
          <input id="pf-url" type="url" className={inputClass} value={form.applyUrl} onChange={(e) => set("applyUrl", e.target.value)} required />
          {linkCheck && (
            <p className={`mt-1 text-[11px] ${linkCheck.warn ? "font-semibold text-red-600" : "text-slate-500"}`}>
              Goes to {linkCheck.site}
              {linkCheck.warn && ": not the company's website or a known job board. Open it and check before publishing."}
            </p>
          )}
        </UncertainField>
        <UncertainField id="pf-deadline" label="Deadline stated by source" uncertain={unsure("deadline")} confidence={confidence} hint="Only if the source publishes one.">
          <input id="pf-deadline" type="date" className={inputClass} value={form.deadlineStated} onChange={(e) => set("deadlineStated", e.target.value)} />
        </UncertainField>
      </div>

      {form.type !== "FULL_TIME" && (
        <FieldGroup title="Internship timing" uncertain={unsure("season")} confidence={confidence} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <UncertainField id="pf-season" label="Season" hint="Only if the source says summer or winter.">
            <select id="pf-season" className={inputClass} value={form.season} onChange={(e) => set("season", e.target.value)}>
              <option value="">Not stated</option>
              <option value="SUMMER">Summer</option>
              <option value="WINTER">Winter</option>
            </select>
          </UncertainField>
          <UncertainField id="pf-start" label="Starts" hint="Stated start month.">
            <input id="pf-start" type="month" className={inputClass} value={form.startMonth} onChange={(e) => set("startMonth", e.target.value)} />
          </UncertainField>
          <UncertainField id="pf-duration" label="Length (months)">
            <input id="pf-duration" type="number" min="1" max="12" className={inputClass} value={form.durationMonths} onChange={(e) => set("durationMonths", e.target.value)} />
          </UncertainField>
        </FieldGroup>
      )}

      <UncertainField id="pf-desc" label="Description" uncertain={unsure("description")} confidence={confidence}>
        <textarea id="pf-desc" rows={8} className={`${inputClass} font-mono text-xs`} value={form.descriptionText} onChange={(e) => set("descriptionText", e.target.value)} required />
      </UncertainField>
    </div>
  );
}
