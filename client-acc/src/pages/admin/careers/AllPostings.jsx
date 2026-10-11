// Admin: every posting in any status (P5-T1, F-01), so an approved posting can be found again to fix
// or take down. Filters live in the URL; each row opens the posting editor.
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Layers, ListChecks, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../api/careersApi";
import PostingEditor from "./PostingEditor";
import CompanyPicker from "./components/CompanyPicker";
import ReportCount from "./components/ReportCount";
import PostingStatusChip from "./components/PostingStatusChip";
import TakeDownDialog from "./components/TakeDownDialog";
import MergePostingsDialog from "./components/MergePostingsDialog";
import { PageHeader, Skeleton, StatusChip, cardClass, inputClass, outlineButton } from "./components/ui";
import { plural } from "./components/format";

const STATUSES = [
  { key: "LIVE", label: "Live" },
  { key: "PENDING_REVIEW", label: "Waiting for review" },
  { key: "EXPIRED", label: "Expired" },
  { key: "REJECTED", label: "Rejected" },
  { key: "ALL", label: "All" },
];
const TIERS = [
  { key: "STRUCTURED", label: "Job board" },
  { key: "JSON_LD", label: "Page data (JSON-LD)" },
  { key: "LLM_FAST", label: "AI-read" },
  { key: "LLM_STRONG", label: "AI-read (strong)" },
  { key: "MANUAL", label: "Added by an admin" },
];
const TIER_LABEL = Object.fromEntries(TIERS.map((t) => [t.key, t.label]));
const EXPIRED_WHY = { BOARD: "left its job board", ADMIN: "expired by an admin", DEADLINE: "deadline passed" };
const selectClass = `${inputClass} py-2 cursor-pointer`;

const day = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null);

