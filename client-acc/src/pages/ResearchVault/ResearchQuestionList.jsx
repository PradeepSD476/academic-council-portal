import { createElement, useContext, useEffect, useState } from 'react';
import { ArrowLeft, BookSearch, CircleHelp, Search, ThumbsUp, BookOpen, Bookmark, BriefcaseBusiness, FlaskConical, Activity, MessageCircle, ChevronDown, Send, X } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthContext from '../../context/auth/authContext';
import { researchVaultApi } from '../../api/researchVaultApi';

const extractItems = (response) => {
  const d = response?.data?.data !== undefined ? response.data.data : response?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.items)) return d.items;
  return [];
};

const extractTotal = (response) => {
  if (typeof response?.data?.pagination?.total === 'number') return response.data.pagination.total;
  const d = response?.data?.data !== undefined ? response.data.data : response?.data;
  if (typeof d?.total === 'number') return d.total;
  if (Array.isArray(d)) return d.length;
  return 0;
};

const errorMessage = (error) => error.response?.data?.message || 'Could not load discussions.';

const sections = [
  { id: 'faculty', label: 'Faculty', icon: FlaskConical },
  { id: 'experiences', label: 'Experiences', icon: BookOpen },
  { id: 'discussions', label: 'Discussion', icon: CircleHelp },
  { id: 'resources', label: 'Resources', icon: Bookmark },
  { id: 'positions', label: 'Open positions', icon: BriefcaseBusiness },
  { id: 'following', label: 'Following', icon: Activity },
];

const relativeTime = (value) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(value).toLocaleDateString();
};

