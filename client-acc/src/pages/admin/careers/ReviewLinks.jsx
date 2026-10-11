// Review queue tab: links submitted by students and what happened to each one. Admins can retry a
// failed link or turn a link into a manual posting (P5-T4, F-09); nothing is deleted (D-01).
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ban, ExternalLink, PenLine, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../api/careersApi";
import { Modal, Skeleton, cardClass, dangerButton, inputClass, outlineButton } from "./components/ui";
import { safeHref } from "../../Careers/lib/format";

const STATUSES = ["NEEDS_ATTENTION", "ALL", "NEEDS_PERSON", "RECEIVED", "PROCESSING", "EXTRACTING", "PENDING_REVIEW", "STORED_ONLY", "DUPLICATE", "FAILED"];
const STATUS_LABEL = { NEEDS_ATTENTION: "needs attention", ALL: "all links", NEEDS_PERSON: "needs a person" };
const DISMISS_REASONS = ["Not a job page", "Not for students", "Already listed on the portal", "Closed", "Other"];
const STYLE = {
  FAILED: "text-rose-700 bg-rose-50 border-rose-100",
  STORED_ONLY: "text-slate-600 bg-slate-100 border-slate-200",
  DUPLICATE: "text-slate-600 bg-slate-100 border-slate-200",
  PENDING_REVIEW: "text-emerald-700 bg-emerald-50 border-emerald-100",
};

const smallButton = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer";

