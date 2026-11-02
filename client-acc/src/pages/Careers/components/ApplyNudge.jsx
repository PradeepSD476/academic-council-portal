import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import toast from "react-hot-toast";
import { careersApi, errorMessage } from "../../../api/careersApi";
import { dismissApplyNudge, forgetApplyClick } from "../lib/applyNudge";
import { formatDate } from "../lib/format";

// "You opened the application on 9 Oct. Mark as Applied?" (P6-T4, F-26). Mark as Applied sets the
// status and saves the posting; Dismiss hides the question for this posting.
// at: the remembered Apply click; title: shown when several postings are asked about (Saved page).
export default function ApplyNudge({ posting, at, title, onApplied, onDismiss }) {
  const [busy, setBusy] = useState(false);

  const markApplied = async () => {
    setBusy(true);
    try {
      await careersApi.setApplication(posting.id, "APPLIED");
      if (!posting.saved) await careersApi.savePosting(posting.id);
      forgetApplyClick(posting.id);
      toast.success("Marked as Applied. You can follow it under Saved.");
      onApplied({ applicationStatus: "APPLIED", saved: true });
    } catch (err) {
      toast.error(errorMessage(err, "Could not mark it as Applied."));
    } finally {
      setBusy(false);
    }
  };

  const dismiss = () => {
    dismissApplyNudge(posting.id);
    onDismiss();
  };

  return (
    <div role="status" className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 rounded-xl border border-teal-100 bg-teal-50 text-sm text-slate-700">
      <ClipboardCheck size={18} className="hidden sm:block shrink-0 text-teal-700" aria-hidden="true" />
      <p className="flex-1 min-w-0">
        {title && <span className="block font-semibold text-slate-800 truncate">{title}</span>}
        You opened the application on {formatDate(at)}. Did you apply?
      </p>
      <div className="flex gap-2 shrink-0">
        <button type="button" onClick={markApplied} disabled={busy} className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold cursor-pointer disabled:opacity-60">
          {busy ? "Saving…" : "Mark as Applied"}
        </button>
        <button type="button" onClick={dismiss} disabled={busy} className="px-3 py-1.5 rounded-lg border border-teal-200 bg-white text-teal-800 text-xs font-semibold hover:bg-teal-100 cursor-pointer">
          Dismiss
        </button>
      </div>
    </div>
  );
}