export default function ResearchQuestionList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useContext(AuthContext);
  const [areas, setAreas] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [tag, setTag] = useState(searchParams.get('tag') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);

  // Sync state to URL search parameters so filters persist on refresh or navigation
  useEffect(() => {
    const nextParams = {};
    if (search) nextParams.search = search;
    if (sort && sort !== 'newest') nextParams.sort = sort;
    if (tag) nextParams.tag = tag;
    if (status && status !== 'all') nextParams.status = status;
    setSearchParams(nextParams, { replace: true });
  }, [search, sort, tag, status, setSearchParams]);
  const [followedFacultyIds, setFollowedFacultyIds] = useState(() => new Set());
  const submitQuestion = submitQuestionFactory(setFormOpen, setRefreshVersion, areas);
  const [followedAreaIds, setFollowedAreaIds] = useState(() => new Set());
  const [relevantAreas, setRelevantAreas] = useState([]);

  useEffect(() => {
    researchVaultApi.getAreas().then((response) => setAreas(extractItems(response))).catch(() => {});
    researchVaultApi.getFollows().then(({ data }) => {
      setFollowedFacultyIds(new Set(data.data?.facultyIds || []));
      setFollowedAreaIds(new Set(data.data?.areaIds || []));
    }).catch(() => {});
  }, []);

  // Compute relevant areas: user's followed areas + areas of followed faculty + areas of all faculty
  useEffect(() => {
    if (!areas.length) {
      setRelevantAreas([]);
      return;
    }
    if (!followedFacultyIds.size && !followedAreaIds.size) {
      // No follows yet: fetch all faculty to get their research areas
      researchVaultApi.getFaculty({ limit: 200 }).then((response) => {
        const facultyList = extractItems(response);
        const facultyAreaIds = new Set();
        facultyList.forEach((f) => {
          f.researchAreas?.forEach((ra) => {
            const name = typeof ra === 'string' ? ra : ra?.researchArea?.name || ra?.name;
            const match = areas.find((a) => a.name?.toLowerCase() === name?.toLowerCase() || a.id === ra?.id || a.id === ra?.researchArea?.id);
            if (match) facultyAreaIds.add(match.id);
          });
        });
        const filtered = areas.filter((a) => facultyAreaIds.has(a.id));
        setRelevantAreas(filtered.length ? filtered : areas);
      }).catch(() => { setRelevantAreas(areas); });
      return;
    }
    // User has follows: use followed areas + areas of followed faculty
    researchVaultApi.getFaculty({ limit: 200 }).then((response) => {
      const facultyList = extractItems(response);
      const relevantAreaIds = new Set(followedAreaIds);
      facultyList.forEach((f) => {
        if (followedFacultyIds.has(f.id)) {
          f.researchAreas?.forEach((ra) => {
            const name = typeof ra === 'string' ? ra : ra?.researchArea?.name || ra?.name;
            const match = areas.find((a) => a.name?.toLowerCase() === name?.toLowerCase() || a.id === ra?.id || a.id === ra?.researchArea?.id);
            if (match) relevantAreaIds.add(match.id);
          });
        }
      });
      const filtered = areas.filter((a) => relevantAreaIds.has(a.id));
      setRelevantAreas(filtered.length ? filtered : areas);
    }).catch(() => { setRelevantAreas(areas); });
  }, [areas, followedFacultyIds, followedAreaIds]);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setQuestions([]);
    setPage(1);
    const params = {
      page: 1,
      limit: 20,
      sort,
      ...(search ? { search } : {}),
      ...(tag ? { tag } : {}),
      ...(status === 'needs-reply' ? { unanswered: 'true' } : {}),
      ...(status === 'resolved' ? { resolved: 'true' } : {})
    };
    researchVaultApi.getQuestions(params).then((response) => {
      if (!active) return;
      const items = extractItems(response);
      const totalCount = extractTotal(response);
      const pagination = response?.data?.pagination;
      setQuestions(items);
      setHasMore(Boolean(pagination?.hasNext || (pagination?.page && pagination.page * 20 < totalCount)));
      setTotal(totalCount);
    }).catch((error) => {
      if (active) toast.error(errorMessage(error));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [search, sort, tag, status, refreshVersion]);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const response = await researchVaultApi.getQuestions({
        page: nextPage,
        limit: 20,
        sort,
        ...(search ? { search } : {}),
        ...(tag ? { tag } : {}),
        ...(status === 'needs-reply' ? { unanswered: 'true' } : {}),
        ...(status === 'resolved' ? { resolved: 'true' } : {})
      });
      const items = extractItems(response);
      const totalCount = extractTotal(response);
      const pagination = response?.data?.pagination;
      setQuestions((current) => [...current, ...items]);
      setPage(nextPage);
      setHasMore(Boolean(pagination?.hasNext || (pagination?.page && pagination.page * 20 < totalCount)));
      setTotal(totalCount);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoadingMore(false);
    }
  };

  const questionUrl = (id) => {
    const params = new URLSearchParams({ sort, status });
    if (tag) params.set('tag', tag);
    if (search) params.set('search', search);
    return `/dashboard/research-vault/questions/${id}?${params.toString()}`;
  };

  return (
    <div className="research-vault-theme mx-auto max-w-7xl space-y-6 pb-12 text-slate-900">
      <header>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="accent-bar h-6 rounded-full shadow-[0_0_8px_var(--color-secondary)]" />
              <h1 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-[var(--color-primary)] md:text-3xl">
                <BookSearch size={26} className="text-[var(--color-secondary)]" /> Research Vault
              </h1>
            </div>
            <p className="ml-4 text-sm text-slate-500">Find a research group, learn from student experiences, and get practical guidance for your next step.</p>
          </div>
          <button onClick={() => setFormOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95">
            <Send size={16} /> Ask a question
          </button>
        </div>
      </header>

      <nav className="vault-tabs flex items-center gap-2 overflow-x-auto px-1 pb-1 scrollbar-thin" aria-label="Research Vault sections">
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              if (id === 'discussions') return;
              navigate(`/dashboard/research-vault?section=${id}`);
            }}
            className={`inline-flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-bold whitespace-nowrap transition-all duration-200 ${id === 'discussions' ? 'is-active bg-[var(--color-secondary)] text-white shadow-[0_4px_16px_var(--color-secondary-glow)] scale-[1.02]' : 'border-slate-200 bg-white/95 text-slate-500 shadow-xs hover:border-slate-300 hover:bg-white/90 hover:text-[var(--color-primary)]'}`}
          >
            {createElement(Icon, { size: 16 })} {label}
          </button>
        ))}
      </nav>

      {/* Discussion description below tab bar */}
      <p className="ml-1 text-sm text-slate-500">Discussion — Questions and answers from the research community.</p>

      {/* Determine if any filter is non-default */}
      {(() => {
        const hasActiveFilters = search || tag || status !== 'all' || sort !== 'newest';
        return (
          <div className="vault-toolbar flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-xl sm:p-4 md:flex-row md:items-center">
            <label className="relative min-w-0 flex-1">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search discussions..."
                className="w-full rounded-xl border border-slate-200 bg-white/90 py-2.5 pl-10 pr-3 text-xs text-[var(--color-primary)] outline-none focus:border-[var(--color-secondary)]"
              />
            </label>
            <select
              aria-label="Sort discussions"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-xs font-semibold text-[var(--color-primary)] outline-none focus:border-[var(--color-secondary)] sm:w-44"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="replies">Most replies</option>
              <option value="upvoted">Most upvoted</option>
              <option value="unanswered">Unanswered first</option>
            </select>
            <select
              aria-label="Filter by research area"
              value={tag}
              onChange={(event) => setTag(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-xs font-semibold text-[var(--color-primary)] outline-none focus:border-[var(--color-secondary)] sm:w-48"
            >
              <option value="">All tags</option>
              {(areas.length > 0 ? areas : relevantAreas).map((area) => (
                <option key={area.id || area.slug} value={area.slug || area.name}>
                  {area.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-xs font-semibold text-[var(--color-primary)] outline-none focus:border-[var(--color-secondary)] sm:w-44"
            >
              <option value="all">All questions</option>
              <option value="needs-reply">Needs a reply</option>
              <option value="resolved">Resolved</option>
            </select>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearch('');
                  setSearchInput('');
                  setTag('');
                  setStatus('all');
                  setSort('newest');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:border-[var(--color-secondary)] hover:text-[var(--color-primary-accent)] hover:bg-white outline-none focus:border-[var(--color-secondary)]"
              >
                <X size={14} /> Clear filters
              </button>
            )}
          </div>
        );
      })()}

      <p className="px-1 text-xs text-slate-500">{loading ? 'Loading questions...' : `${total} question${total === 1 ? '' : 's'}`}</p>

      {!loading && questions.length === 0 && (
        <div className="academic-card flex min-h-48 items-center justify-center rounded-3xl p-8 text-center text-sm text-slate-500">
          No questions match these filters.
        </div>
      )}

      <div className="space-y-3">
        {questions.map((question) => {
          const isOwnQuestion = question.uploadedBy?.id === user?.id;
          return (
            <Link key={question.id} to={questionUrl(question.id)} className={`academic-card block rounded-2xl border-l-4 p-4 text-left transition-colors sm:p-5 ${isOwnQuestion ? 'border-l-blue-500 !bg-blue-50/50' : 'border-l-blue-300 !bg-blue-50/30'} hover:border-blue-300 hover:bg-blue-50/30`}>
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <h2 className={`min-w-0 flex-1 text-base font-bold leading-snug ${isOwnQuestion ? 'text-blue-900' : 'text-slate-950'}`}>{question.title}</h2>
                <div className="flex shrink-0 items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1"><MessageCircle size={14} /> {question.replyCount || 0}</span>
                  <span className="inline-flex items-center gap-1"><ThumbsUp size={14} /> {question.voteCount ?? question.upvotes ?? 0}</span>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className={`text-xs font-medium ${isOwnQuestion ? 'text-blue-700' : 'text-blue-700'}`}>
                  {(question.uploadedBy || question.author)?.displayName || 'ACC student'}{(question.uploadedBy || question.author)?.rollNo ? ` · ${(question.uploadedBy || question.author).rollNo}` : ''} · {relativeTime(question.createdAt)}
                </span>
                {question.isResolved && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">Resolved</span>}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(question.researchAreas || []).map((area, idx) => {
                  const areaName = typeof area === 'string' ? area : area.researchArea?.name || area.name;
                  return (
                    <span key={idx} className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                      {areaName}
                    </span>
                  );
                })}
              </div>
            </Link>
          );
        })}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            disabled={loadingMore}
            onClick={loadMore}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-[var(--color-secondary)] hover:text-[var(--color-primary-accent)] disabled:opacity-60"
          >
            {loadingMore ? 'Loading...' : 'Load 20 more'} <ChevronDown size={16} />
          </button>
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="ask-question-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-md bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 id="ask-question-title" className="text-xl font-bold">Ask the community</h2>
              <button onClick={() => setFormOpen(false)} aria-label="Close" className="rounded p-2 text-slate-500 hover:bg-slate-100">×</button>
            </div>
            <form onSubmit={submitQuestion} className="mt-5 space-y-3">
              <input name="title" required placeholder="Question title" className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" />
              <textarea name="content" required rows={5} placeholder="Write your question or details. Markdown is supported." className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" />
              <div className="flex items-center gap-3 pt-2">
                <select name="researchArea" aria-label="Research area" className="flex-1 rounded-md border border-slate-300 px-3 py-2.5 text-sm">
                  <option value="">Select a research area (optional)</option>
                  {areas.map((area) => <option key={area.id || area.name} value={area.name}>{area.name}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full rounded-xl bg-[var(--color-secondary)] px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-accent)]">Post Question</button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

// Lives inside the component below so it can close the modal and trigger a
// list refresh via state — a module-scope version of this function crashed at
// runtime with a ReferenceError (no access to component state setters).
const submitQuestionFactory = (setFormOpen, setRefreshVersion, areas = []) => async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  let chosenArea = data.researchArea || data.researchAreaIds || data.researchAreas;
  if (chosenArea && areas.length > 0) {
    const match = areas.find((a) => String(a.id) === String(chosenArea) || a.name === chosenArea);
    if (match) chosenArea = match.name;
  }
  const researchAreas = chosenArea ? [chosenArea] : [];
  try {
    await researchVaultApi.submitDiscussion({
      title: data.title,
      content: data.content,
      researchAreas,
      researchAreaIds: data.researchAreaIds ? [Number(data.researchAreaIds)] : []
    });
    toast.success('Question posted.');
    setFormOpen(false);
    form.reset();
    setRefreshVersion((version) => version + 1);
  } catch (error) {
    toast.error(errorMessage(error));
  }
};

function VaultList({ loading, empty, children }) {
  if (loading) return <div className="academic-card flex min-h-48 items-center justify-center rounded-3xl p-8 text-center text-sm text-slate-500">Loading Research Vault...</div>;
  if (!children || (Array.isArray(children) && children.length === 0)) return <div className="academic-card flex min-h-48 items-center justify-center rounded-3xl p-8 text-center text-sm text-slate-500">{empty}</div>;
  return <div className="space-y-4">{children}</div>;
}