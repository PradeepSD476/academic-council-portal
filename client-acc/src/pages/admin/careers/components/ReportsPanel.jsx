import { useState } from "react";
import { Flag } from "lucide-react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../../api/careersApi";
import { outlineButton } from "./ui";

const REASON_LABELS = {
  CLOSED: "Closed / no longer accepting",
  WRONG_PAY: "Wrong pay",
  WRONG_ELIGIBILITY: "Wrong eligibility",
  NOT_A_JOB: "Not a real job",
  OTHER: "Other",
};

// Editor: what students reported about this posting (P6-T7, F-05). Reasons and notes only; who
// reported is never sent. "Mark as handled" closes the open reports and clears the "reported" flag;
// fix or take the posting down first if a report is right.
export default function ReportsPanel({ postingId, reports, onHandled }) {
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    setBusy(true);
    try {
      const res = await careersAdminApi.handlePostingReports(postingId);
      toast.success(res.message);
      onHandled();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`rounded-xl border p-3 ${reports.open ? "border-rose-200 bg-rose-50/70" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center gap-2">
        <h3 className="flex-1 text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Flag size={14} className={reports.open ? "text-rose-700" : "text-slate-400"} /> Student reports · {reports.open} open of {reports.total}
        </h3>
        {reports.open > 0 && <button type="button" className={outlineButton} disabled={busy} onClick={handle}>{busy ? "Saving…" : "Mark as handled"}</button>}
      </div>
      <ul className="mt-2 space-y-1.5">
        {reports.items.map((r) => (
          <li key={r.id} className={`text-xs ${r.handledAt ? "text-slate-400" : "text-slate-700"}`}>
            <span className="font-semibold">{REASON_LABELS[r.reason] ?? r.reason}</span> · {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            {r.handledAt && " · handled"}
            {r.note && <span className="block break-words whitespace-pre-wrap">“{r.note}”</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
