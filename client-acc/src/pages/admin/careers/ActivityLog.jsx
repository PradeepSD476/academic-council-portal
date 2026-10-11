// Admin activity log (P7-T12, F-15): who approved, rejected, edited, expired, reopened or created a
// posting, and who merged or split companies. Read-only.
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../api/careersApi";
import { PageHeader, Skeleton, cardClass, outlineButton } from "./components/ui";
import { plural } from "./components/format";

const ACTIONS = [
  ["APPROVE", "Approved"], ["REJECT", "Rejected"], ["EDIT", "Edited"], ["EXPIRE", "Expired"], ["REOPEN", "Reopened"],
  ["CREATE_MANUAL", "Created"], ["MERGE", "Merged companies"], ["SPLIT", "Split a company"], ["UNDO", "Undid"],
];
const LABEL = Object.fromEntries(ACTIONS);
const TONE = { APPROVE: "text-emerald-700 bg-emerald-50 border-emerald-100", REJECT: "text-rose-700 bg-rose-50 border-rose-100", EXPIRE: "text-amber-700 bg-amber-50 border-amber-100" };
const selectClass = "border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 cursor-pointer";
const when = (iso) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });

function What({ e }) {
  if (e.kind === "COMPANY") {
    if (e.action === "UNDO") return <span>the {e.undoOf === "SPLIT" ? "split" : "merge"} of <b>{e.from}</b> {e.undoOf === "SPLIT" ? "and" : "into"} <b>{e.to}</b></span>;
    return e.action === "MERGE"
      ? <span><b>{e.from}</b> into <b>{e.to}</b></span>
      : <span><b>{e.to}</b> out of <b>{e.from}</b></span>;
  }
  const p = e.posting;
  return (
    <span className="min-w-0">
      <Link to={`/admin/careers/postings?status=ALL&q=${encodeURIComponent(p.roleTitle ?? "")}`} className="font-semibold text-slate-800 hover:underline break-words">{p.roleTitle ?? `Posting #${p.id}`}</Link>
      {p.company && <span className="text-slate-500"> · {p.company}</span>}
      <span className="text-slate-400"> · #{p.id}</span>
      {e.changedFields?.length > 0 && <span className="block text-[11px] text-slate-500">Changed: {e.changedFields.join(", ")}</span>}
      {e.note && <span className="block text-[11px] text-slate-500 break-words">{e.note}</span>}
    </span>
  );
}

export default function ActivityLog() {
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState(null);
  const page = Number(params.get("page")) || 1;
  const query = params.toString();

  useEffect(() => {
    let alive = true;
    careersAdminApi.getActivity(Object.fromEntries(new URLSearchParams(query)))
      .then((r) => { if (alive) setResult(r); })
      .catch((err) => toast.error(errorMessage(err, "Could not load the activity log.")));
    return () => { alive = false; };
  }, [query]);

  const set = (changes) => setParams((prev) => {
    const next = new URLSearchParams(prev);
    for (const [k, v] of Object.entries(changes)) if (v) next.set(k, v); else next.delete(k);
    if (!("page" in changes)) next.delete("page");
    return next;
  });

  return (
    <div className="space-y-6">
      <PageHeader icon={History} title="Activity log" subtitle="Who published, rejected, edited or merged what. Read-only.">
        <Link to="/admin/careers/ops" className={outlineButton}>Operations</Link>
      </PageHeader>

      <div className="flex flex-wrap gap-2">
        <label htmlFor="al-admin" className="sr-only">Admin</label>
        <select id="al-admin" className={selectClass} value={params.get("adminId") ?? ""} onChange={(e) => set({ adminId: e.target.value })}>
          <option value="">Every admin</option>
          {(result?.admins ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <label htmlFor="al-action" className="sr-only">Action</label>
        <select id="al-action" className={selectClass} value={params.get("action") ?? ""} onChange={(e) => set({ action: e.target.value })}>
          <option value="">Every action</option>
          {ACTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {!result ? <Skeleton rows={6} /> : result.data.length === 0 ? (
        <div className={`${cardClass} p-8 text-center text-sm text-slate-500`}>Nothing logged{params.get("adminId") || params.get("action") ? " for these filters" : " yet"}.</div>
      ) : (
        <>
          <ul className={`${cardClass} divide-y divide-slate-100 overflow-hidden`}>
            {result.data.map((e) => (
              <li key={e.key} className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-3 px-4 py-3 text-sm">
                <span className="sm:w-36 shrink-0 text-xs text-slate-500">{when(e.at)}</span>
                <span className="sm:w-40 shrink-0 text-xs font-semibold text-slate-700 truncate">{e.admin.name}</span>
                <span className={`self-start shrink-0 inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${TONE[e.action] ?? "text-slate-600 bg-slate-100 border-slate-200"}`}>{LABEL[e.action] ?? e.action}</span>
                <span className="flex-1 min-w-0 text-slate-700"><What e={e} /></span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{plural(result.pagination.total, "entry", "entries")}</span>
            {result.pagination.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button type="button" className={outlineButton} disabled={page <= 1} onClick={() => set({ page: page - 1 > 1 ? String(page - 1) : "" })} aria-label="Previous page"><ChevronLeft size={14} /></button>
                <span>Page {page} of {result.pagination.totalPages}</span>
                <button type="button" className={outlineButton} disabled={page >= result.pagination.totalPages} onClick={() => set({ page: String(page + 1) })} aria-label="Next page"><ChevronRight size={14} /></button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
