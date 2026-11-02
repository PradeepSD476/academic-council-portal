import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import toast from "react-hot-toast";
import { careersApi, errorMessage } from "../../../api/careersApi";

// Bookmark toggle for a posting. Updates at once and rolls back if the server says no.
export default function SaveButton({ posting, onChange, withLabel = false }) {
  const [saved, setSaved] = useState(Boolean(posting.saved));
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    const next = !saved;
    setSaved(next);
    setBusy(true);
    try {
      await (next ? careersApi.savePosting(posting.id) : careersApi.unsavePosting(posting.id));
      onChange?.({ saved: next });
    } catch (err) {
      setSaved(!next);
      toast.error(errorMessage(err, next ? "Could not save this posting." : "Could not remove it from Saved."));
    } finally {
      setBusy(false);
    }
  };

  const Icon = saved ? BookmarkCheck : Bookmark;
  const label = saved ? "Saved" : "Save";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={withLabel ? undefined : `${saved ? "Remove from Saved" : "Save"}: ${posting.roleTitle}`}
      title={saved ? "Remove from Saved" : "Save for later"}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] ${withLabel ? "px-4 py-2.5" : "w-9 h-9"} ${saved
        ? "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
        : "border-slate-200 bg-white text-slate-500 hover:text-[var(--color-primary)] hover:border-slate-300"}`}
    >
      <Icon size={16} aria-hidden="true" />
      {withLabel && label}
    </button>
  );
}
