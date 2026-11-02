// Career admins only, under an experience on a company page (P7-T10, F-10): shortcuts to what already
// exists. "Unlink from this company" is the backfill unlink; "Delete experience…" is upstream's
// DELETE /posts/:id (the same call Manage Posts makes), behind a confirmation. No new delete logic.
import { useState } from "react";
import toast from "react-hot-toast";
import { Trash2, Unlink } from "lucide-react";
import { careersAdminApi, errorMessage } from "../../../api/careersApi";
import { deletePost } from "../../../lib/Post_Functions";

const link = "inline-flex items-center gap-1 text-xs font-semibold cursor-pointer disabled:opacity-50";

export default function ExperienceAdminActions({ experience, companyName, onRemoved }) {
  const [confirm, setConfirm] = useState(null); // 'unlink' | 'delete'
  const [busy, setBusy] = useState(false);

  const unlink = async () => {
    setBusy(true);
    try {
      const res = await careersAdminApi.unlinkBackfill(experience.id);
      toast.success(res.message || "Unlinked. It stays in Career Vault.");
      onRemoved(experience.id);
    } catch (err) {
      toast.error(errorMessage(err, "Could not unlink it."));
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const remove = async () => {
    setBusy(true);
    const res = await deletePost(experience.id); // upstream helper; shows its own toast
    setBusy(false);
    setConfirm(null);
    if (res?.success) onRemoved(experience.id);
  };

  if (confirm) {
    return (
      <div className="mx-3 flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-b-xl border border-t-0 border-amber-200 bg-amber-50/70 text-xs text-slate-700">
        {confirm === "unlink"
          ? <span>Remove it from {companyName}'s page? It stays in Career Vault.</span>
          : <span className="font-semibold text-rose-800">Delete “{experience.title}” from Career Vault for everyone? This cannot be undone.</span>}
        <button type="button" className={`${link} text-slate-600 hover:underline`} disabled={busy} onClick={() => setConfirm(null)}>Keep it</button>
        <button type="button" className={`${link} ${confirm === "delete" ? "text-rose-700" : "text-[var(--color-secondary)]"} hover:underline`} disabled={busy}
          onClick={confirm === "unlink" ? unlink : remove}>
          {busy ? "Working…" : confirm === "unlink" ? "Unlink" : "Delete"}
        </button>
      </div>
    );
  }
  return (
    <div className="mx-3 flex flex-wrap items-center gap-4 px-4 py-2 rounded-b-xl border border-t-0 border-slate-200 bg-slate-50/80">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Admin</span>
      <button type="button" className={`${link} text-slate-600 hover:text-[var(--color-secondary)]`} onClick={() => setConfirm("unlink")}><Unlink size={13} aria-hidden="true" /> Unlink from this company</button>
      <button type="button" className={`${link} text-rose-700 hover:underline`} onClick={() => setConfirm("delete")}><Trash2 size={13} aria-hidden="true" /> Delete experience…</button>
    </div>
  );
}
