import { Link } from "react-router-dom";
import { daysAgo, submissionStatus } from "../lib/format";

const TONES = {
  live: "text-emerald-700 bg-emerald-50 border-emerald-100",
  info: "text-blue-700 bg-blue-50 border-blue-100",
  neutral: "text-slate-600 bg-slate-50 border-slate-200",
  failed: "text-rose-700 bg-rose-50 border-rose-100",
};

// The student's own shared links with their status. URLs and notes are shown as text, never as HTML.
export default function MySubmissions({ items }) {
  if (!items.length) return <p className="text-xs text-slate-500">You haven't shared any links yet.</p>;
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((s) => {
        const status = submissionStatus(s);
        return (
          <li key={s.id} className="py-2.5 text-xs">
            <div className="flex items-start justify-between gap-3">
              <p className="text-slate-700 font-medium break-all min-w-0">{s.url}</p>
              <span className={`shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${TONES[status.tone]}`}>
                {status.label}
              </span>
            </div>
            <p className="mt-0.5 text-slate-500">
              Shared {daysAgo(s.createdAt)}
              {s.postingLive && s.postingId && (
                <> · <Link to={`/dashboard/career-vault/jobs/${s.postingId}`} className="font-semibold text-[var(--color-secondary)] hover:underline">View posting</Link></>
              )}
            </p>
            {status.detail && <p className="mt-0.5 text-slate-500">{status.detail}</p>}
          </li>
        );
      })}
    </ul>
  );
}
