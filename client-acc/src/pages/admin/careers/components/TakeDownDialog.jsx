// Take down a LIVE posting (P5-T2, decision D-02). "Closed" marks it expired (students who saved it
// still see it as "No longer live"); any other reason removes it from every student view. Both can
// be reopened from the editor.
import { useState } from "react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../../api/careersApi";
import { Modal, dangerButton, inputClass, outlineButton } from "./ui";
import { plural } from "./format";

const REASONS = [
  { value: "CLOSED", label: "Closed", hint: "The company stopped hiring for it. Students who saved it see \"No longer live\"." },
  { value: "NOT_FOR_STUDENTS", label: "Not for students", hint: "Needs experience, not open to India, or not a campus role." },
  { value: "DUPLICATE", label: "Duplicate", hint: "The same role is already listed." },
  { value: "SPAM", label: "Spam or not a real opening", hint: "" },
  { value: "WRONG_DETAILS", label: "Wrong details", hint: "Reopen it after fixing, if you prefer." },
  { value: "OTHER", label: "Other", hint: "" },
];

export default function TakeDownDialog({ posting, onClose, onDone }) {
  const [reason, setReason] = useState("CLOSED");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const closed = reason === "CLOSED";
  const saves = posting._count?.saves ?? 0;
  const tracking = posting._count?.applications ?? 0;

  const submit = async () => {
    const text = details.trim();
    if (reason === "OTHER" && !text) return toast.error("Say why.");
    setBusy(true);
    try {
      const res = await careersAdminApi.takeDownPosting(posting.id, { reason, ...(text ? { details: text } : {}) });
      toast.success(res.message);
      onDone();
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal title="Take down this posting?" onClose={onClose}
      footer={(
        <>
          <button type="button" className={outlineButton} onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className={dangerButton} onClick={submit} disabled={busy}>{closed ? "Mark as closed" : "Take down"}</button>
        </>
      )}>
      <p className="text-sm font-semibold text-slate-800">{posting.roleTitle} <span className="font-normal text-slate-500">· {posting.company?.name}</span></p>
      <p className="mt-1 text-xs text-slate-500">
        {saves || tracking
          ? `${plural(saves, "student")} saved it; ${tracking} tracking an application. ${closed ? "They will see it as \"No longer live\"." : "It disappears from their Saved list too."}`
          : `No student has saved it.${closed ? "" : " It disappears from the jobs list right away."}`}
      </p>
      <fieldset className="mt-4 space-y-1.5">
        <legend className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Reason</legend>
        {REASONS.map((r) => (
          <label key={r.value} className={`flex items-start gap-2.5 px-3 py-2 rounded-xl border cursor-pointer ${reason === r.value ? "border-[var(--color-secondary)] bg-sky-50/60" : "border-slate-200 hover:bg-slate-50"}`}>
            <input type="radio" name="take-down-reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="mt-0.5 accent-[var(--color-secondary)]" />
            <span>
              <span className="block text-sm font-semibold text-slate-800">{r.label}</span>
              {r.hint && <span className="block text-xs text-slate-500">{r.hint}</span>}
            </span>
          </label>
        ))}
      </fieldset>
      <label htmlFor="td-details" className="mt-3 block text-xs font-semibold text-slate-600">{reason === "OTHER" ? "Why (required)" : "Note (optional)"}</label>
      <input id="td-details" className={`${inputClass} mt-1`} value={details} maxLength={300} onChange={(e) => setDetails(e.target.value)} placeholder={reason === "DUPLICATE" ? "e.g. same as #12" : ""} />
    </Modal>
  );
}
