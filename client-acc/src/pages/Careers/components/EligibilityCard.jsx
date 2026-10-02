import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import toast from "react-hot-toast";
import { careersApi, errorMessage } from "../../../api/careersApi";

const YEAR_NAMES = ["1st", "2nd", "3rd", "4th", "5th"];
const label = "text-[10px] font-bold uppercase tracking-wider text-slate-500";

// Branch and year come from the roll number (read-only); CPI is optional and self-reported.
// onChange() runs after the CPI is saved or cleared, so the list can refresh its eligibility.
export default function EligibilityCard({ onChange }) {
  const [profile, setProfile] = useState(null);
  const [cpi, setCpi] = useState("");
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    careersApi.getEligibility()
      .then((p) => { if (alive) { setProfile(p); setCpi(p.cpi ?? ""); } })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);

  const save = async (value) => {
    setSaving(true);
    try {
      const res = await careersApi.updateCpi(value);
      setProfile(res.data);
      setCpi(res.data.cpi ?? "");
      toast.success(res.message);
      onChange?.();
    } catch (err) {
      toast.error(errorMessage(err, "Could not save your CPI."));
    } finally {
      setSaving(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    const n = Number(cpi);
    if (cpi === "" || Number.isNaN(n) || n < 0 || n > 10) {
      toast.error("Enter a CPI between 0 and 10.");
      return;
    }
    save(Math.round(n * 100) / 100);
  };

  if (failed) return null;
  if (!profile) return <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" aria-hidden="true" />;

  const unchanged = String(profile.cpi ?? "") === String(cpi);
  return (
    <section aria-labelledby="eligibility-title" className="p-5 rounded-2xl border border-slate-200 bg-white/95 shadow-xs space-y-3">
      <h2 id="eligibility-title" className="flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">
        <GraduationCap size={16} className="text-[var(--color-secondary)]" aria-hidden="true" /> Your eligibility
      </h2>

      {profile.hasRollNumber ? (
        <dl className="grid grid-cols-2 gap-2">
          <div>
            <dt className={label}>Branch</dt>
            <dd className="text-sm font-semibold text-slate-700">{profile.branchName}</dd>
          </div>
          <div>
            <dt className={label}>Year</dt>
            <dd className="text-sm font-semibold text-slate-700">{YEAR_NAMES[profile.academicYear - 1] ?? profile.academicYear} year</dd>
          </div>
        </dl>
      ) : (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Add your roll number in your profile to use "Eligible for me".
        </p>
      )}

      <form onSubmit={submit} className="space-y-2">
        <label htmlFor="cpi-input" className="block text-xs font-semibold text-slate-600">CPI (optional)</label>
        <div className="flex gap-2">
          <input
            id="cpi-input"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            max="10"
            value={cpi}
            onChange={(e) => setCpi(e.target.value)}
            placeholder="e.g. 8.25"
            className="min-w-0 flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm text-[var(--color-primary)] placeholder-slate-400 bg-sky-50/50 focus:outline-none focus:border-[var(--color-secondary)] transition"
          />
          <button
            type="submit"
            disabled={saving || unchanged || cpi === ""}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-accent)] transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            Save
          </button>
          {profile.cpi !== null && (
            <button
              type="button"
              disabled={saving}
              onClick={() => save(null)}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500">Optional. Only used to filter postings for you. Never shown to anyone else.</p>
      </form>
    </section>
  );
}
