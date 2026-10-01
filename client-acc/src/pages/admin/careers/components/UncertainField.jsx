// A labelled form field. When the extractor was unsure about it, it gets an amber ring and an
// "Unsure" chip so the reviewer checks it first.
export default function UncertainField({ id, label, uncertain, confidence, hint, children, className = "" }) {
  return (
    <div className={`${className} ${uncertain ? "rounded-xl ring-2 ring-amber-300 bg-amber-50/50 p-2 -m-2" : ""}`}>
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="text-xs font-semibold text-slate-600">{label}</label>
        {uncertain && (
          <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
            Unsure{confidence !== null && confidence !== undefined ? ` · ${confidence.toFixed(2)}` : ""}
          </span>
        )}
      </div>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}
