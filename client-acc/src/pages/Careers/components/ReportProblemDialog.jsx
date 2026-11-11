import { useState } from "react";
import toast from "react-hot-toast";
import { careersApi, errorMessage } from "../../../api/careersApi";
import { Modal, outlineButton, primaryButton, inputClass } from "../../admin/careers/components/ui";

const REASONS = [
  { value: "CLOSED", label: "It is closed or no longer accepting applications" },
  { value: "WRONG_PAY", label: "The pay shown is wrong" },
  { value: "WRONG_ELIGIBILITY", label: "The eligibility shown is wrong" },
  { value: "NOT_A_JOB", label: "It is not a real job or internship" },
  { value: "OTHER", label: "Something else" },
];

// "Report a problem" on the job page (P6-T7, F-05). ACC sees the reason and note, not who sent it.
export default function ReportProblemDialog({ postingId, onClose, onReported }) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const needsNote = reason === "OTHER";

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await careersApi.reportPosting(postingId, { reason, note: note.trim() || null });
      toast.success(res.message);
      onReported();
    } catch (err) {
      if (err?.response?.data?.error === "ALREADY_REPORTED") onReported();
      toast.error(errorMessage(err, "Could not send the report."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Report a problem" onClose={saving ? () => {} : onClose}
      footer={(
        <>
          <button type="button" className={outlineButton} onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="report-problem" className={primaryButton} disabled={saving || !reason || (needsNote && !note.trim())}>{saving ? "Sending…" : "Send report"}</button>
        </>
      )}>
      <form id="report-problem" onSubmit={submit} className="space-y-4">
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold text-slate-600 mb-1">What is wrong?</legend>
          {REASONS.map((r) => (
            <label key={r.value} className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
              <input type="radio" name="report-reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="mt-1 accent-[var(--color-secondary)]" />
              {r.label}
            </label>
          ))}
        </fieldset>
        <div>
          <label htmlFor="report-note" className="text-xs font-semibold text-slate-600">{needsNote ? "Tell ACC what is wrong" : "Details (optional)"}</label>
          <textarea id="report-note" rows={3} maxLength={500} className={`${inputClass} mt-1`} value={note} onChange={(e) => setNote(e.target.value)} required={needsNote} />
          <p className="mt-1 text-[11px] text-slate-500">ACC sees your reason and note, not your name. Each opening can be reported once.</p>
        </div>
      </form>
    </Modal>
  );
}
