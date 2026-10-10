// Ops: how students use Jobs & Internships, per IST week (P7-T4, F-30). Aggregate counts only; the
// API has no way to say which student did what.
import { useEffect, useState } from "react";
import { careersAdminApi, errorMessage } from "../../../../api/careersApi";
import { cardClass } from "./ui";

const weekLabel = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

const COLUMNS = [
  ["visitors", "Students visited", "Students who opened the jobs list (each counted once a week)"],
  ["saves", "Saves", "Postings saved"],
  ["trackingStarted", "Tracking started", "Application statuses set for the first time"],
  ["markedApplied", "Marked applied", "Statuses that reached Applied (or later)"],
  ["applyClicks", "Apply clicks", "Clicks on “Apply on the company site”"],
  ["published", "Published", "Postings approved and shown to students"],
];

export default function UsageCard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    careersAdminApi.getUsage(8)
      .then((d) => { if (alive) setData(d); })
      .catch((err) => { if (alive) setError(errorMessage(err, "Could not load the usage numbers.")); });
    return () => { alive = false; };
  }, []);

  return (
    <div className={`${cardClass} p-5 space-y-3`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold text-[var(--color-primary)]">Student use, last 8 weeks</h2>
        {data && <span className="text-xs text-slate-500">{data.live} live postings now</span>}
      </div>
      {error && <p className="text-sm text-rose-700">{error}</p>}
      {!data && !error && <div className="h-24 rounded-xl bg-slate-100 animate-pulse" aria-hidden="true" />}
      {data && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-1.5 pr-3 font-semibold whitespace-nowrap">Week of</th>
                {COLUMNS.map(([key, label, title]) => <th key={key} title={title} className="py-1.5 px-2 font-semibold text-right whitespace-nowrap">{label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.weeks.map((w, i) => (
                <tr key={w.weekStart}>
                  <td className="py-1.5 pr-3 text-slate-700 whitespace-nowrap">{weekLabel(w.weekStart)}{i === 0 && <span className="text-slate-400"> (this week)</span>}</td>
                  {COLUMNS.map(([key]) => <td key={key} className="py-1.5 px-2 text-right tabular-nums">{w[key]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-slate-500">Counts only. Nobody, admins included, can see which student visited, saved, tracked or clicked. Visits and Apply clicks are only counted from the release that added this card.</p>
    </div>
  );
}
