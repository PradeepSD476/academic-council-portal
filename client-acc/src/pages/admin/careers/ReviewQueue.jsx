// Admin review queue: Pending | Flagged | Candidate companies | Student links.
// Pending and Flagged never overlap (the server decides). Bulk approve only publishes clean,
// structured postings; the server skips the rest and says why.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ListChecks, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../api/careersApi";
import PostingEditor from "./PostingEditor";
import ReviewCandidates from "./ReviewCandidates";
import ReviewLinks from "./ReviewLinks";
import { Modal, PageHeader, Skeleton, StatusChip, cardClass, outlineButton, primaryButton } from "./components/ui";
import { plural } from "./components/format";

const TABS = [
  { key: "pending", label: "Pending", count: "pending" },
  { key: "flagged", label: "Flagged", count: "flagged" },
  { key: "candidates", label: "Candidate companies", count: "candidates" },
  { key: "links", label: "Student links", count: "submissions" },
];
const PAGE_SIZE = 25;
const TYPE_LABEL = { INTERNSHIP: "Internship", FULL_TIME: "Full-time", UNKNOWN: "Type not stated" };

function EmptyQueue({ tab }) {
  const [ops, setOps] = useState(null);
  useEffect(() => {
    careersAdminApi.getOps().then(setOps).catch(() => setOps(null));
  }, []);
  const lastRun = ops?.sources.list.map((s) => s.lastRunAt).filter(Boolean).sort().pop();
  const fetched = ops?.sources.list.reduce((n, s) => n + (s.lastFetchedCount ?? 0), 0);
  return (
    <div className={`${cardClass} p-8 text-center text-sm text-slate-500`}>
      No {tab === "flagged" ? "flagged postings" : "postings waiting for review"}.
      {lastRun && ` Last ingestion: ${new Date(lastRun).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}, ${fetched} jobs fetched, ${ops.postings.newLast24h} new postings in the last 24 hours.`}
    </div>
  );
}

