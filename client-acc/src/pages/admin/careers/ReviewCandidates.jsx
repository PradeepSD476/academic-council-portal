// Review queue tab: companies created automatically from unmatched names. Approve real new
// companies, merge a candidate into the company it really is, edit its name / website first, or
// reject page noise (P7-T11: hidden, never deleted; its postings go to Flagged).
import { useCallback, useEffect, useState } from "react";
import { Check, GitMerge, Pencil, RotateCcw, X } from "lucide-react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../api/careersApi";
import CompanyDetail from "./CompanyDetail";
import MergeDialog from "./MergeDialog";
import { Skeleton, cardClass, inputClass, outlineButton } from "./components/ui";
import { plural } from "./components/format";

function RejectRow({ company, onDone, onCancel }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await careersAdminApi.rejectCompany(company.id, reason.trim() || undefined);
      toast.success(res.message, { duration: 7000 });
      onDone();
    } catch (err) {
      toast.error(errorMessage(err, "Could not reject it."), { duration: 8000 });
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="w-full space-y-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3">
      <p className="text-xs text-slate-700">
        Reject <span className="font-semibold">{company.name}</span>? It leaves this list and the company pickers but is not deleted
        {company._count.postings ? `; its ${plural(company._count.postings, "posting")} move to Flagged to pick the real company` : ""}.
      </p>
      <label htmlFor={`reject-reason-${company.id}`} className="sr-only">Reason (optional)</label>
      <input id={`reject-reason-${company.id}`} className={inputClass} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional), e.g. job platform, not the employer" />
      <div className="flex gap-2">
        <button type="button" className={outlineButton} onClick={onCancel} disabled={busy}>Keep it</button>
        <button type="submit" className={`${outlineButton} text-rose-700`} disabled={busy}>{busy ? "Rejecting…" : "Reject"}</button>
      </div>
    </form>
  );
}

export default function ReviewCandidates({ onChanged, refreshKey }) {
  const [items, setItems] = useState(null);
  const [rejected, setRejected] = useState(null); // shown with "Show rejected"
  const [showRejected, setShowRejected] = useState(false);
  const [merging, setMerging] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [open, gone] = await Promise.all([
        careersAdminApi.listCompanies({ status: "CANDIDATE", limit: 100 }),
        careersAdminApi.listCompanies({ status: "REJECTED", limit: 100 }),
      ]);
      setItems(open.data);
      setRejected(gone.data);
    } catch (err) {
      toast.error(errorMessage(err, "Could not load candidate companies."));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const approve = async (c) => {
    try {
      await careersAdminApi.approveCompany(c.id);
      toast.success(`${c.name} approved.`);
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const restore = async (c) => {
    try {
      const res = await careersAdminApi.restoreCompany(c.id);
      toast.success(res.message);
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (!items) return <Skeleton rows={4} />;

  return (
    <>
      {items.length === 0 ? (
        <div className={`${cardClass} p-8 text-center text-sm text-slate-500`}>No candidate companies. Every posting points at a confirmed company.</div>
      ) : (
        <div className={`${cardClass} overflow-hidden`}>
          <ul className="divide-y divide-slate-100">
            {items.map((c) => (
              <li key={c.id} className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 px-4 py-3">
                <button type="button" onClick={() => setOpenId(c.id)} className="flex-1 min-w-0 text-left cursor-pointer">
                  <span className="block text-sm font-semibold text-slate-800 truncate">{c.name}</span>
                  <span className="block text-xs text-slate-500">
                    {plural(c._count.postings, "posting")} · {plural(c._count.aliases, "alias", "aliases")} · created {new Date(c.createdAt).toLocaleDateString("en-IN")}
                    {c.website && <> · {c.website}</>}
                  </span>
                </button>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={outlineButton} onClick={() => setOpenId(c.id)}><Pencil size={14} /> Edit</button>
                  <button type="button" className={outlineButton} onClick={() => setMerging(c)}><GitMerge size={14} /> Merge into…</button>
                  <button type="button" className={outlineButton} onClick={() => approve(c)}><Check size={14} /> Approve</button>
                  <button type="button" className={`${outlineButton} text-rose-700`} onClick={() => setRejecting(c.id)}><X size={14} /> Reject…</button>
                </div>
                {rejecting === c.id && <RejectRow company={c} onCancel={() => setRejecting(null)} onDone={() => { setRejecting(null); onChanged(); }} />}
              </li>
            ))}
          </ul>
        </div>
      )}

      {rejected?.length > 0 && (
        <div className="space-y-2">
          <button type="button" onClick={() => setShowRejected((v) => !v)} className="text-xs font-semibold text-slate-600 hover:text-[var(--color-secondary)] hover:underline cursor-pointer">
            {showRejected ? "Hide rejected candidates" : `Show rejected (${rejected.length})`}
          </button>
          {showRejected && (
            <ul className={`${cardClass} divide-y divide-slate-100 overflow-hidden`}>
              {rejected.map((c) => (
                <li key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3">
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-slate-600 truncate">{c.name}</span>
                    <span className="block text-xs text-slate-500">Rejected {new Date(c.rejectedAt).toLocaleDateString("en-IN")}{c.rejectReason ? ` · ${c.rejectReason}` : ""}</span>
                  </span>
                  <button type="button" className={outlineButton} onClick={() => restore(c)}><RotateCcw size={14} /> Restore</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {merging && <MergeDialog company={merging} onClose={() => setMerging(null)} onDone={() => { setMerging(null); onChanged(); }} />}
      {openId && <CompanyDetail companyId={openId} onClose={() => setOpenId(null)} onChanged={onChanged} onOpenCompany={setOpenId} />}
    </>
  );
}
