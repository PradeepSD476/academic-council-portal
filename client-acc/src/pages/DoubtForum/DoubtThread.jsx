import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CircleCheck, Eye, EyeOff, Flag, Lock, Pencil, Pin, RotateCcw, Trash2, LockOpen } from "lucide-react";
import toast from "react-hot-toast";
import { apiError, doubtApi } from "../../api/doubtApi";
import { Markdown, MarkdownEditor } from "../../components/Markdown";
import { buildImageMap } from "../../lib/markdown";
import { AuthorLine, DoubtBadges, ReportDialog, VoteButton } from "./shared";

const ACTION =
  "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed";
const ACTION_DANGER = `${ACTION} hover:!bg-rose-50 hover:!text-rose-700`;
const PRIMARY =
  "px-5 py-2.5 text-xs font-bold bg-[var(--color-secondary)] hover:opacity-90 text-white rounded-xl shadow-xs transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer";

export default function DoubtThread() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doubt, setDoubt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  const [answerText, setAnswerText] = useState("");
  const [posting, setPosting] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [reportTarget, setReportTarget] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await doubtApi.getDoubt(id);
      setDoubt(res.data.data);
      setMissing(false);
    } catch (err) {
      if (err?.response?.status === 404 || err?.response?.status === 400) setMissing(true);
      else toast.error(apiError(err, "Could not load this doubt."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Run an action, show its message, then refresh the thread.
  const act = async (request, { reload = true } = {}) => {
    try {
      const res = await request();
      if (res?.data?.message) toast.success(res.data.message);
      if (reload) await load();
      return res;
    } catch (err) {
      toast.error(apiError(err));
      return null;
    }
  };

  const voteDoubt = async () => {
    const res = await act(() => doubtApi.toggleVote(doubt.id), { reload: false });
    if (res) setDoubt((prev) => ({ ...prev, ...res.data.data }));
  };

  const voteAnswer = async (answer) => {
    const res = await act(() => doubtApi.toggleAnswerVote(answer.id), { reload: false });
    if (res) {
      setDoubt((prev) => ({
        ...prev,
        answers: prev.answers.map((a) => (a.id === answer.id ? { ...a, ...res.data.data } : a)),
      }));
    }
  };

  const deleteDoubt = async () => {
    if (!window.confirm("Delete this doubt and all its answers? This cannot be undone.")) return;
    const res = await act(() => doubtApi.deleteDoubt(doubt.id), { reload: false });
    if (res) navigate("/dashboard/doubts");
  };

  const deleteAnswer = (answer) => {
    if (!window.confirm("Delete this answer? This cannot be undone.")) return;
    act(() => doubtApi.deleteAnswer(answer.id));
  };

  const submitAnswer = async (event) => {
    event.preventDefault();
    if (!answerText.trim()) return toast.error("Write an answer first.");
    setPosting(true);
    const res = await act(() => doubtApi.addAnswer(doubt.id, answerText.trim()));
    setPosting(false);
    if (res) {
      setAnswerText("");
      setEditorKey((k) => k + 1); // fresh editor (back on the Write tab)
    }
  };

  const saveEdit = async (answer) => {
    if (!editText.trim()) return toast.error("Answer cannot be empty.");
    const res = await act(() => doubtApi.updateAnswer(answer.id, editText.trim()));
    if (res) setEditingId(null);
  };

  const sendReport = async (reason) => {
    const payload = reportTarget.type === "doubt" ? { doubtId: reportTarget.id, reason } : { answerId: reportTarget.id, reason };
    const res = await act(() => doubtApi.report(payload), { reload: false });
    if (res) setReportTarget(null);
  };

  const BackLink = (
    <Link
      to="/dashboard/doubts"
      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[var(--color-primary)] transition-colors max-md:ml-8"
    >
      <ArrowLeft size={16} /> All doubts
    </Link>
  );

  if (loading && !doubt) {
    return (
      <div className="space-y-4 max-w-4xl">
        {BackLink}
        <div className="h-48 rounded-2xl border border-slate-200 bg-white animate-pulse" />
        <div className="h-28 rounded-2xl border border-slate-200 bg-white animate-pulse" />
      </div>
    );
  }

  if (missing || !doubt) {
    return (
      <div className="space-y-4 max-w-4xl">
        {BackLink}
        <div className="p-10 rounded-2xl border border-dashed border-slate-300 bg-white text-center">
          <p className="text-sm font-bold text-slate-700">This doubt does not exist or was removed.</p>
        </div>
      </div>
    );
  }

  const resolved = doubt.status === "RESOLVED";
  const canAnswer = !doubt.isLocked || doubt.canModerate;
  const visibleAnswers = doubt.answers.filter((a) => !a.isHidden).length;

  return (
    <div className="space-y-5 max-w-4xl">
      {BackLink}

      {/* The doubt */}
      <article className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex gap-4">
        <VoteButton count={doubt.voteCount} active={doubt.hasVoted} onClick={voteDoubt} disabled={doubt.isHidden} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <DoubtBadges doubt={doubt} />
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">{doubt.title}</h1>
          <div className="mt-1.5">
            <AuthorLine author={doubt.author} date={doubt.createdAt} />
          </div>

          <Markdown source={doubt.body} className="mt-4" />

          <div className="flex flex-wrap items-center gap-1 mt-4 pt-3 border-t border-slate-100">
            {doubt.canEdit && (
              <>
                <button type="button" className={ACTION} onClick={() => act(() => doubtApi.setStatus(doubt.id, resolved ? "OPEN" : "RESOLVED"))}>
                  {resolved ? <RotateCcw size={13} /> : <CircleCheck size={13} />}
                  {resolved ? "Reopen" : "Mark resolved"}
                </button>
                <button type="button" className={ACTION} onClick={() => navigate(`/dashboard/doubts/${doubt.id}/edit`)}>
                  <Pencil size={13} /> Edit
                </button>
                <button type="button" className={ACTION_DANGER} onClick={deleteDoubt}>
                  <Trash2 size={13} /> Delete
                </button>
              </>
            )}
            <button type="button" className={ACTION} onClick={() => setReportTarget({ type: "doubt", id: doubt.id })}>
              <Flag size={13} /> Report
            </button>
          </div>

          {/* Moderator tools */}
          {doubt.canModerate && (
            <div className="flex flex-wrap items-center gap-1 mt-3 p-2 rounded-xl bg-indigo-50/60 border border-indigo-100">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider px-1.5">Moderator</span>
              <button type="button" className={ACTION} onClick={() => act(() => doubtApi.moderateDoubt(doubt.id, { isPinned: !doubt.isPinned }))}>
                <Pin size={13} /> {doubt.isPinned ? "Unpin" : "Pin"}
              </button>
              <button type="button" className={ACTION} onClick={() => act(() => doubtApi.moderateDoubt(doubt.id, { isLocked: !doubt.isLocked }))}>
                {doubt.isLocked ? <LockOpen size={13} /> : <Lock size={13} />} {doubt.isLocked ? "Unlock" : "Lock"}
              </button>
              <button type="button" className={ACTION} onClick={() => act(() => doubtApi.moderateDoubt(doubt.id, { isHidden: !doubt.isHidden }))}>
                {doubt.isHidden ? <Eye size={13} /> : <EyeOff size={13} />} {doubt.isHidden ? "Unhide" : "Hide"}
              </button>
            </div>
          )}
        </div>
      </article>

      {/* Answers */}
      <h2 className="text-sm font-bold text-slate-900 pt-1">
        {visibleAnswers} {visibleAnswers === 1 ? "Answer" : "Answers"}
      </h2>

      {doubt.answers.length === 0 && (
        <div className="p-6 rounded-2xl border border-dashed border-slate-300 bg-white text-center">
          <p className="text-sm text-slate-500">No answers yet. If you know this one, help out.</p>
        </div>
      )}

      <ul className="space-y-3">
        {doubt.answers.map((answer) => (
          <li
            key={answer.id}
            className={`p-4 rounded-2xl border bg-white shadow-xs flex gap-4 ${
              answer.isAccepted ? "border-emerald-300 ring-1 ring-emerald-100" : "border-slate-200"
            } ${answer.isHidden ? "opacity-60" : ""}`}
          >
            <VoteButton count={answer.voteCount} active={answer.hasVoted} onClick={() => voteAnswer(answer)} disabled={answer.isHidden} label="Upvote answer" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {answer.isAccepted && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border bg-emerald-50 border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                    <CircleCheck size={11} /> Accepted answer
                  </span>
                )}
                {answer.isHidden && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border bg-rose-50 border-rose-200 text-rose-700 text-[10px] font-bold uppercase tracking-wider">
                    <EyeOff size={11} /> Hidden from students
                  </span>
                )}
                <AuthorLine author={answer.author} date={answer.createdAt} verb="answered" />
              </div>

              {editingId === answer.id ? (
                <div className="space-y-2 mt-2">
                  <MarkdownEditor value={editText} onChange={setEditText} rows={6} initialImages={buildImageMap(answer.rawBody, answer.body)} />
                  <div className="flex justify-end gap-2">
                    <button type="button" className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                    <button type="button" className={PRIMARY} onClick={() => saveEdit(answer)}>
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <Markdown source={answer.body} />
              )}

              {editingId !== answer.id && (
                <div className="flex flex-wrap items-center gap-1 mt-2">
                  {doubt.canEdit && !answer.isHidden && (
                    <button type="button" className={ACTION} onClick={() => act(() => doubtApi.toggleAccept(answer.id))}>
                      <CircleCheck size={13} /> {answer.isAccepted ? "Un-accept" : "Accept answer"}
                    </button>
                  )}
                  {answer.canEdit && (
                    <>
                      <button
                        type="button"
                        className={ACTION}
                        onClick={() => {
                          setEditText(answer.rawBody);
                          setEditingId(answer.id);
                        }}
                      >
                        <Pencil size={13} /> Edit
                      </button>
                      <button type="button" className={ACTION_DANGER} onClick={() => deleteAnswer(answer)}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </>
                  )}
                  <button type="button" className={ACTION} onClick={() => setReportTarget({ type: "answer", id: answer.id })}>
                    <Flag size={13} /> Report
                  </button>
                  {doubt.canModerate && (
                    <button type="button" className={ACTION} onClick={() => act(() => doubtApi.moderateAnswer(answer.id, !answer.isHidden))}>
                      {answer.isHidden ? <Eye size={13} /> : <EyeOff size={13} />} {answer.isHidden ? "Unhide" : "Hide"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Your answer */}
      {canAnswer ? (
        <form onSubmit={submitAnswer} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
          <label htmlFor="answer-body" className="block text-xs font-bold text-slate-700">
            Your answer
          </label>
          <MarkdownEditor key={editorKey} id="answer-body" value={answerText} onChange={setAnswerText} rows={6} placeholder="Share what you know. Markdown and images are supported." />
          <div className="flex justify-end">
            <button type="submit" disabled={posting} className={PRIMARY}>
              {posting ? "Posting…" : "Post answer"}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Lock size={14} /> A moderator has locked this discussion. New answers are closed.
        </div>
      )}

      <ReportDialog target={reportTarget} onClose={() => setReportTarget(null)} onSubmit={sendReport} />
    </div>
  );
}
