import { Link } from "react-router-dom";
import { daysAgo, submissionStatus } from "../lib/format";

const TONES = {
  live: "text-emerald-700 bg-emerald-50 border-emerald-100",
  info: "text-blue-700 bg-blue-50 border-blue-100",
  neutral: "text-slate-600 bg-slate-50 border-slate-200",
  failed: "text-rose-700 bg-rose-50 border-rose-100",
  waiting: "text-amber-700 bg-amber-50 border-amber-100",
};

// The student's own shared links with their status. URLs and notes are shown as text, never as HTML.
// A link still waiting to be read can be withdrawn by the student who shared it (P5-T4).
export default function MySubmissions({ items, onWithdraw }) {
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
              {s.sharedEarlier ? `First shared by another student ${daysAgo(s.createdAt)}` : `Shared ${daysAgo(s.createdAt)}`}
              {s.postingLive && s.postingId && (
                <> · <Link to={`/dashboard/career-vault/jobs/${s.postingId}`} className="font-semibold text-[var(--color-secondary)] hover:underline">View posting</Link></>
              )}
            </p>
            {status.detail && <p className="mt-0.5 text-slate-500">{status.detail}</p>}
            {onWithdraw && !s.sharedEarlier && s.status === "RECEIVED" && !s.dismissedAt && (
              <button type="button" onClick={() => onWithdraw(s)} className="mt-1 text-xs font-semibold text-slate-500 hover:text-rose-700 hover:underline cursor-pointer">Withdraw</button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