export default function ReviewQueue() {
  const [tab, setTab] = useState("pending");
  const [page, setPage] = useState(1);
  const [list, setList] = useState(null);
  const [counts, setCounts] = useState({});
  const [selected, setSelected] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  const closeEditor = useCallback(() => setOpenId(null), []);

  const load = useCallback(async () => {
    try {
      // Postings tabs list postings; the other tabs still need the counts for the tab badges.
      const res = await careersAdminApi.listReview({ tab: tab === "flagged" ? "flagged" : "pending", page: tab === "pending" || tab === "flagged" ? page : 1, limit: PAGE_SIZE });
      setCounts(res.counts);
      if (tab === "pending" || tab === "flagged") setList(res);
    } catch (err) {
      toast.error(errorMessage(err, "Could not load the review queue."));
    }
  }, [tab, page]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const switchTab = (key) => {
    setTab(key);
    setPage(1);
    setSelected([]);
    setList(null);
  };

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const items = list?.data ?? [];
  const allSelected = items.length > 0 && items.every((p) => selected.includes(p.id));

  const bulkApprove = async () => {
    setConfirming(false);
    setBusy(true);
    try {
      const res = await careersAdminApi.bulkApprove(selected);
      toast.success(res.message);
      if (res.data.skipped.length) toast(`Skipped: ${res.data.skipped.map((s) => `#${s.id} (${s.reason})`).join("; ")}`, { duration: 8000 });
      setSelected([]);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const postingTab = tab === "pending" || tab === "flagged";

  return (
    <div className="space-y-6">
      <PageHeader icon={ListChecks} title="Jobs review" subtitle="Nothing reaches students until an admin approves it here.">
        <Link to="/admin/careers/new" className={primaryButton}><Plus size={14} /> Add posting</Link>
      </PageHeader>

      <div className="flex gap-1.5 flex-wrap" role="tablist" aria-label="Review queue">
        {TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => switchTab(t.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${tab === t.key ? "bg-white text-slate-950 font-bold border border-slate-200 shadow-xs" : "text-slate-600 hover:bg-white/80"}`}>
            {t.label}{counts[t.count] !== undefined && <span className="ml-1.5 text-slate-500">{counts[t.count]}</span>}
          </button>
        ))}
      </div>

      {tab === "flagged" && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          Flagged postings have a field the extractor was unsure about (highlighted in the editor) or low confidence. Check them one by one.
        </p>
      )}

      {tab === "candidates" && <ReviewCandidates onChanged={refresh} refreshKey={refreshKey} />}
      {tab === "links" && <ReviewLinks refreshKey={refreshKey} onOpenPosting={setOpenId} />}

      {postingTab && (!list ? <Skeleton rows={6} /> : items.length === 0 ? <EmptyQueue tab={tab} /> : (
        <>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? [] : items.map((p) => p.id))} className="w-4 h-4 accent-[var(--color-primary)]" />
              Select page
            </label>
            {selected.length > 0 && (
              <button type="button" className={primaryButton} onClick={() => setConfirming(true)} disabled={busy}>Approve {plural(selected.length, "selected posting")}</button>
            )}
          </div>
          <div className={`${cardClass} overflow-hidden`}>
            <ul className="divide-y divide-slate-100">
              {items.map((p) => (
                <li key={p.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition">
                  <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} aria-label={`Select ${p.roleTitle}`} className="mt-1 w-4 h-4 accent-[var(--color-primary)]" />
                  <button type="button" onClick={() => setOpenId(p.id)} className="flex-1 min-w-0 text-left cursor-pointer">
                    <span className="block text-sm font-semibold text-slate-800">{p.roleTitle}</span>
                    <span className="block text-xs text-slate-500">
                      {p.company.name} · {TYPE_LABEL[p.type]} · {p.location || "Location not stated"} · {plural(p._count.observations, "source")}
                    </span>
                    {p.uncertainFields.length > 0 && (
                      <span className="mt-1 flex flex-wrap gap-1">
                        {p.uncertainFields.map((f) => <span key={f} className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">Unsure: {f}</span>)}
                      </span>
                    )}
                  </button>
                  <span className="flex flex-col items-end gap-1 shrink-0">
                    {p.company.status !== "ACTIVE" && <StatusChip status={p.company.status} />}
                    <span className="text-[11px] text-slate-500">{p.extractionConfidence !== null ? `conf ${p.extractionConfidence.toFixed(2)}` : "manual"}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {list.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{plural(list.pagination.total, "posting")}</span>
              <div className="flex items-center gap-2">
                <button type="button" className={outlineButton} disabled={page <= 1} onClick={() => setPage((x) => x - 1)} aria-label="Previous page"><ChevronLeft size={14} /></button>
                <span>Page {page} of {list.pagination.totalPages}</span>
                <button type="button" className={outlineButton} disabled={page >= list.pagination.totalPages} onClick={() => setPage((x) => x + 1)} aria-label="Next page"><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </>
      ))}

      {openId && <PostingEditor postingId={openId} onClose={closeEditor} onChanged={refresh} />}

      {confirming && (
        <BulkApproveDialog postings={items.filter((p) => selected.includes(p.id))} count={selected.length}
          onCancel={() => setConfirming(false)} onConfirm={bulkApprove} />
      )}
    </div>
  );
}

// Publishing is one click away from every student, so bulk approve asks first and shows what it covers.
function BulkApproveDialog({ postings, count, onCancel, onConfirm }) {
  const shown = postings.slice(0, 5);
  const more = count - shown.length;
  return (
    <Modal title={`Publish ${plural(count, "posting")}?`} onClose={onCancel}
      footer={(
        <>
          <button type="button" className={outlineButton} onClick={onCancel}>Cancel</button>
          <button type="button" className={primaryButton} onClick={onConfirm}>Publish {plural(count, "posting")}</button>
        </>
      )}>
      <p className="text-sm text-slate-600">These go live for every student right away:</p>
      <ul className="mt-2 space-y-1 text-sm text-slate-800">
        {shown.map((p) => <li key={p.id} className="truncate">{p.roleTitle} <span className="text-slate-500">· {p.company.name}</span></li>)}
        {more > 0 && <li className="text-slate-500">and {more} more</li>}
      </ul>
      <p className="mt-3 text-xs text-slate-500">Postings with unsure fields, low confidence or a candidate company are skipped; open those one by one.</p>
    </Modal>
  );
}
