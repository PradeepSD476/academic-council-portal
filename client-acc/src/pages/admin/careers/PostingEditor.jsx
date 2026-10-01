// Review one posting: source text on the left, editable fields on the right, actions in a sticky
// footer (Reject with reason · Save · Approve & publish). Also used for LIVE / EXPIRED postings
// (expire / reopen).
import { useCallback, useEffect, useState } from "react";
import { ExternalLink, History, Link2, X } from "lucide-react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../api/careersApi";
import ConfidenceMeter from "./components/ConfidenceMeter";
import CompanyPicker from "./components/CompanyPicker";
import PostingFields from "./components/PostingFields";
import UncertainField from "./components/UncertainField";
import { REJECT_REASONS, changedFields, toForm } from "./components/postingForm";
import { Skeleton, StatusChip, dangerButton, inputClass, outlineButton, primaryButton } from "./components/ui";

const STATUS_STYLE = {
  PENDING_REVIEW: "text-amber-800 bg-amber-50 border-amber-100",
  LIVE: "text-emerald-700 bg-emerald-50 border-emerald-100",
  EXPIRED: "text-slate-600 bg-slate-100 border-slate-200",
  REJECTED: "text-rose-700 bg-rose-50 border-rose-100",
};

function PostingStatus({ status }) {
  return <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE[status]}`}>{status.replace("_", " ")}</span>;
}

export default function PostingEditor({ postingId, onClose, onChanged }) {
  const [posting, setPosting] = useState(null);
  const [form, setForm] = useState(null);
  const [company, setCompany] = useState(null);
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  const [otherReason, setOtherReason] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await careersAdminApi.getPosting(postingId);
      setPosting(data);
      setForm(toForm(data));
      setCompany({ companyId: data.company.id, name: data.company.name, status: data.company.status });
    } catch (err) {
      toast.error(errorMessage(err, "Could not load the posting."));
      onClose();
    }
  }, [postingId, onClose]);

  useEffect(() => {
    load();
  }, [load]);

  const set = useCallback((field, value) => setForm((f) => ({ ...f, [field]: value })), []);

  const edits = () => {
    const changed = changedFields(posting, form);
    if (company?.companyId && company.companyId !== posting.company.id) changed.companyId = company.companyId;
    return changed;
  };

  const run = async (fn, after = "reload") => {
    setBusy(true);
    try {
      const res = await fn();
      toast.success(res.message || "Done.");
      onChanged();
      if (after === "close") onClose();
      else await load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    const changed = edits();
    if (!Object.keys(changed).length) return toast("Nothing changed.");
    return run(() => careersAdminApi.updatePosting(postingId, changed));
  };
  const approve = () => run(() => careersAdminApi.approvePosting(postingId, edits()), "close");
  const reject = () => {
    const text = reason === "Other" ? otherReason.trim() : reason;
    if (!text) return toast.error("Give a reason.");
    return run(() => careersAdminApi.rejectPosting(postingId, text), "close");
  };

  const pending = posting?.status === "PENDING_REVIEW";
  const sourceText = posting?.extractions?.[0]?.inputText || posting?.descriptionText || "";

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/30" role="dialog" aria-modal="true" aria-label="Review posting">
      <div className="w-full xl:max-w-7xl h-full flex flex-col bg-white shadow-xl">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-[var(--color-primary)] truncate">{posting ? posting.roleTitle : "Loading…"}</h2>
            {posting && (
              <p className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                <PostingStatus status={posting.status} /> {posting.company.name} <StatusChip status={posting.company.status} /> · #{posting.id}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"><X size={18} /></button>
        </div>

        {!posting || !form ? (
          <div className="p-5"><Skeleton rows={8} /></div>
        ) : (
          <div className="flex-1 overflow-y-auto xl:overflow-hidden xl:grid xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <aside className="p-5 space-y-4 xl:overflow-y-auto border-b xl:border-b-0 xl:border-r border-slate-100 bg-slate-50/60">
              <ConfidenceMeter value={posting.extractionConfidence} tier={posting.extractionTier} />
              <div>
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Link2 size={14} /> Seen on</h3>
                <ul className="space-y-1">
                  {posting.observations.map((o) => (
                    <li key={o.id} className="text-xs text-slate-600 flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${o.isLive ? "bg-emerald-500" : "bg-slate-300"}`} aria-hidden />
                      <span className="truncate">{o.source.name}</span>
                      <a href={o.url} target="_blank" rel="noopener noreferrer" className="ml-auto text-[var(--color-secondary)] hover:underline inline-flex items-center gap-1">Open <ExternalLink size={12} /></a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Source text</h3>
                <pre className="text-xs font-mono whitespace-pre-wrap break-words text-slate-700 max-h-[60vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">{sourceText}</pre>
              </div>
              {posting.reviews.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><History size={14} /> History</h3>
                  <ul className="space-y-1">
                    {posting.reviews.map((r) => (
                      <li key={r.id} className="text-xs text-slate-600">
                        <span className="font-semibold">{r.action}</span> by {r.byName} · {new Date(r.createdAt).toLocaleString("en-IN")}
                        {r.note && <span className="block text-slate-500">“{r.note}”</span>}
                        {r.changes && <span className="block text-slate-500">Changed: {Object.keys(r.changes).join(", ")}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>

            <section className="p-5 xl:overflow-y-auto">
              {posting.rejectReason && <p className="mb-4 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">Rejected: {posting.rejectReason}</p>}
              <PostingFields form={form} set={set} uncertain={posting.uncertainFields} confidence={posting.extractionConfidence}
                companySlot={(
                  <UncertainField id="pe-company" label="Company" uncertain={posting.uncertainFields.includes("company")} confidence={posting.extractionConfidence}
                    hint={company?.status === "CANDIDATE" ? "Candidate company: approve or merge it in Companies before publishing, or pick the right company here." : undefined}>
                    <CompanyPicker id="pe-company" value={company} onChange={setCompany} />
                  </UncertainField>
                )} />
            </section>
          </div>
        )}

        {posting && form && (
          <div className="border-t border-slate-100 px-5 py-3 bg-white">
            {rejecting ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label htmlFor="pe-reason" className="text-xs font-semibold text-slate-600">Reason</label>
                <select id="pe-reason" className={`${inputClass} sm:w-64`} value={reason} onChange={(e) => setReason(e.target.value)}>
                  {[...REJECT_REASONS, "Other"].map((r) => <option key={r}>{r}</option>)}
                </select>
                {reason === "Other" && (
                  <>
                    <label htmlFor="pe-other" className="sr-only">Other reason</label>
                    <input id="pe-other" className={inputClass} placeholder="Reason" value={otherReason} onChange={(e) => setOtherReason(e.target.value)} maxLength={500} />
                  </>
                )}
                <div className="flex gap-2 sm:ml-auto">
                  <button type="button" className={outlineButton} onClick={() => setRejecting(false)} disabled={busy}>Cancel</button>
                  <button type="button" className={dangerButton} onClick={reject} disabled={busy}>Reject posting</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {posting.status !== "REJECTED" && <button type="button" className={dangerButton} onClick={() => setRejecting(true)} disabled={busy}>Reject</button>}
                {posting.status === "LIVE" && <button type="button" className={outlineButton} onClick={() => run(() => careersAdminApi.expirePosting(postingId))} disabled={busy}>Mark expired</button>}
                {["EXPIRED", "REJECTED"].includes(posting.status) && <button type="button" className={outlineButton} onClick={() => run(() => careersAdminApi.reopenPosting(postingId))} disabled={busy}>Reopen</button>}
                <div className="flex gap-2 ml-auto">
                  {posting.status !== "REJECTED" && <button type="button" className={outlineButton} onClick={save} disabled={busy}>Save</button>}
                  {pending && <button type="button" className={primaryButton} onClick={approve} disabled={busy}>Approve &amp; publish</button>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