function useDebounced(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function AllPostings() {
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState(null);
  const [sources, setSources] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [takingDown, setTakingDown] = useState(null); // a LIVE row
  const [merging, setMerging] = useState(null); // the row that merges away (P7-T8)
  const [refreshKey, setRefreshKey] = useState(0);
  const [qDraft, setQDraft] = useState(params.get("q") ?? "");
  const q = useDebounced(qDraft.trim(), 300);

  const status = params.get("status") || "LIVE";
  const page = Number(params.get("page")) || 1;
  const query = params.toString();

  const set = useCallback((changes) => setParams((prev) => {
    const next = new URLSearchParams(prev);
    for (const [k, v] of Object.entries(changes)) { if (v === undefined || v === null || v === "") next.delete(k); else next.set(k, String(v)); }
    if (!("page" in changes)) next.delete("page");
    return next;
  }, { replace: true }), [setParams]);

  // The debounced search box writes to the URL.
  useEffect(() => {
    if ((params.get("q") ?? "") !== q) set({ q });
  }, [q, params, set]);

  useEffect(() => {
    careersAdminApi.listSources().then((res) => setSources(res.data)).catch(() => setSources([]));
  }, []);

  useEffect(() => {
    let alive = true;
    const p = Object.fromEntries(new URLSearchParams(query));
    delete p.company; // display name only
    careersAdminApi.listAllPostings(p)
      .then((res) => { if (alive) setResult(res); })
      .catch((err) => { if (alive) toast.error(errorMessage(err, "Could not load postings.")); });
    return () => { alive = false; };
  }, [query, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  const closeEditor = useCallback(() => setOpenId(null), []);
  const counts = result?.counts ?? {};
  const items = result?.data ?? [];
  const company = params.get("companyId") ? { companyId: Number(params.get("companyId")), name: params.get("company") || `Company #${params.get("companyId")}`, status: "ACTIVE" } : null;
  const filtered = ["companyId", "sourceId", "tier", "hasDeadline", "reported", "q"].some((k) => params.get(k));

  return (
    <div className="space-y-6">
      <PageHeader icon={Layers} title="All postings" subtitle="Every posting in any status. Open one to edit it, take it down or reopen it.">
        <Link to="/admin/careers/review" className={outlineButton}><ListChecks size={14} /> Review queue</Link>
      </PageHeader>

      <div className="flex gap-1.5 flex-wrap" role="tablist" aria-label="Posting status">
        {STATUSES.map((s) => (
          <button key={s.key} type="button" role="tab" aria-selected={status === s.key} onClick={() => set({ status: s.key === "LIVE" ? "" : s.key })}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${status === s.key ? "bg-white text-slate-950 font-bold border border-slate-200 shadow-xs" : "text-slate-600 hover:bg-white/80"}`}>
            {s.label}{counts[s.key] !== undefined && <span className="ml-1.5 text-slate-500">{counts[s.key]}</span>}
          </button>
        ))}
      </div>

      <div className={`${cardClass} p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3`}>
        <div className="relative sm:col-span-2 lg:col-span-1">
          <label htmlFor="ap-q" className="sr-only">Search title or company</label>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input id="ap-q" className={`${inputClass} pl-8 py-2`} placeholder="Search title or company" value={qDraft} maxLength={100} onChange={(e) => setQDraft(e.target.value)} />
        </div>
        <div>
          <label htmlFor="ap-company" className="sr-only">Company</label>
          {company ? (
            <div className="flex items-center gap-2 h-full border border-slate-200 rounded-xl px-3 py-1.5 bg-sky-50/50">
              <span className="flex-1 min-w-0 truncate text-sm font-semibold text-slate-800">{company.name}</span>
              <button type="button" className="p-1 rounded-lg text-slate-500 hover:bg-white cursor-pointer" aria-label="Clear company filter" onClick={() => set({ companyId: "", company: "" })}><X size={14} /></button>
            </div>
          ) : (
            <CompanyPicker id="ap-company" value={null} onChange={(c) => c.companyId && set({ companyId: c.companyId, company: c.name })} />
          )}
        </div>
        <div>
          <label htmlFor="ap-source" className="sr-only">Source</label>
          <select id="ap-source" className={selectClass} value={params.get("sourceId") ?? ""} onChange={(e) => set({ sourceId: e.target.value })}>
            <option value="">Any source</option>
            {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="ap-tier" className="sr-only">How it was collected</label>
          <select id="ap-tier" className={selectClass} value={params.get("tier") ?? ""} onChange={(e) => set({ tier: e.target.value })}>
            <option value="">Any collection method</option>
            {TIERS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="ap-deadline" className="sr-only">Deadline</label>
          <select id="ap-deadline" className={selectClass} value={params.get("hasDeadline") ?? ""} onChange={(e) => set({ hasDeadline: e.target.value })}>
            <option value="">With or without a deadline</option>
            <option value="yes">Deadline stated</option>
            <option value="no">No deadline stated</option>
          </select>
        </div>
        <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer px-1">
          <input type="checkbox" className="w-4 h-4 accent-[var(--color-primary)]" checked={params.get("reported") === "yes"} onChange={(e) => set({ reported: e.target.checked ? "yes" : "" })} />
          Reported by students
        </label>
        <div>
          <label htmlFor="ap-sort" className="sr-only">Sort</label>
          <select id="ap-sort" className={selectClass} value={params.get("sort") ?? "newest"} onChange={(e) => set({ sort: e.target.value === "newest" ? "" : e.target.value })}>
            <option value="newest">Newest first</option>
            <option value="lastSeen">Recently confirmed live</option>
            <option value="deadline">Deadline (soonest first)</option>
          </select>
        </div>
      </div>

      {!result ? <Skeleton rows={6} /> : items.length === 0 ? (
        <div className={`${cardClass} p-8 text-center text-sm text-slate-500`}>
          No {status === "ALL" ? "" : `${STATUSES.find((s) => s.key === status)?.label.toLowerCase()} `}postings{filtered ? " match these filters" : ""}.
          {filtered && <button type="button" className="ml-2 font-semibold text-[var(--color-secondary)] hover:underline cursor-pointer" onClick={() => { setQDraft(""); set({ q: "", companyId: "", company: "", sourceId: "", tier: "", hasDeadline: "", reported: "" }); }}>Clear filters</button>}
        </div>
      ) : (
        <>
          <div className={`${cardClass} overflow-hidden`}>
            <ul className="divide-y divide-slate-100">
              {items.map((p) => (
                <li key={p.id} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 px-4 py-3 hover:bg-slate-50 transition">
                  <button type="button" onClick={() => setOpenId(p.id)} className="flex-1 min-w-0 text-left cursor-pointer">
                    <span className="flex flex-wrap items-center gap-2">
                      <PostingStatusChip status={p.status} />
                      <span className="text-sm font-semibold text-slate-800 break-words">{p.roleTitle}</span>
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {p.company.name} · {p.location || "Location not stated"} · {TIER_LABEL[p.extractionTier]} · #{p.id}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-slate-500">
                      {p.publishedAt ? `Published ${day(p.publishedAt)}` : `First seen ${day(p.firstSeenAt)}`}
                      {p.status === "LIVE" && ` · confirmed live ${day(p.lastSeenLiveAt)}`}
                      {p.deadlineStated && ` · deadline stated ${new Date(p.deadlineStated).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" })}`}
                      {p.status === "EXPIRED" && p.expiredReason && ` · ${EXPIRED_WHY[p.expiredReason]}`}
                      {p.status === "REJECTED" && p.rejectReason && ` · ${p.rejectReason}`}
                    </span>
                  </button>
                  <span className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    {p.company.status !== "ACTIVE" && <StatusChip status={p.company.status} />}
                    {p._count.reports > 0 && <ReportCount count={p._count.reports} />}
                    <span className="text-[11px] text-slate-500">{plural(p._count.saves, "save")} · {p._count.applications} tracking · {plural(p.applyClicks ?? 0, "apply click")}</span>
                    {p.status === "LIVE" && (
                      <button type="button" onClick={() => setTakingDown(p)} className="text-xs font-semibold text-rose-700 hover:underline cursor-pointer">Take down</button>
                    )}
                    {p.status !== "REJECTED" && (
                      <button type="button" onClick={() => setMerging(p)} className="text-xs font-semibold text-slate-600 hover:text-[var(--color-secondary)] hover:underline cursor-pointer">Merge into…</button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{plural(result.pagination.total, "posting")}</span>
            {result.pagination.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button type="button" className={outlineButton} disabled={page <= 1} onClick={() => set({ page: page - 1 })} aria-label="Previous page"><ChevronLeft size={14} /></button>
                <span>Page {page} of {result.pagination.totalPages}</span>
                <button type="button" className={outlineButton} disabled={page >= result.pagination.totalPages} onClick={() => set({ page: page + 1 })} aria-label="Next page"><ChevronRight size={14} /></button>
              </div>
            )}
          </div>
        </>
      )}

      {openId && <PostingEditor postingId={openId} onClose={closeEditor} onChanged={refresh} />}
      {merging && <MergePostingsDialog drop={merging} onClose={() => setMerging(null)} onDone={() => { setMerging(null); refresh(); }} />}
      {takingDown && <TakeDownDialog posting={takingDown} onClose={() => setTakingDown(null)} onDone={() => { setTakingDown(null); refresh(); }} />}
    </div>
  );
}
