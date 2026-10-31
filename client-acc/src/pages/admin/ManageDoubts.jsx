import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Eye, EyeOff, Lock, Pin, Search, Trash2, LockOpen } from "lucide-react";
import toast from "react-hot-toast";
import { apiError, doubtApi } from "../../api/doubtApi";
import { useDebounce } from "../../hooks/useDebounce";
import { AuthorLine, DoubtBadges, Pager } from "../DoubtForum/shared";
import { timeAgo } from "../DoubtForum/constants";

const PAGE_SIZE = 10;

const BTN =
  "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition";
const BTN_DANGER = `${BTN} hover:!bg-rose-50 hover:!text-rose-700 hover:!border-rose-200`;

const REPORT_TABS = [
  { value: "PENDING", label: "Needs review" },
  { value: "ACTIONED", label: "Actioned" },
  { value: "DISMISSED", label: "Dismissed" },
];

export default function ManageDoubts() {
  const [view, setView] = useState("reports");
  const [stats, setStats] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await doubtApi.getStats();
      setStats(res.data.data);
    } catch (err) {
      toast.error(apiError(err, "Could not load forum stats."));
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const tiles = [
    { label: "Reports to review", value: stats?.pendingReports, alert: stats?.pendingReports > 0 },
    { label: "Open doubts", value: stats?.open },
    { label: "Unanswered", value: stats?.unanswered },
    { label: "Resolved", value: stats?.resolved },
    { label: "Hidden", value: stats?.hidden },
  ];

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-3 mb-1 max-md:ml-8">
          <div className="w-[3px] h-6 bg-[var(--color-secondary)] rounded-full" />
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-primary)] tracking-tight">Doubt Forum</h1>
        </div>
        <p className="text-slate-500 text-sm ml-4">Review reports and keep discussions tidy.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {tiles.map((tile) => (
          <div key={tile.label} className={`p-4 rounded-2xl border bg-white shadow-xs ${tile.alert ? "border-rose-200" : "border-slate-200"}`}>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{tile.label}</p>
            <p className={`text-2xl font-extrabold mt-1 ${tile.alert ? "text-rose-600" : "text-slate-900"}`}>{tile.value ?? "–"}</p>
          </div>
        ))}
      </div>

      <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 w-fit">
        {[
          { value: "reports", label: `Reports${stats?.pendingReports ? ` (${stats.pendingReports})` : ""}` },
          { value: "discussions", label: "All discussions" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setView(tab.value)}
            aria-pressed={view === tab.value}
            className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition border ${
              view === tab.value ? "bg-white text-slate-950 border-slate-200 shadow-2xs" : "text-slate-500 hover:text-slate-900 border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === "reports" ? <ReportsPanel onChanged={loadStats} /> : <DiscussionsPanel onChanged={loadStats} />}
    </div>
  );
}

/* ------------------------------- Reports ---------------------------------- */

function ReportsPanel({ onChanged }) {
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [reports, setReports] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await doubtApi.getReports({ status, page, limit: PAGE_SIZE });
      setReports(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      toast.error(apiError(err, "Could not load reports."));
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const resolve = async (report, data) => {
    try {
      const res = await doubtApi.resolveReport(report.id, data);
      toast.success(res.data.message);
      await load();
      onChanged();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
            aria-pressed={status === tab.value}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer transition ${
              status === tab.value ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-28 rounded-2xl border border-slate-200 bg-white animate-pulse" />
      ) : reports.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-slate-300 bg-white text-center text-sm text-slate-500">
          {status === "PENDING" ? "Nothing to review. All clear." : "No reports here."}
        </div>
      ) : (
        <ul className="space-y-3">
          {reports.map((report) => (
            <li key={report.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="px-2 py-0.5 rounded-md border bg-slate-50 border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  {report.targetType === "DOUBT" ? "Doubt" : "Answer"}
                </span>
                {report.targetHidden && (
                  <span className="px-2 py-0.5 rounded-md border bg-rose-50 border-rose-200 text-rose-700 font-bold uppercase tracking-wider text-[10px]">Hidden</span>
                )}
                <span className="text-slate-500">
                  reported by <b className="text-slate-700">{report.reporter?.displayName || "Unknown"}</b> · {timeAgo(report.createdAt)}
                </span>
              </div>

              <p className="text-sm text-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-2">Reason</span>
                {report.reason}
              </p>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-bold text-slate-900">{report.threadTitle}</p>
                <p className="text-xs text-slate-600 mt-1">{report.targetExcerpt || "(no text)"}</p>
                <p className="text-[11px] text-slate-400 mt-1.5">posted by {report.targetAuthor?.displayName || "Unknown"}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link to={`/dashboard/doubts/${report.threadId}`} className={BTN}>
                  <ExternalLink size={13} /> Open thread
                </Link>
                {report.status === "PENDING" && (
                  <>
                    <button type="button" className={BTN_DANGER} onClick={() => resolve(report, { status: "ACTIONED", hideContent: true })}>
                      <EyeOff size={13} /> Hide {report.targetType === "DOUBT" ? "doubt" : "answer"}
                    </button>
                    <button type="button" className={BTN} onClick={() => resolve(report, { status: "DISMISSED" })}>
                      Dismiss
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pager page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

/* ----------------------------- Discussions -------------------------------- */

function DiscussionsPanel({ onChanged }) {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 350);
  const [page, setPage] = useState(1);
  const [doubts, setDoubts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await doubtApi.getDoubts({ page, limit: PAGE_SIZE, includeHidden: true, ...(search ? { search } : {}) });
      setDoubts(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      toast.error(apiError(err, "Could not load discussions."));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (request) => {
    try {
      const res = await request();
      toast.success(res.data.message);
      await load();
      onChanged();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const remove = (doubt) => {
    if (!window.confirm(`Permanently delete "${doubt.title}" and all its answers?`)) return;
    run(() => doubtApi.deleteDoubt(doubt.id));
  };

  return (
    <div className="space-y-3">
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setPage(1);
          }}
          placeholder="Search discussions…"
          aria-label="Search discussions"
          className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[var(--color-secondary)] bg-white"
        />
      </div>

      {loading ? (
        <div className="h-28 rounded-2xl border border-slate-200 bg-white animate-pulse" />
      ) : doubts.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-slate-300 bg-white text-center text-sm text-slate-500">No discussions found.</div>
      ) : (
        <ul className="space-y-3">
          {doubts.map((doubt) => (
            <li key={doubt.id} className={`p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5 ${doubt.isHidden ? "bg-slate-50" : "bg-white"}`}>
              <div className="flex flex-wrap items-center gap-1.5">
                <DoubtBadges doubt={doubt} />
                {doubt.pendingReports > 0 && (
                  <span className="px-2 py-0.5 rounded-md border bg-rose-50 border-rose-200 text-rose-700 font-bold uppercase tracking-wider text-[10px]">
                    {doubt.pendingReports} {doubt.pendingReports === 1 ? "report" : "reports"}
                  </span>
                )}
              </div>
              <Link to={`/dashboard/doubts/${doubt.id}`} className="block text-sm font-bold text-slate-900 hover:text-[var(--color-secondary)]">
                {doubt.title}
              </Link>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <AuthorLine author={doubt.author} date={doubt.createdAt} />
                <span className="text-[11px] text-slate-400">
                  {doubt.voteCount} {doubt.voteCount === 1 ? "upvote" : "upvotes"} · {doubt.answerCount} {doubt.answerCount === 1 ? "answer" : "answers"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button type="button" className={BTN} onClick={() => run(() => doubtApi.moderateDoubt(doubt.id, { isPinned: !doubt.isPinned }))}>
                  <Pin size={13} /> {doubt.isPinned ? "Unpin" : "Pin"}
                </button>
                <button type="button" className={BTN} onClick={() => run(() => doubtApi.moderateDoubt(doubt.id, { isLocked: !doubt.isLocked }))}>
                  {doubt.isLocked ? <LockOpen size={13} /> : <Lock size={13} />} {doubt.isLocked ? "Unlock" : "Lock"}
                </button>
                <button type="button" className={BTN} onClick={() => run(() => doubtApi.moderateDoubt(doubt.id, { isHidden: !doubt.isHidden }))}>
                  {doubt.isHidden ? <Eye size={13} /> : <EyeOff size={13} />} {doubt.isHidden ? "Unhide" : "Hide"}
                </button>
                <button type="button" className={BTN_DANGER} onClick={() => remove(doubt)}>
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pager page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