// total: every student link (for "Show all"); the tab badge counts the "needs attention" ones (B-26).
// onCount(n): how many links match the chosen status (shown on the tab, B-28).
export default function ReviewLinks({ refreshKey, onOpenPosting, total, onCount }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState("NEEDS_ATTENTION");
  const [items, setItems] = useState(null);
  const [reload, setReload] = useState(0);
  const [busyId, setBusyId] = useState(null);
  const [aiUsable, setAiUsable] = useState(null);
  const [dismissing, setDismissing] = useState(null);

  const retry = async (s) => {
    setBusyId(s.id);
    try {
      const res = await careersAdminApi.retrySubmission(s.id);
      toast.success(res.message);
      setReload((n) => n + 1);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };
  const createPosting = (s) => navigate(`/admin/careers/new?fromLink=${s.id}&url=${encodeURIComponent(s.url)}`);

  useEffect(() => {
    let alive = true;
    careersAdminApi.listSubmissions({ status, limit: 100 })
      .then((res) => { if (alive) { setItems(res.data); setAiUsable(res.aiUsable); onCount?.(res.pagination?.total ?? res.data.length); } })
      .catch((err) => toast.error(errorMessage(err, "Could not load student links.")));
    return () => {
      alive = false;
    };
  }, [status, refreshKey, reload, onCount]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label htmlFor="links-status" className="text-xs font-semibold text-slate-600">Status</label>
        <select id="links-status" className={`${inputClass} w-48`} value={status} onChange={(e) => { setStatus(e.target.value); setItems(null); }}>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s] ?? s.replace("_", " ").toLowerCase()}</option>)}
        </select>
      </div>
      {status === "NEEDS_ATTENTION" && (
        <p className="text-xs text-slate-500">Links you need to act on: ones that failed (retry or dismiss) and ones nothing will read automatically. This is the number on the tab.</p>
      )}
      {status === "NEEDS_PERSON" && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          Links nothing will read automatically: sites that can't be fetched (LinkedIn, Naukri, …){aiUsable === false ? ", and, while the AI step is off, pages without job-board data" : ""}. Create a posting from each, or dismiss it with a reason the student will see.
        </p>
      )}
      {!items ? <Skeleton rows={4} /> : !items.length ? (
        <div className={`${cardClass} p-8 text-center text-sm text-slate-500`}>
          {status === "NEEDS_ATTENTION" ? "No student link needs you right now." : `No student links${status !== "ALL" ? ` with status ${status.toLowerCase().replace("_", " ")}` : " yet"}.`}
          {status !== "ALL" && total > 0 && (
            <button type="button" className="ml-2 font-semibold text-[var(--color-secondary)] hover:underline cursor-pointer" onClick={() => { setStatus("ALL"); setItems(null); }}>Show all {total} links</button>
          )}
        </div>
      ) : (
        <div className={`${cardClass} overflow-hidden`}>
          <ul className="divide-y divide-slate-100">
            {items.map((s) => (
              <li key={s.id} className="px-4 py-3 space-y-1">
                <div className="flex items-center gap-2">
                  {s.dismissedAt ? (
                    <span className="px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 border-slate-200">{s.dismissedById === s.submittedById ? "Withdrawn" : "Dismissed"}</span>
                  ) : (
                    <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${STYLE[s.status] || "text-blue-700 bg-blue-50 border-blue-100"}`}>{s.status.replace("_", " ")}</span>
                  )}
                  <a href={safeHref(s.url) ?? undefined} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--color-secondary)] hover:underline truncate inline-flex items-center gap-1 min-w-0">
                    <span className="truncate">{s.url}</span> <ExternalLink size={12} className="shrink-0" />
                  </a>
                </div>
                {s.status === "EXTRACTING" && !s.dismissedAt && !s.postingId && aiUsable === false && (
                  <p className="text-xs font-semibold text-amber-700">Waiting for an admin: the AI step is off, so nothing will read this page.</p>
                )}
                <p className="text-xs text-slate-500">
                  By {s.submittedBy ?? `user #${s.submittedById}`} · {new Date(s.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  {s.postingId && <> · <button type="button" className="text-[var(--color-secondary)] hover:underline cursor-pointer" onClick={() => onOpenPosting(s.postingId)}>posting #{s.postingId}</button></>}
                </p>
                {s.note && <p className="text-xs text-slate-600">Note: {s.note}</p>}
                {s.error && <p className="text-xs text-rose-700">{s.error}</p>}
                {s.dismissedAt && (
                  <p className="text-xs text-slate-600">
                    {s.dismissedById === s.submittedById ? "Withdrawn by the student" : `Dismissed: ${s.dismissReason}`} · {new Date(s.dismissedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                )}
                {!s.dismissedAt && (s.status === "FAILED" || !s.postingId) && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {s.status === "FAILED" && (
                      <button type="button" className={smallButton} onClick={() => retry(s)} disabled={busyId === s.id}><RotateCcw size={13} aria-hidden="true" /> Retry</button>
                    )}
                    {!s.postingId && (
                      <button type="button" className={smallButton} onClick={() => createPosting(s)}><PenLine size={13} aria-hidden="true" /> Create posting from this link</button>
                    )}
                    {!s.postingId && (
                      <button type="button" className={smallButton} onClick={() => setDismissing(s)}><Ban size={13} aria-hidden="true" /> Dismiss</button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {dismissing && <DismissDialog link={dismissing} onClose={() => setDismissing(null)} onDone={() => { setDismissing(null); setReload((n) => n + 1); }} />}
    </div>
  );
}

// Dismiss a link with a reason the student sees ("Not a job page"). The row is kept (decision D-01).
function DismissDialog({ link, onClose, onDone }) {
  const [reason, setReason] = useState(DISMISS_REASONS[0]);
  const [other, setOther] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    const text = reason === "Other" ? other.trim() : reason;
    if (!text) return toast.error("Give a reason.");
    setBusy(true);
    try {
      const res = await careersAdminApi.dismissSubmission(link.id, text);
      toast.success(res.message);
      onDone();
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(false);
    }
  };
  return (
    <Modal title="Dismiss this link?" onClose={onClose}
      footer={(
        <>
          <button type="button" className={outlineButton} onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className={dangerButton} onClick={submit} disabled={busy}>Dismiss</button>
        </>
      )}>
      <p className="text-sm text-slate-700 break-all">{link.url}</p>
      <p className="mt-1 text-xs text-slate-500">It won't be processed again, and the student sees the reason. The link is kept in this list.</p>
      <label htmlFor="dl-reason" className="mt-4 block text-xs font-semibold text-slate-600">Reason (shown to the student)</label>
      <select id="dl-reason" className={`${inputClass} mt-1`} value={reason} onChange={(e) => setReason(e.target.value)}>
        {DISMISS_REASONS.map((r) => <option key={r}>{r}</option>)}
      </select>
      {reason === "Other" && (
        <>
          <label htmlFor="dl-other" className="sr-only">Other reason</label>
          <input id="dl-other" className={`${inputClass} mt-2`} value={other} maxLength={200} onChange={(e) => setOther(e.target.value)} placeholder="Reason" />
        </>
      )}
    </Modal>
  );
}
