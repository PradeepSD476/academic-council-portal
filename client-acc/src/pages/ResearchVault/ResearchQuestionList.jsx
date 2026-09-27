import { useContext, useEffect, useState } from 'react';
import { ArrowLeft, ChevronDown, MessageCircle, Search, ThumbsUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthContext from '../../context/auth/authContext';
import { researchVaultApi } from '../../api/researchVaultApi';

const responsePayload = (response) => response.data?.data || {};
const errorMessage = (error) => error.response?.data?.message || 'Could not load discussions.';

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
  const { user } = useContext(AuthContext);
  const [areas, setAreas] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [tag, setTag] = useState('');
  const [status, setStatus] = useState('all');
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    researchVaultApi.getAreas().then((response) => setAreas(responsePayload(response).data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setQuestions([]);
    const params = {
      limit: 20,
      sort,
      ...(search ? { search } : {}),
      ...(tag ? { tag } : {}),
      ...(status === 'needs-reply' ? { unanswered: 'true' } : {}),
      ...(status === 'resolved' ? { resolved: 'true' } : {})
    };
    researchVaultApi.getQuestions(params).then((response) => {
      if (!active) return;
      const result = responsePayload(response);
      setQuestions(result.items || []);
      setCursor(result.next_cursor || null);
      setHasMore(Boolean(result.has_more));
      setTotal(result.total || 0);
    }).catch((error) => {
      if (active) toast.error(errorMessage(error));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [search, sort, tag, status]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await researchVaultApi.getQuestions({
        limit: 20,
        sort,
        cursor,
        ...(search ? { search } : {}),
        ...(tag ? { tag } : {}),
        ...(status === 'needs-reply' ? { unanswered: 'true' } : {}),
        ...(status === 'resolved' ? { resolved: 'true' } : {})
      });
      const result = responsePayload(response);
      setQuestions((current) => [...current, ...(result.items || [])]);
      setCursor(result.next_cursor || null);
      setHasMore(Boolean(result.has_more));
      setTotal(result.total || 0);
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
    <div className="research-vault-theme mx-auto max-w-7xl space-y-5 pb-12 text-slate-900">
      <header>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold text-[var(--color-primary)]">Discussion</h1>
          <button onClick={() => navigate('/dashboard/research-vault')} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95"><ArrowLeft size={16} /> Back to Research Vault</button>
        </div>
        <p className="mt-1 text-sm text-slate-500">Questions and answers from the research community.</p>
      </header>

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-lg sm:p-4 lg:flex-row lg:items-center">
        <label className="relative min-w-0 flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search questions..." className="h-11 w-full rounded-xl border border-slate-200 bg-white px-10 text-sm outline-none focus:border-[var(--color-secondary)]" />
        </label>
        <select aria-label="Sort questions" value={sort} onChange={(event) => setSort(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[var(--color-secondary)]">
          <option value="newest">Newest</option>
          <option value="replies">Most replies</option>
          <option value="upvoted">Most upvoted</option>
        </select>
        <select aria-label="Filter by research area" value={tag} onChange={(event) => setTag(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[var(--color-secondary)]">
          <option value="">All tags</option>
          {areas.map((area) => <option key={area.id} value={area.slug}>{area.name}</option>)}
        </select>
        <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[var(--color-secondary)]">
          <option value="all">All questions</option>
          <option value="needs-reply">Needs a reply</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <p className="px-1 text-xs text-slate-500">{loading ? 'Loading questions...' : `${total} question${total === 1 ? '' : 's'}`}</p>

      {!loading && questions.length === 0 && <div className="academic-card flex min-h-48 items-center justify-center rounded-3xl p-8 text-center text-sm text-slate-500">No questions match these filters.</div>}

      <div className="space-y-3">
        {questions.map((question) => {
          const isOwnQuestion = question.uploadedBy?.id === user?.id;
          return <Link key={question.id} to={questionUrl(question.id)} className={`academic-card block rounded-2xl border-l-4 p-4 text-left transition-colors sm:p-5 ${isOwnQuestion ? 'border-l-blue-500 !bg-blue-50/50' : 'border-l-emerald-300 !bg-emerald-50/30'} hover:border-blue-300 hover:bg-blue-50/30`}>
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <h2 className={`min-w-0 flex-1 text-base font-bold leading-snug ${isOwnQuestion ? 'text-blue-900' : 'text-slate-950'}`}>{question.title}</h2>
            <div className="flex shrink-0 items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1"><MessageCircle size={14} /> {question.replyCount}</span>
              <span className="inline-flex items-center gap-1"><ThumbsUp size={14} /> {question.voteCount}</span>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className={`text-xs font-medium ${isOwnQuestion ? 'text-blue-700' : 'text-emerald-800'}`}>{question.uploadedBy?.displayName || 'ACC student'}{question.uploadedBy?.rollNo ? ` · ${question.uploadedBy.rollNo}` : ''} · {relativeTime(question.createdAt)}</span>
            {question.isResolved && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Resolved</span>}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">{question.researchAreas?.map(({ researchArea }) => <span key={researchArea.id} className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-800">{researchArea.name}</span>)}</div>
        </Link>;
        })}
      </div>

      {hasMore && <div className="flex justify-center pt-2"><button disabled={loadingMore} onClick={loadMore} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-[var(--color-secondary)] hover:text-[var(--color-primary-accent)] disabled:opacity-60">{loadingMore ? 'Loading...' : 'Load 20 more'} <ChevronDown size={16} /></button></div>}
    </div>
  );
}