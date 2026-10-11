import { useState } from "react";
import { CalendarCheck, NotebookPen, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { careersApi, errorMessage } from "../../../api/careersApi";
import { formatDate } from "../lib/format";

// "Applied on 3 Oct" and the student's own note on a tracked application (P6-T10, F-13). The note is
// plain text (never HTML) and only the student sees it. Shown once a status is set.
export default function ApplicationNote({ posting, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(posting.applicationNote ?? "");
  const [busy, setBusy] = useState(false);
  if (!posting.applicationStatus) return null;

  const save = async () => {
    setBusy(true);
    try {
      const data = await careersApi.setApplicationNote(posting.id, draft.trim() || null);
      onChange?.({ applicationNote: data.applicationNote });
      setEditing(false);
    } catch (err) {
      toast.error(errorMessage(err, "Could not save your note."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-1.5 text-xs text-slate-600">
      {posting.appliedAt && (
        <p className="flex items-center gap-1.5"><CalendarCheck size={14} className="text-teal-600" aria-hidden="true" /> Applied on {formatDate(posting.appliedAt)}</p>
      )}
      {editing ? (
        <div className="space-y-1.5">
          <label htmlFor={`note-${posting.id}`} className="sr-only">Your note</label>
          <textarea id={`note-${posting.id}`} rows={3} maxLength={500} value={draft} onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. OA on 12 Oct, referred by a senior"
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-[var(--color-secondary)]" />
          <div className="flex items-center gap-2">
            <button type="button" onClick={save} disabled={busy} className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-xs font-bold cursor-pointer disabled:opacity-60">{busy ? "Saving…" : "Save note"}</button>
            <button type="button" onClick={() => { setDraft(posting.applicationNote ?? ""); setEditing(false); }} disabled={busy} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">Cancel</button>
            <span className="ml-auto text-[11px] text-slate-400">{draft.length}/500</span>
          </div>
        </div>
      ) : posting.applicationNote ? (
        <div className="flex items-start gap-2">
          <p className="flex-1 min-w-0 whitespace-pre-wrap break-words text-slate-700">{posting.applicationNote}</p>
          <button type="button" onClick={() => { setDraft(posting.applicationNote); setEditing(true); }} aria-label="Edit your note" className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"><Pencil size={13} /></button>
        </div>
      ) : (
        // Its own line, apart from "Applied on …" above it.
        <div>
          <button type="button" onClick={() => { setDraft(""); setEditing(true); }} className="inline-flex items-center gap-1.5 -ml-1.5 px-1.5 py-1 rounded-md font-semibold text-[var(--color-secondary)] hover:bg-blue-50 cursor-pointer">
            <NotebookPen size={13} aria-hidden="true" /> Add a note
          </button>
        </div>
      )}
    </div>
  );
}
