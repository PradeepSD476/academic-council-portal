// One number-centred card on the operations page.
import { cardClass } from "./ui";

export default function StatCard({ icon: Icon, title, value, tone = "slate", children }) {
  const toneClass = { slate: "text-[var(--color-primary)]", red: "text-rose-700", amber: "text-amber-700", green: "text-emerald-700" }[tone];
  return (
    <div className={`${cardClass} p-4 space-y-2`}>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">{Icon && <Icon size={14} />} {title}</p>
      <p className={`text-2xl font-extrabold ${toneClass}`}>{value}</p>
      {children && <div className="text-xs text-slate-600 space-y-1">{children}</div>}
    </div>
  );
}
