import { useState } from "react";
import { PencilLine, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../api/careersApi";
import PostingEditor from "../../admin/careers/PostingEditor";
import PostingStatusChip from "../../admin/careers/components/PostingStatusChip";
import TakeDownDialog from "../../admin/careers/components/TakeDownDialog";
import { formatDate } from "../lib/format";

const ACTION_WORD = { APPROVE: "approved", REJECT: "rejected", EXPIRE: "expired", REOPEN: "reopened", EDIT: "edited", CREATE_MANUAL: "added" };

// Career admins only (P5-T3, F-03): status, who approved the posting, and shortcuts to the editor and
// to Take down, right on the page students see. The server only sends `adminInfo` to career admins.
export default function AdminBar({ info, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [takeDown, setTakeDown] = useState(null); // the admin view of the posting (with save counts)
  const [busy, setBusy] = useState(false);

  const openTakeDown = async () => {
    setBusy(true);
    try {
      setTakeDown(await careersAdminApi.getPosting(info.postingId));
    } catch (err) {
      toast.error(errorMessage(err, "Could not load the posting."));
    } finally {
      setBusy(false);
    }
  };

  const last = info.lastAction;
  const smallButton = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer disabled:opacity-50";
  return (
    <div role="region" aria-label="Admin tools" className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600">
      <span className="inline-flex items-center gap-1.5 font-bold text-slate-700"><ShieldCheck size={14} className="text-teal-600" aria-hidden="true" /> Admin</span>
      <PostingStatusChip status={info.status} />
      <span>
        {info.approvedBy ? `Approved by ${info.approvedBy} on ${formatDate(info.approvedAt)}` : "Not approved yet"}
        {last && last.action !== "APPROVE" && ` · last ${ACTION_WORD[last.action] ?? last.action.toLowerCase()} by ${last.by} on ${formatDate(last.at)}`}
      </span>
      <span className="flex gap-2 sm:ml-auto">
        <button type="button" className={`${smallButton} border-slate-200 bg-white text-slate-700 hover:bg-slate-100`} onClick={() => setEditing(true)}>
          <PencilLine size={13} aria-hidden="true" /> Edit in admin
        </button>
        {info.status === "LIVE" && (
          <button type="button" className={`${smallButton} border-rose-200 bg-white text-rose-700 hover:bg-rose-50`} onClick={openTakeDown} disabled={busy}>Take down</button>
        )}
      </span>
      {editing && <PostingEditor postingId={info.postingId} onClose={() => setEditing(false)} onChanged={onChanged} />}
      {takeDown && <TakeDownDialog posting={takeDown} onClose={() => setTakeDown(null)} onDone={() => { setTakeDown(null); onChanged(); }} />}
    </div>
  );
}
