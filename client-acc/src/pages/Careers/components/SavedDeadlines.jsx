import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { deadlineRows } from "../lib/deadlines";
import { formatDate } from "../lib/format";

// Saved page: the deadlines sources stated for the student's saved and tracked postings
// (P6-T6, F-20 in-app). Postings without a stated deadline are not listed here.
export default function SavedDeadlines({ items }) {
  const rows = deadlineRows(items);
  if (!rows.length) return null;
  return (
    <section aria-labelledby="deadlines-title" className="p-5 rounded-2xl border border-slate-200 bg-white/95 shadow-xs">
      <h2 id="deadlines-title" className="flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">
        <CalendarDays size={16} className="text-[var(--color-secondary)]" aria-hidden="true" /> Deadlines stated by source
      </h2>
      <ul className="mt-3 divide-y divide-slate-100">
        {rows.map(({ posting, date, passed }) => (
          <li key={posting.id} className={`py-2 flex flex-col sm:flex-row sm:items-baseline gap-x-4 gap-y-0.5 text-sm ${passed ? "text-slate-400" : "text-slate-700"}`}>
            <span className="shrink-0 w-32 font-semibold tabular-nums">
              {formatDate(`${date}T00:00:00Z`, { utc: true })}{passed && <span className="font-normal"> (passed)</span>}
            </span>
            <span className="min-w-0">
              <Link to={`/dashboard/career-vault/jobs/${posting.id}`} className={`font-semibold hover:underline ${passed ? "" : "text-[var(--color-primary)]"}`}>{posting.roleTitle}</Link>
              <span> · {posting.company.name}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-slate-500">Dates as published by the company. Check the company's page; they can change.</p>
    </section>
  );
}
