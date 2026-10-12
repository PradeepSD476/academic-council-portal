import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare, Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import { apiError, doubtApi } from "../../api/doubtApi";
import { useDebounce } from "../../hooks/useDebounce";
import { DOUBT_CATEGORIES } from "./constants";
import { AuthorLine, DoubtBadges, Pager, VoteButton } from "./shared";

const PAGE_SIZE = 10;

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "RESOLVED", label: "Resolved" },
];

const SORTS = [
  { value: "new", label: "Newest" },
  { value: "top", label: "Most upvoted" },
  { value: "unanswered", label: "Unanswered" },
];

const FIELD =
  "border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[var(--color-secondary)] cursor-pointer";

export default function DoubtForum() {
  const navigate = useNavigate();
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 350);
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("new");
  const [mine, setMine] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await doubtApi.getDoubts({
        page,
        limit: PAGE_SIZE,
        sort,
        ...(search ? { search } : {}),
        ...(category !== "All" ? { category } : {}),
        ...(status ? { status } : {}),
        ...(mine ? { mine: true } : {}),
      });
      setDoubts(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotal(res.data.pagination?.total || 0);
    } catch (err) {
      toast.error(apiError(err, "Could not load doubts."));
    } finally {
      setLoading(false);
    }
  }, [page, search, category, status, sort, mine]);

  useEffect(() => {
    load();
  }, [load]);

  // Any filter change goes back to the first page.
  const change = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const handleVote = async (doubt) => {
    try {
      const res = await doubtApi.toggleVote(doubt.id);
      setDoubts((prev) => prev.map((d) => (d.id === doubt.id ? { ...d, ...res.data.data } : d)));
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const filtered = Boolean(search || category !== "All" || status || mine || sort === "unanswered");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1 max-md:ml-8">
            <div className="w-[3px] h-6 bg-[var(--color-secondary)] rounded-full" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-primary)] tracking-tight">Doubt Forum</h1>
          </div>
          <p className="text-slate-500 text-sm ml-4">
            Ask anything about life at IIT Patna. Answers come from fellow students and the council.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/dashboard/doubts/ask")}
          className="px-5 py-2.5 text-xs font-bold bg-[var(--color-secondary)] hover:opacity-90 text-white rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
        >
          <Plus size={15} /> Ask a doubt
        </button>
      </div>

      {/* Filters */}
      <div className="p-3 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            placeholder="Search doubts… e.g. duplicate ID card, mess rebate"
            aria-label="Search doubts"
            className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[var(--color-secondary)] bg-sky-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => change(setStatus)(tab.value)}
                aria-pressed={status === tab.value}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                  status === tab.value ? "bg-white text-slate-950 border border-slate-200 shadow-2xs" : "text-slate-500 hover:text-slate-900 border border-transparent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select value={category} onChange={(e) => change(setCategory)(e.target.value)} aria-label="Category" className={FIELD}>
            <option value="All">All categories</option>
            {DOUBT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select value={sort} onChange={(e) => change(setSort)(e.target.value)} aria-label="Sort by" className={FIELD}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer ml-1">
            <input type="checkbox" checked={mine} onChange={(e) => change(setMine)(e.target.checked)} className="accent-[var(--color-secondary)]" />
            My doubts
          </label>

          <span className="ml-auto text-[11px] font-semibold text-slate-400">
            {total} {total === 1 ? "doubt" : "doubts"}
          </span>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-2xl border border-slate-200 bg-white animate-pulse" />
          ))}
        </div>
      ) : doubts.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-slate-300 bg-white text-center">
          <MessageSquare size={28} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-700">{filtered ? "No doubts match these filters." : "No doubts yet."}</p>
          <p className="text-xs text-slate-500 mt-1">
            {filtered ? "Try a different search or clear the filters." : "Be the first to ask one."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {doubts.map((doubt) => (
            <li key={doubt.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs flex gap-3 hover:border-slate-300 transition">
              <VoteButton count={doubt.voteCount} active={doubt.hasVoted} onClick={() => handleVote(doubt)} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <DoubtBadges doubt={doubt} />
                </div>
                <Link
                  to={`/dashboard/doubts/${doubt.id}`}
                  className="block text-base font-bold text-slate-900 hover:text-[var(--color-secondary)] transition leading-snug"
                >
                  {doubt.title}
                </Link>
                {doubt.excerpt && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{doubt.excerpt}</p>}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5">
                  <AuthorLine author={doubt.author} date={doubt.createdAt} />
                  <Link
                    to={`/dashboard/doubts/${doubt.id}`}
                    className={`flex items-center gap-1.5 text-[11px] font-bold ${doubt.answerCount ? "text-slate-600" : "text-slate-400"}`}
                  >
                    <MessageSquare size={13} />
                    {doubt.answerCount} {doubt.answerCount === 1 ? "answer" : "answers"}
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pager page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
