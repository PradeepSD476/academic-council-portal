// Feature flags and limits (AppSetting). Showing the feature to students asks for confirmation.
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../api/careersApi";
import { Modal, cardClass, inputClass, outlineButton, primaryButton } from "./components/ui";

const TOGGLES = [
  ["careers.visibleToStudents", "Show Jobs & Internships to students", "Off: students get a “not available” page; admins still see everything."],
  ["careers.ingestionEnabled", "Fetch job boards", "The scheduled fetches and “Fetch now” do nothing while this is off."],
  ["careers.llmEnabled", "Automatic extraction for student links", "Uses the configured model. Off: links wait in the queue."],
  ["careers.llmPaidTier", "Gemini key is billed", "Only for Gemini. Turns on the monthly budget cap."],
];
const NUMBERS = [
  ["careers.confidenceThreshold", "Flag below confidence", 0.05],
  ["careers.fuzzyThreshold", "Company name match threshold", 0.01],
  ["careers.submissionDailyLimit", "Links per student per day", 1],
  ["careers.llmDailyRequestLimit", "Gemini calls per day", 1],
  ["careers.llmMonthlyBudgetUsd", "Monthly LLM budget (USD)", 1],
];

export default function FlagsCard({ onChanged }) {
  const [values, setValues] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [drafts, setDrafts] = useState({});

  const load = useCallback(() => careersAdminApi.getSettings()
    .then((rows) => setValues(Object.fromEntries(rows.map((r) => [r.key, r.value]))))
    .catch((err) => toast.error(errorMessage(err, "Could not load settings."))), []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (body) => {
    try {
      await careersAdminApi.updateSettings(body);
      toast.success("Saved.");
      setDrafts({});
      await load();
      onChanged?.();
    } catch (err) {
      const details = err?.response?.data?.details;
      toast.error(Array.isArray(details) ? details.map((d) => `${d.key}: ${d.issue}`).join(" ") : errorMessage(err));
    }
  };

  const toggle = (key) => {
    const next = !values[key];
    if (key === "careers.visibleToStudents") setConfirm(next);
    else save({ [key]: next });
  };

  if (!values) return null;
  // The dialog is rendered outside the card: the card's backdrop blur would otherwise trap the
  // fixed-position overlay inside the card.
  return (
    <>
      <div className={`${cardClass} p-5 space-y-5`}>
        <h2 className="text-sm font-bold text-[var(--color-primary)]">Feature flags</h2>
        <ul className="space-y-3">
          {TOGGLES.map(([key, label, help]) => (
            <li key={key} className="flex items-start gap-3">
              <button type="button" role="switch" aria-checked={Boolean(values[key])} aria-label={label} onClick={() => toggle(key)}
                className={`mt-0.5 w-10 h-6 shrink-0 rounded-full transition cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] ${values[key] ? "bg-emerald-500" : "bg-slate-300"}`}>
                <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${values[key] ? "translate-x-[18px]" : "translate-x-0.5"}`} />
              </button>
              <span>
                <span className="block text-sm font-semibold text-slate-800">{label}</span>
                <span className="block text-xs text-slate-500">{help}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {NUMBERS.map(([key, label, step]) => (
            <div key={key}>
              <label htmlFor={key} className="text-xs font-semibold text-slate-600">{label}</label>
              <input id={key} type="number" step={step} className={`${inputClass} mt-1`} value={drafts[key] ?? String(values[key])}
                onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))} />
            </div>
          ))}
        </div>
        {Object.keys(drafts).length > 0 && (
          <div className="flex justify-end gap-2">
            <button type="button" className={outlineButton} onClick={() => setDrafts({})}>Discard</button>
            <button type="button" className={primaryButton} onClick={() => save(Object.fromEntries(Object.entries(drafts).map(([k, v]) => [k, Number(v)])))}>Save limits</button>
          </div>
        )}
      </div>

        {confirm !== null && (
          <Modal title={confirm ? "Show jobs to students?" : "Hide jobs from students?"} onClose={() => setConfirm(null)}
            footer={(
              <>
                <button type="button" className={outlineButton} onClick={() => setConfirm(null)}>Cancel</button>
                <button type="button" className={primaryButton} onClick={() => { save({ "careers.visibleToStudents": confirm }); setConfirm(null); }}>{confirm ? "Show to students" : "Hide from students"}</button>
              </>
            )}>
            <p className="text-sm text-slate-600">
              {confirm
                ? "Every logged-in student will see Jobs & Internships with all LIVE postings. Make sure the review queue is in good shape."
                : "Students will no longer see Jobs & Internships. Nothing is deleted; ingestion and review keep working."}
            </p>
          </Modal>
        )}
    </>
  );
}
