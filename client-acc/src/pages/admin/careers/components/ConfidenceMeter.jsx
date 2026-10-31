// Confidence bar for automatically extracted postings (rose < 0.6 <= amber < 0.8 <= emerald).
export default function ConfidenceMeter({ value, tier }) {
  if (value === null || value === undefined) {
    return <p className="text-xs text-slate-500">Entered by hand ({tier === "MANUAL" ? "manual entry" : tier}); no confidence score.</p>;
  }
  const pct = Math.round(value * 100);
  const color = value < 0.6 ? "bg-rose-500" : value < 0.8 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Confidence {value.toFixed(2)}</span>
      <div className="flex-1 min-w-[120px] h-2 rounded-full bg-slate-100 overflow-hidden" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Extraction confidence">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-slate-500 whitespace-nowrap">Extracted automatically ({tier.replace("_", " ").toLowerCase()})</span>
    </div>
  );
}
