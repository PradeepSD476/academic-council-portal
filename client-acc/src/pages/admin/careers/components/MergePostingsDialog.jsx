// Merge two postings by hand (P7-T8, F-06). "drop" is the posting that goes away; the admin picks the
// one to keep (same company first), sees what moves, and confirms. "Swap" merges the other way.
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ArrowLeftRight, GitMerge, Search } from "lucide-react";
import { careersAdminApi, errorMessage } from "../../../../api/careersApi";
import PostingStatusChip from "./PostingStatusChip";
import { Modal, inputClass, outlineButton, primaryButton } from "./ui";
import { plural } from "./format";

export default function MergePostingsDialog({ drop: initialDrop, keepId: initialKeepId = null, onClose, onDone }) {
  const [dropId, setDropId] = useState(initialDrop.id);
  const [keepId, setKeepId] = useState(initialKeepId);
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [preview, setPreview] = useState(null); // { keep, drop, moves } | { error }
  const [saving, setSaving] = useState(false);
  const companyId = initialDrop.company?.id;

  // Candidates: same company, any status but rejected; a number finds that posting.
  useEffect(() => {
    if (keepId) return undefined;
    let alive = true;
    const t = setTimeout(async () => {
      try {
        if (/^#?\d+$/.test(q.trim())) { if (alive) setResults([]); return; }
        const res = await careersAdminApi.listAllPostings({ status: "ALL", q: q.trim(), companyId, limit: 20 });
        if (alive) setResults(res.data.filter((p) => p.id !== dropId && p.status !== "REJECTED"));
      } catch (err) {
        if (alive) toast.error(errorMessage(err, "Could not search postings."));
      }
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [q, keepId, dropId, companyId]);

  useEffect(() => {
    if (!keepId) { setPreview(null); return undefined; }
    let alive = true;
    careersAdminApi.mergePreview(keepId, dropId)
      .then((d) => { if (alive) setPreview(d); })
      .catch((err) => { if (alive) setPreview({ error: errorMessage(err, "These two cannot be merged.") }); });
    return () => { alive = false; };
  }, [keepId, dropId]);

  const swap = () => { const k = keepId; setKeepId(dropId); setDropId(k); };

  const submit = async () => {
    setSaving(true);
    try {
      const res = await careersAdminApi.mergePostings(keepId, dropId);
      toast.success(res.message, { duration: 8000 });
      onDone();
    } catch (err) {
      toast.error(errorMessage(err, "Merge failed."), { duration: 8000 });
    } finally {
      setSaving(false);
    }
  };

  const m = preview?.moves;
  return (
    <Modal title="Merge two postings" onClose={saving ? () => {} : onClose}
      footer={(
        <>
          <button type="button" className={outlineButton} onClick={onClose} disabled={saving}>Cancel</button>
          {keepId && <button type="button" className={outlineButton} onClick={swap} disabled={saving}><ArrowLeftRight size={14} /> Swap</button>}
          <button type="button" className={primaryButton} onClick={submit} disabled={!m || saving}>
            <GitMerge size={14} /> {saving ? "Merging…" : keepId ? `Merge #${dropId} into #${keepId}` : "Choose a posting"}
          </button>
        </>
      )}>
      {!keepId ? (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Merge <span className="font-semibold text-slate-700">#{dropId} {initialDrop.roleTitle}</span> into the posting it duplicates.
            Showing {initialDrop.company?.name ?? "the same company"}'s postings; type a number for any posting.
          </p>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <label htmlFor="mp-search" className="sr-only">Find the posting to keep</label>
            <input id="mp-search" className={`${inputClass} pl-9`} placeholder="Title, or #number" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
          </div>
          <ul className="space-y-1.5" aria-label="Postings to keep">
            {results.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => setKeepId(p.id)} className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-left text-sm cursor-pointer">
                  <span className="min-w-0"><span className="font-semibold text-slate-800 break-words">{p.roleTitle}</span><span className="block text-xs text-slate-500">#{p.id} · {p.company.name} · {p.location || "Location not stated"}</span></span>
                  <PostingStatusChip status={p.status} />
                </button>
              </li>
            ))}
            {/^#?\d+$/.test(q.trim()) ? (
              <li><button type="button" className={outlineButton} onClick={() => setKeepId(Number(q.trim().replace("#", "")))}>Use posting #{q.trim().replace("#", "")}</button></li>
            ) : results.length === 0 && <li className="text-xs text-slate-500 px-1 py-2">No matching postings.</li>}
          </ul>
        </div>
      ) : !preview ? (
        <p className="text-sm text-slate-500">Checking…</p>
      ) : preview.error ? (
        <div className="space-y-2">
          <p className="text-sm text-rose-700">{preview.error}</p>
          {!initialKeepId && <button type="button" className="text-xs font-semibold text-[var(--color-secondary)] hover:underline cursor-pointer" onClick={() => setKeepId(null)}>Pick another posting</button>}
        </div>
      ) : (
        <div className="space-y-3 text-sm text-slate-600">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 p-3"><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Keep</dt><dd className="mt-1 font-semibold text-slate-800 break-words">#{preview.keep.id} {preview.keep.roleTitle}</dd><dd className="mt-1"><PostingStatusChip status={preview.keep.status} /></dd></div>
            <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3"><dt className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Merge away</dt><dd className="mt-1 font-semibold text-slate-800 break-words">#{preview.drop.id} {preview.drop.roleTitle}</dd><dd className="mt-1"><PostingStatusChip status={preview.drop.status} /></dd></div>
          </dl>
          <p>Moves to #{preview.keep.id}: {plural(m.observations, "board observation")}, {plural(m.saves, "student save")}, {plural(m.applications, "application status", "application statuses")}, {m.hidden} “Not for me”.</p>
          <p className="text-xs text-slate-500">#{preview.drop.id} becomes Rejected (“Duplicate of #{preview.keep.id}”); nothing is deleted. A student who had both keeps one save and the furthest status. Both postings get a history line.</p>
        </div>
      )}
    </Modal>
  );
}
