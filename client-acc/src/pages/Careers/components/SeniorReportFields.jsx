// Optional numbers on the "Share your experience" form (P8-T1, F-29). Never shown on the experience
// itself: the company page shows them only as a summary once 3 or more seniors report the same one.
// Internship → stipend per month; Placement → CTC; Startup → either.
const inputClass = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[var(--color-primary)] placeholder-slate-400 focus:outline-none focus:border-[var(--color-secondary)] transition bg-sky-50/50";

function Field({ id, label, hint, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-slate-600">{label}</label>
      <input id={id} type="number" inputMode="numeric" className={inputClass} {...props} />
      {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

export default function SeniorReportFields({ experienceType, value, onChange }) {
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });
  const year = new Date().getFullYear();
  const showStipend = experienceType !== "PLACEMENT";
  const showCtc = experienceType !== "INTERNSHIP";
  return (
    <div className="p-5 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl shadow-xs flex flex-col gap-4">
      <div>
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Numbers for juniors (optional)</h3>
        <p className="mt-1 text-xs text-slate-500">
          Not shown on your post. The company page shows only a rounded summary, such as “typically about ₹50,000 a month, from 3 seniors”, once at least 3 seniors have shared the same number.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {showStipend && <Field id="report-stipend" label="Stipend (₹ per month)" placeholder="e.g. 50000" min={1000} max={1000000} step={1000} value={value.stipend ?? ""} onChange={set("stipend")} />}
        {showCtc && <Field id="report-ctc" label="CTC (₹ lakh per year)" placeholder="e.g. 18.5" min={1} max={200} step={0.1} value={value.ctcLpa ?? ""} onChange={set("ctcLpa")} />}
        <Field id="report-rounds" label="Interview rounds" placeholder="e.g. 3" min={1} max={15} step={1} value={value.rounds ?? ""} onChange={set("rounds")} />
        <Field id="report-year" label="Year" placeholder={String(year)} min={2000} max={year + 1} step={1} value={value.year ?? ""} onChange={set("year")} hint="When you interned or were placed." />
      </div>
    </div>
  );
}
