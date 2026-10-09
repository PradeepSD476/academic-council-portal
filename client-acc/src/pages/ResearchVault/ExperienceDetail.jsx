import { useEffect, useState, useContext, createElement } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, BookOpen, Calendar, Clock, CheckCircle2, FlaskConical, MessageCircle, Send, Trash2, GraduationCap, X } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthContext from '../../context/auth/authContext';
import { researchVaultApi } from '../../api/researchVaultApi';

const EXPERIENCE_TYPE_LABELS = {
  INTERNSHIP: 'Internship',
  THESIS: 'Thesis',
  RA: 'RA',
  INDEPENDENT_PROJECT: 'Independent Project',
  COURSE_PROJECT: 'Course Project',
  OTHER: 'Other',
};

// Same author line format as the vault lists: "Name · Roll"
const authorLabel = (author) => [author?.displayName || 'ACC student', author?.rollNo].filter(Boolean).join(' · ');

export default function ExperienceDetail() {
  const { experienceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const isAdmin = ['SUPER_ADMIN', 'RESEARCH_ADMIN', 'FACULTY'].includes(user?.role);
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    researchVaultApi.getExperience(experienceId)
      .then((response) => { if (active) setExperience(response.data?.data || null); })
      .catch(() => { if (active) setError('This experience could not be found or is not available.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [experienceId]);

  useEffect(() => {
    let active = true;
    setCommentsLoading(true);
    researchVaultApi.getExperienceComments(experienceId)
      .then((response) => { if (active) setComments(response.data?.data || []); })
      .catch(() => { if (active) setComments([]); })
      .finally(() => { if (active) setCommentsLoading(false); });
    return () => { active = false; };
  }, [experienceId]);

  const postComment = async (event) => {
    event.preventDefault();
    const content = commentText.trim();
    if (!content) return;
    setPostingComment(true);
    try {
      const response = await researchVaultApi.commentOnExperience(experienceId, { content });
      setComments((prev) => [...prev, response.data?.data].filter(Boolean));
      setCommentText('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not post your comment.');
    } finally {
      setPostingComment(false);
    }
  };

  const removeComment = async (commentId) => {
    try {
      await researchVaultApi.deleteExperienceComment(experienceId, commentId);
      setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, content: '[deleted]', deleted: true } : c)));
      toast.success('Comment deleted.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete the comment.');
    }
  };

  if (loading) {
    return <div className="academic-card flex min-h-48 items-center justify-center rounded-3xl p-8 text-center text-sm text-slate-500">Loading experience…</div>;
  }
  if (error || !experience) {
    return (
      <div className="academic-card rounded-3xl p-10 text-center">
        <p className="text-sm text-slate-500">{error || 'Experience not found.'}</p>
        <button type="button" onClick={() => navigate(location.pathname.startsWith('/admin') ? '/admin/research-vault' : '/dashboard/research-vault?section=experiences')} className="mt-4 rounded-full bg-[var(--color-secondary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-accent)]">Back to Experiences</button>
      </div>
    );
  }

  // Guide line: internal faculty link, external mentor, or just a manual
  // department when there is no guide at all.
  const guideInfo = experience.externalGuideName
    ? { label: [experience.externalGuideName, experience.externalGuideAffiliation].filter(Boolean).join(' — '), external: true }
    : experience.faculty?.name
      ? { label: experience.faculty.name, external: false }
      : experience.department
        ? { label: experience.department, external: false }
        : null;

  const statusBadge = experience.status !== 'APPROVED' ? (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${experience.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
      {experience.status === 'PENDING_REVIEW' ? 'Pending review' : 'Rejected'}
    </span>
  ) : null;

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => navigate(location.pathname.startsWith('/admin') ? '/admin/research-vault' : '/dashboard/research-vault?section=experiences')} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[var(--color-primary-accent)]">
        <ArrowLeft size={14} /> Back to Experiences
      </button>

      <article className="academic-card rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          {experience.experienceType && (
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-blue-800">
              {createElement(BookOpen, { size: 11, className: 'mr-1' })}{EXPERIENCE_TYPE_LABELS[experience.experienceType] || experience.experienceType.replaceAll('_', ' ')}
            </span>
          )}
          {statusBadge}
        </div>

        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950">{experience.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{authorLabel(experience.uploadedBy)}</p>

        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-600">
          {experience.labName && <span className="inline-flex items-center gap-1"><FlaskConical size={13} /> {experience.labName}</span>}
          {guideInfo && <span className="inline-flex items-center gap-1" title={guideInfo.external ? 'External guide' : 'Guide'}><GraduationCap size={13} /> {guideInfo.label}</span>}
          {experience.duration && <span className="inline-flex items-center gap-1"><Clock size={13} /> {experience.duration}</span>}
          {experience.createdAt && <span className="inline-flex items-center gap-1"><Calendar size={13} /> {new Date(experience.createdAt).toLocaleDateString()}</span>}
        </div>

        {experience.prerequisites && (
          <p className="mt-4 text-sm text-slate-700"><span className="font-semibold text-slate-900">Prerequisites: </span>{experience.prerequisites}</p>
        )}

        <p className="mt-4 border-l-2 border-[var(--color-secondary)] pl-3 text-sm italic leading-6 text-slate-600">{experience.summary}</p>

        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{experience.description}</p>

        {experience.keyLearnings && (
          <section className="mt-5">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-900"><CheckCircle2 size={15} className="text-[var(--color-secondary)]" /> Key learnings</h2>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-slate-700">{experience.keyLearnings}</p>
          </section>
        )}

        {experience.outcome && (
          <section className="mt-5 rounded-2xl border border-[var(--color-secondary-border)] bg-[var(--color-secondary-light)] p-4">
            <h2 className="text-sm font-bold text-blue-900">Outcome</h2>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-blue-900/90">{experience.outcome}</p>
          </section>
        )}

        {experience.researchAreas?.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {experience.researchAreas.map(({ researchArea }) => (
              <span key={researchArea.id} className="rounded-full border border-[var(--color-secondary-border)] bg-[var(--color-secondary-light)] px-2 py-1 text-[11px] font-semibold text-blue-900">{researchArea.name}</span>
            ))}
          </div>
        )}

        {experience.status === 'REJECTED' && experience.reviewNote && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">Reviewer note: {experience.reviewNote}</p>
        )}
      </article>

      {/* Discussion thread — flat Q&A, same author → content → actions pattern as the Discussion tab */}
      <section aria-label="Questions and comments" className="academic-card rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm sm:p-8">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <MessageCircle size={18} className="text-[var(--color-secondary)]" />
          Questions &amp; comments ({comments.filter((c) => !c.deleted).length})
        </h2>

        {commentsLoading ? (
          <p className="py-6 text-center text-xs text-slate-500">Loading comments…</p>
        ) : comments.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">No comments yet — start the conversation.</p>
        ) : (
          <ul className="mt-5 space-y-3">
            {comments.map((comment) => (
              <li key={comment.id}>
                {comment.deleted ? (
                  <p className="py-1 text-sm italic text-slate-400">[deleted]</p>
                ) : (() => {
                  // Same chat-style bubble pattern as the Discussion tab's
                  // replies (ResearchQuestionDetail): own = right/blue,
                  // others = left/green.
                  const isOwnComment = comment.uploadedById === user?.id;
                  return (
                    <article className={`w-full max-w-[92%] rounded-xl border p-4 ${isOwnComment ? 'ml-auto border-blue-200 bg-blue-50/80 text-right' : 'mr-auto border-blue-200 bg-blue-50/40 text-left'}`}>
                      <header className="mb-2 flex flex-wrap items-center gap-2 justify-end">
                        <span className={`text-sm font-semibold ${isOwnComment ? 'text-blue-900' : 'text-slate-900'}`}>{authorLabel(comment.uploadedBy)}</span>
                        <time className="text-xs text-slate-400" dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleDateString()}</time>
                      </header>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.content}</p>
                      {(isOwnComment || isAdmin) && (
                        <footer className="mt-3 flex items-center gap-4 border-t border-slate-100 pt-2 justify-end">
                          <button type="button" onClick={() => setCommentToDelete(comment)} title="Delete comment" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600">
                            <Trash2 size={13} /> Delete
                          </button>
                        </footer>
                      )}
                    </article>
                  );
                })()}
              </li>
            ))}
          </ul>
        )}

        {/* Input anchored at the bottom, below the comment list — same
            ordering as the Discussion tab's reply section (list, then box). */}
        {user ? (
          <form onSubmit={postComment} className="mt-4 flex items-start gap-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={2}
              maxLength={5000}
              placeholder="Ask a question or share how this helped you…"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[var(--color-secondary)] outline-none resize-none"
            />
            <button type="submit" disabled={postingComment || !commentText.trim()} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--color-secondary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-accent)] disabled:opacity-50">
              <Send size={13} /> Post
            </button>
          </form>
        ) : (
          <p className="mt-4 text-xs text-slate-500">Log in to join the discussion.</p>
        )}
      </section>

      {experience.faculty && (
        <Link
          to={location.pathname.startsWith('/admin') ? '/admin/research-vault' : `/dashboard/research-vault?section=faculty&faculty=${experience.faculty.id}`}
          state={location.pathname.startsWith('/admin') ? { facultyId: experience.faculty.id } : undefined}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-[var(--color-secondary)] hover:text-[var(--color-primary-accent)]"
        >
          <GraduationCap size={13} /> View faculty profile
        </Link>
      )}

      {/* Delete-comment confirmation — same modal pattern as withdraw/unfollow */}
      {commentToDelete && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setCommentToDelete(null); }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-comment-title" aria-describedby="delete-comment-desc" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary)]">Research Vault</p>
                <h2 id="delete-comment-title" className="mt-1 text-xl font-bold text-slate-950">Delete this comment?</h2>
              </div>
              <button type="button" aria-label="Close" onClick={() => setCommentToDelete(null)} className="rounded-md p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <p id="delete-comment-desc" className="mt-3 text-sm leading-6 text-slate-600">
              It will appear in the thread as "[deleted]". This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setCommentToDelete(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Keep it</button>
              <button
                type="button"
                onClick={async () => {
                  const target = commentToDelete;
                  setCommentToDelete(null);
                  await removeComment(target.id);
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
