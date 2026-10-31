import { useState } from "react";
import { Modal, dangerButton, inputClass, outlineButton } from "./ui";
import { plural } from "./format";

// Bulk reject (with a reason) or bulk expire from the review queue's selection bar (P6-T8, F-04).
// Each posting gets its own history row; postings that can't take the action are skipped.
export default function BulkActionDialog({ kind, count, onCancel, onConfirm }) {
  const [reason, setReason] = useState("");
  const reject = kind === "reject";
  return (
    <Modal title={reject ? `Reject ${plural(count, "posting")}` : `Mark ${plural(count, "posting")} as expired`} onClose={onCancel}
      footer={(
        <>
          <button type="button" className={outlineButton} onClick={onCancel}>Cancel</button>
          <button type="button" className={dangerButton} disabled={reject && !reason.trim()} onClick={() => onConfirm(reason.trim())}>
            {reject ? "Reject" : "Mark as expired"}
          </button>
        </>
      )}>
      {reject ? (
        <div className="space-y-2">
          <label htmlFor="bulk-reason" className="text-xs font-semibold text-slate-600">Reason (kept in each posting's history)</label>
          <textarea id="bulk-reason" rows={3} maxLength={500} className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Not for students: senior roles" />
          <p className="text-[11px] text-slate-500">Rejected postings never reach students. They can be reopened from All postings.</p>
        </div>
      ) : (
        <p className="text-sm text-slate-600">They leave the queue as expired and can be reopened from All postings.</p>
      )}
    </Modal>
  );
}
