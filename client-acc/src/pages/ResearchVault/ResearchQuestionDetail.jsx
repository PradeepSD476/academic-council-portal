import { useContext, useEffect, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, MessageCircle, Send, ThumbsUp } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthContext from '../../context/auth/authContext';
import { researchVaultApi } from '../../api/researchVaultApi';

const payload = (response) => response.data?.data || {};
const errorMessage = (error) => error.response?.data?.message || 'Could not load this question.';
const authorLabel = (author) => [author?.displayName || 'ACC student', author?.rollNo].filter(Boolean).join(' · ');
const adminRoles = ['RESEARCH_ADMIN', 'SUPER_ADMIN', 'FACULTY'];

function relativeTime(value) {
  if (!value) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(value).toLocaleDateString();
}

export default function ResearchQuestionDetail() {
  const { questionId } = useParams();
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const listSort = searchParams.get('sort') || 'newest';
  const tag = searchParams.get('tag') || '';
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const [question, setQuestion] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyCursor, setReplyCursor] = useState(null);
  const [hasMoreReplies, setHasMoreReplies] = useState(false);
  const [replySort, setReplySort] = useState('top');
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const listQuery = new URLSearchParams({ sort: listSort, status, ...(tag ? { tag } : {}), ...(search ? { search } : {}) }).toString();
  const listPath = `/dashboard/research-vault/questions${listQuery ? `?${listQuery}` : ''}`;
  const questionPath = (id) => id ? `/dashboard/research-vault/questions/${id}${listQuery ? `?${listQuery}` : ''}` : null;

  useEffect(() => {
    let active = true;
    setLoading(true);
    const filterParams = {
      sort: listSort,
      ...(tag ? { tag } : {}),
      ...(search ? { search } : {}),
      ...(status === 'needs-reply' ? { unanswered: 'true' } : {}),
      ...(status === 'resolved' ? { resolved: 'true' } : {})
    };
    researchVaultApi.getQuestion(questionId, filterParams).then((response) => {
      if (!active) return;
      const data = payload(response);
      setQuestion(data);
      setReplies(data.replies || []);
      setReplyCursor(data.replies_next_cursor || null);
      setHasMoreReplies(Boolean(data.replies_has_more));
      setReplySort('top');
    }).catch((error) => {
      if (active) toast.error(errorMessage(error));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [questionId, listSort, tag, search, status, refreshVersion]);

  const changeReplySort = async (sort) => {
    setReplySort(sort);
    setLoadingReplies(true);
    try {
      const data = payload(await researchVaultApi.getQuestionReplies(questionId, { sort, limit: 20 }));
      setReplies(data.items || []);
      setReplyCursor(data.next_cursor || null);
      setHasMoreReplies(Boolean(data.has_more));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoadingReplies(false);
    }
  };

  const loadMoreReplies = async () => {
    if (!replyCursor || loadingReplies) return;
    setLoadingReplies(true);
    try {
      const data = payload(await researchVaultApi.getQuestionReplies(questionId, { sort: replySort, cursor: replyCursor, limit: 20 }));
      setReplies((current) => [...current, ...(data.items || [])]);
      setReplyCursor(data.next_cursor || null);
      setHasMoreReplies(Boolean(data.has_more));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoadingReplies(false);
    }
  };

  const submitReply = async (event) => {
    event.preventDefault();
    const content = replyText.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    try {
      await researchVaultApi.replyToDiscussion(questionId, { content });
      setReplyText('');
      setRefreshVersion((version) => version + 1);
      toast.success('Reply posted.');
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleQuestionVote = async () => {
    try {
      const data = payload(await researchVaultApi.voteDiscussion(question.id));
      setQuestion((current) => ({ ...current, voteCount: data.voteCount, hasVoted: data.hasVoted }));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const toggleReplyVote = async (replyId) => {
    try {
      const data = payload(await researchVaultApi.voteReply(question.id, replyId));
      setReplies((current) => current.map((reply) => reply.id === replyId ? { ...reply, voteCount: data.voteCount, hasVoted: data.hasVoted } : reply));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const markAccepted = async (replyId) => {
    try {
      await researchVaultApi.acceptDiscussionReply(question.id, replyId);
      setRefreshVersion((version) => version + 1);
      toast.success('Answer accepted. Discussion marked resolved.');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  if (loading) return <div className="research-vault-theme mx-auto max-w-5xl py-12 text-center text-sm text-slate-500">Loading question...</div>;
  if (!question) return <div className="research-vault-theme mx-auto max-w-5xl py-12 text-center text-sm text-slate-500"><p>Question not found.</p><Link to={listPath} className="mt-3 inline-flex text-sm font-semibold text-blue-700">Back to discussions</Link></div>;

  const canAcceptAnswer = question.uploadedBy?.id === user?.id || adminRoles.includes(user?.role);
  const acceptedReply = replies.some((reply) => reply.isAccepted);

  return (
    <div className="research-vault-theme mx-auto max-w-5xl space-y-5 pb-12 text-slate-900">
      <nav className="sticky top-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:-mx-6 sm:px-6" aria-label="Question navigation">
        <Link to={listPath} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-[var(--color-primary-accent)]"><ArrowLeft size={16} /> Back to all questions</Link>
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
          {question.researchAreas?.[0] && <span className="text-xs font-semibold text-[var(--color-primary-accent)]">{question.researchAreas[0].researchArea.name}</span>}
          {question.position && question.total && <span className="text-xs text-slate-500">Question {question.position} of {question.total}</span>}
          <div className="flex items-center gap-1">
            {questionPath(question.previous_id) ? <Link title="Previous question" to={questionPath(question.previous_id)} className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><ChevronLeft size={16} /></Link> : <span className="rounded-md border border-slate-100 p-2 text-slate-300"><ChevronLeft size={16} /></span>}
            {questionPath(question.next_id) ? <Link title="Next question" to={questionPath(question.next_id)} className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><ChevronRight size={16} /></Link> : <span className="rounded-md border border-slate-100 p-2 text-slate-300"><ChevronRight size={16} /></span>}
          </div>
        </div>
      </nav>

      <article className="academic-card rounded-2xl p-5 sm:p-7">
        <div className="flex flex-wrap items-start gap-2">
          {question.researchAreas?.map(({ researchArea }) => <span key={researchArea.id} className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-800">{researchArea.name}</span>)}
          {question.isResolved && <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-800"><Check size={12} /> Resolved</span>}
        </div>
        <h1 className="mt-3 text-2xl font-bold leading-snug text-slate-950">{question.title}</h1>
        <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-slate-700">{question.content}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
          <span className="text-xs font-medium text-slate-600">{authorLabel(question.uploadedBy)}</span>
          <button onClick={toggleQuestionVote} aria-pressed={question.hasVoted || false} className={`inline-flex items-center gap-1.5 text-xs font-semibold ${question.hasVoted ? 'text-blue-700' : 'text-slate-600 hover:text-blue-700'}`}><ThumbsUp size={14} fill={question.hasVoted ? 'currentColor' : 'none'} /> {question.voteCount || 0}</button>
        </div>
      </article>

      <section aria-labelledby="reply-list-heading">
        <div className="sticky top-[57px] z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-[var(--color-canvas)]/95 py-3 backdrop-blur">
          <h2 id="reply-list-heading" className="text-lg font-bold">{question.replyCount} replies</h2>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">Sort replies
            <select value={replySort} onChange={(event) => changeReplySort(event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800">
              <option value="top">Top</option><option value="newest">New</option><option value="oldest">Oldest</option>
            </select>
          </label>
        </div>

        <div className="space-y-3 py-4">
          {replies.map((reply) => {
            const isOwnReply = reply.uploadedBy?.id === user?.id;
            return <article key={reply.id} className={`w-full max-w-[92%] rounded-xl border p-4 ${isOwnReply ? 'ml-auto border-blue-200 bg-blue-50/80 text-right' : 'mr-auto border-emerald-200 bg-emerald-50/40 text-left'}`}>
              {reply.isAccepted && <p className="mb-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-800"><CheckCircle2 size={12} /> Accepted answer</p>}
              <header className="flex flex-wrap items-center gap-2 mb-2 justify-end">
                <span className={`font-semibold text-sm ${isOwnReply ? 'text-blue-900' : 'text-slate-900'}`}>{authorLabel(reply.uploadedBy)}</span>
                <time className="text-xs text-slate-400" dateTime={reply.createdAt}>{relativeTime(reply.createdAt)}</time>
              </header>
              <p className="text-sm leading-6 text-slate-700">{reply.content}</p>
              <footer className="mt-3 flex items-center gap-4 pt-2 border-t border-slate-100 justify-end">
                {canAcceptAnswer && !acceptedReply && <button onClick={() => markAccepted(reply.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary-accent)] hover:text-[var(--color-secondary)]"><CheckCircle2 size={14} /> Mark as answer</button>}
                <button onClick={() => toggleReplyVote(reply.id)} aria-pressed={reply.hasVoted || false} className={`inline-flex items-center gap-1 text-xs font-semibold ${reply.hasVoted ? 'text-blue-700' : 'text-slate-500 hover:text-blue-700'}`}><ThumbsUp size={14} fill={reply.hasVoted ? 'currentColor' : 'none'} /> {reply.voteCount || 0}</button>
                <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[var(--color-primary-accent)]"><MessageCircle size={14} /> Reply</button>
              </footer>
              {reply.childReplyCount > 0 && <p className="mt-2 text-xs text-slate-500">{reply.childReplyCount} nested repl{reply.childReplyCount === 1 ? 'y' : 'ies'}</p>}
            </article>;
          })}
          {loadingReplies && <p className="py-4 text-center text-sm text-slate-500">Loading replies...</p>}
          {!loadingReplies && hasMoreReplies && <div className="flex justify-center"><button onClick={loadMoreReplies} className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-800">Load 20 more replies</button></div>}
          {!loadingReplies && !hasMoreReplies && <p className="py-5 text-center text-xs font-medium text-slate-500">You’ve reached the end</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm sm:p-5">
        <form onSubmit={submitReply} className="flex items-center gap-3">
          <textarea value={replyText} onChange={(event) => setReplyText(event.target.value)} rows={2} placeholder="Add to the discussion..." className="min-h-12 min-w-0 flex-1 resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-secondary)]" />
          <button disabled={!replyText.trim() || submitting} aria-label="Post reply" className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-secondary)] text-white transition-colors hover:bg-[var(--color-primary-accent)] disabled:opacity-50"><Send size={17} /></button>
        </form>
        <div aria-hidden="true" className="my-4 border-t border-slate-200" />
        <footer className="flex min-h-10 items-center justify-between gap-3 px-1">
          {questionPath(question.previous_id) ? <Link to={questionPath(question.previous_id)} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-blue-700"><ChevronLeft size={16} /> Previous question</Link> : <span />}
          {questionPath(question.next_id) ? <Link to={questionPath(question.next_id)} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-blue-700">Next question <ChevronRight size={16} /></Link> : <span />}
        </footer>
      </section>
    </div>
  );
}
