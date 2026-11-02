import { Flag } from "lucide-react";

// Open student reports on a posting (P6-T7, F-05), in the review queue and All postings.
export default function ReportCount({ count }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-bold uppercase" title="Open reports from students">
      <Flag size={11} aria-hidden="true" /> {count} report{count === 1 ? "" : "s"}
    </span>
  );
}
