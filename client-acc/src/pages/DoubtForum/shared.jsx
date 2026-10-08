import { useState } from "react";
import { CircleCheck, ChevronLeft, ChevronRight, ChevronUp, EyeOff, Lock, Pin, X } from "lucide-react";
import { DOUBT_ADMIN_ROLES, timeAgo } from "./constants";

export function AuthorLine({ author, date, verb = "asked" }) {
  const isMod = DOUBT_ADMIN_ROLES.includes(author?.role);
  const batch = [author?.branchName, author?.admissionYear].filter(Boolean).join(" · ");
  return (
    <p className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
      <span className="font-bold text-slate-700">{author?.displayName || "Unknown"}</span>
      {isMod && (
        <span className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-[9px] uppercase tracking-wider">
          Moderator
        </span>
      )}
      {batch && !isMod && <span className="text-slate-400">{batch}</span>}
      <span className="text-slate-400">
        {verb} {timeAgo(date)}
      </span>
    </p>
  );
}

const BADGE = "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider";

export function StatusBadge({ status }) {
  return status === "RESOLVED" ? (
    <span className={`${BADGE} bg-emerald-50 border-emerald-200 text-emerald-700`}>
      <CircleCheck size={11} /> Resolved
    </span>
  ) : (
    <span className={`${BADGE} bg-amber-50 border-amber-200 text-amber-700`}>Open</span>
  );
}

export function DoubtBadges({ doubt }) {
  return (
    <>
      <StatusBadge status={doubt.status} />
      <span className={`${BADGE} bg-slate-50 border-slate-200 text-slate-600`}>{doubt.category}</span>
      {doubt.isPinned && (
        <span className={`${BADGE} bg-blue-50 border-blue-200 text-blue-700`}>
          <Pin size={11} /> Pinned
        </span>
      )}
      {doubt.isLocked && (
        <span className={`${BADGE} bg-slate-100 border-slate-300 text-slate-700`}>
          <Lock size={11} /> Locked
        </span>
      )}
      {doubt.isHidden && (
        <span className={`${BADGE} bg-rose-50 border-rose-200 text-rose-700`}>
          <EyeOff size={11} /> Hidden
        </span>
      )}
    </>
  );
}

export function VoteButton({ count, active, onClick, disabled, label = "Upvote" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={`${label} (${count})`}
      title={active ? "Remove upvote" : label}
      className={`flex flex-col items-center justify-center self-start w-11 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shrink-0 disabled:cursor-not-allowed disabled:opacity-60 ${
        active
          ? "bg-[var(--color-secondary)] border-[var(--color-secondary)] text-white"
          : "bg-white border-slate-200 text-slate-600 hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)]"
      }`}
    >
      <ChevronUp size={16} />
      {count}
    </button>
  );
}

export function Pager({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const button =
    "flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";
  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <button type="button" className={button} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={14} /> Previous
      </button>
      <span className="text-xs font-semibold text-slate-500">
        Page {page} of {totalPages}
      </span>
      <button type="button" className={button} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next <ChevronRight size={14} />
      </button>
    </div>
  );
}

// Small dialog asking why a post is being reported.
export function ReportDialog({ target, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  if (!target) return null;

  const submit = async (event) => {
    event.preventDefault();
    if (reason.trim().length < 5) return;
    setBusy(true);
    await onSubmit(reason.trim());
    setBusy(false);
    setReason("");
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-5 space-y-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Report this {target.type}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Moderators will review it. Your name is not shown to the author.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder="What is wrong with it? (spam, abusive, wrong information, …)"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[var(--color-secondary)] bg-sky-50/50"
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || reason.trim().length < 5}
            className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? "Sending…" : "Send report"}
          </button>
        </div>
      </form>
    </div>
  );
}
