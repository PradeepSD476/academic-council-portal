// Source health: OK emerald · ZERO_RESULTS amber · FAILING rose · DISABLED slate · UNKNOWN blue.
const STYLES = {
  OK: ["text-emerald-700 bg-emerald-50 border-emerald-100", "OK"],
  ZERO_RESULTS: ["text-amber-800 bg-amber-50 border-amber-100", "0 results"],
  FAILING: ["text-rose-700 bg-rose-50 border-rose-200", "Failing"],
  DISABLED: ["text-slate-600 bg-slate-100 border-slate-200", "Disabled"],
  UNKNOWN: ["text-blue-700 bg-blue-50 border-blue-100", "Not run yet"],
};

export default function HealthBadge({ health }) {
  const [style, label] = STYLES[health] || STYLES.UNKNOWN;
  return <span className={`inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${style}`}>{label}</span>;
}
