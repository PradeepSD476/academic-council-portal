// Delete a posting permanently (P8-T2, F-02 level 2). Only for a posting that is not LIVE (take it down
// first). Shows what goes with it, needs a reason and the posting number typed back. One audit line is
// kept (Activity log → Deleted); everything else about the posting is gone and cannot be restored.
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import { careersAdminApi, errorMessage } from "../../../../api/careersApi";
import PostingStatusChip from "./PostingStatusChip";
import { Modal, dangerButton, inputClass, outlineButton } from "./ui";
import { plural } from "./format";

const REASONS = ["Spam or not a real opening", "Test data", "Other"];

export default function DeletePostingDialog({ postingId, onClose, onDone }) {
  const [preview, setPreview] = useState(null); // { posting, removed, comesBack } | { error }
  const [reason, setReason] = useState(REASONS[0]);
  const [other, setOther] = useState("");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    careersAdminApi.deletePreview(postingId)
      .then((d) => { if (alive) setPreview(d); })
      .catch((err) => { if (alive) setPreview({ error: errorMessage(err, "This posting cannot be deleted.") }); });
    return () => { alive = false; };
  }, [postingId]);

  const text = reason === "Other" ? other.trim() : reason;
  const confirmed = typed.trim().replace("#", "") === String(postingId);

  const submit = async () => {
    if (!text) return toast.error("Say why.");
    setBusy(true);
    try {
      const res = await careersAdminApi.deletePosting(postingId, { reason: text, confirmId: postingId });
      toast.success(res.message, { duration: 8000 });
      onDone();
    } catch (err) {
      toast.error(errorMessage(err, "Delete failed."), { duration: 8000 });
      setBusy(false);
    }
  };

  const r = preview?.removed;
  return (
    <Modal title="Delete this posting permanently?" onClose={busy ? () => {} : onClose}
      footer={(
        <>
          <button type="button" className={outlineButton} onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className={dangerButton} onClick={submit} disabled={!r || !confirmed || !text || busy}>
            <Trash2 size={14} /> {busy ? "Deleting…" : "Delete permanently"}
          </button>
        </>
      )}>
      {!preview ? <p className="text-sm text-slate-500">Checking…</p> : preview.error ? (
        <p className="text-sm text-rose-700">{preview.error}</p>
      ) : (
        <div className="space-y-3 text-sm text-slate-600">
          <div>
            <p className="font-semibold text-slate-800 break-words">#{preview.posting.id} {preview.posting.roleTitle} <span className="font-normal text-slate-500">· {preview.posting.company}</span></p>
            <p className="mt-1"><PostingStatusChip status={preview.posting.status} /></p>
          </div>
          <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Deleted with it</p>
            <ul className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
              <li>{plural(r.saves, "student save")}</li>
              <li>{plural(r.applications, "application status", "application statuses")}</li>
              <li>{plural(r.reports, "student report")}</li>
              <li>{r.hidden} “Not for me”</li>
              <li>{plural(r.observations, "board observation")}</li>
              <li>{plural(r.reviews, "history line")}</li>
              <li>{plural(r.applyClicks, "counted Apply click")}</li>
            </ul>
          </div>
          {r.links > 0 && <p className="text-xs">{plural(r.links, "student link")} that made it {r.links === 1 ? "stays" : "stay"} in “My submissions”, marked “removed by ACC”.</p>}
          {r.duplicates > 0 && <p className="text-xs text-amber-700">{plural(r.duplicates, "posting")} {r.duplicates === 1 ? "is" : "are"} marked “Duplicate of #{postingId}” and will point to a posting that no longer exists.</p>}
          {preview.comesBack && <p className="text-xs text-amber-700">A job board still lists this job, so the next fetch adds it back to the review queue. To keep it away, reject it instead of deleting it.</p>}
          <p className="text-xs text-slate-500">This cannot be undone. The Activity log keeps one line: title, company, reason, who and when.</p>

          <fieldset className="space-y-1">
            <legend className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Reason</legend>
            {REASONS.map((x) => (
              <label key={x} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="radio" name="delete-reason" value={x} checked={reason === x} onChange={() => setReason(x)} className="accent-[var(--color-secondary)]" /> {x}
              </label>
            ))}
          </fieldset>
          {reason === "Other" && (
            <>
              <label htmlFor="dp-other" className="block text-xs font-semibold text-slate-600">Why (required)</label>
              <input id="dp-other" className={inputClass} value={other} maxLength={300} onChange={(e) => setOther(e.target.value)} />
            </>
          )}
          <label htmlFor="dp-confirm" className="block text-xs font-semibold text-slate-600">Type <span className="font-mono">{postingId}</span> to confirm</label>
          <input id="dp-confirm" className={inputClass} inputMode="numeric" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} />
        </div>
      )}
    </Modal>
  );
}
