// Ops: what each board brought in over the last 30 days and how much of it was approved or rejected
// (P6-T1, F-23), so a noisy board can be disabled on Sources. Boards with nothing new are summed up.
import { Link } from "react-router-dom";
import { cardClass } from "./ui";
import { rejectedShare } from "./format";

export default function SourceQualityCard({ sources, days }) {
  const rows = sources.filter((s) => s.quality?.kept).sort((a, b) => b.quality.kept - a.quality.kept);
  const quiet = sources.length - rows.length;
  return (
    <div className={`${cardClass} p-5 space-y-3`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold text-[var(--color-primary)]">Board quality, last {days} days</h2>
        <Link to="/admin/careers/sources" className="text-xs font-bold underline text-slate-600">Sources</Link>
      </div>
      {rows.length === 0 ? <p className="text-sm text-slate-500">No board brought in new postings in the last {days} days.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-1.5 pr-3 font-semibold">Board</th>
                <th className="py-1.5 px-2 font-semibold text-right">Kept</th>
                <th className="py-1.5 px-2 font-semibold text-right">Approved</th>
                <th className="py-1.5 px-2 font-semibold text-right">Rejected</th>
                <th className="py-1.5 pl-2 font-semibold text-right">Waiting</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((s) => {
                const share = rejectedShare(s.quality);
                return (
                  <tr key={s.id}>
                    <td className="py-1.5 pr-3 text-slate-700">{s.name}{!s.isEnabled && <span className="text-slate-400"> (disabled)</span>}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums">{s.quality.kept}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums">{s.quality.approved}</td>
                    <td className={`py-1.5 px-2 text-right tabular-nums ${share !== null && share >= 50 ? "font-bold text-rose-700" : ""}`}>
                      {s.quality.rejected}{share !== null && <span className="text-slate-400 font-normal"> ({share}%)</span>}
                    </td>
                    <td className="py-1.5 pl-2 text-right tabular-nums">{s.quality.pending}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {quiet > 0 && rows.length > 0 && <p className="text-xs text-slate-500">{quiet} other board{quiet === 1 ? "" : "s"} brought in nothing new.</p>}
      <p className="text-[11px] text-slate-500">Rejected (%) is out of the reviewed postings; half or more rejected is shown in red.</p>
    </div>
  );
}
