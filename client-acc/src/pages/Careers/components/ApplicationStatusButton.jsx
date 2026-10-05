import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, ClipboardCheck } from "lucide-react";
import toast from "react-hot-toast";
import { careersApi, errorMessage } from "../../../api/careersApi";
import { APPLICATION_STATUSES, nextStatus, statusMeta } from "../lib/tracking";

// Your own application status for a posting. The main button moves one step (Interested → Applied →
// In progress); the arrow opens a menu with every status and "Clear". Only the student sees it.
export default function ApplicationStatusButton({ posting, onChange }) {
  const [status, setStatus] = useState(posting.applicationStatus ?? null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    const onClick = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const update = async (value) => {
    setOpen(false);
    if (busy || value === status) return;
    const before = status;
    setStatus(value);
    setBusy(true);
    try {
      await careersApi.setApplication(posting.id, value);
      onChange?.({ applicationStatus: value });
    } catch (err) {
      setStatus(before);
      toast.error(errorMessage(err, "Could not update your application status."));
    } finally {
      setBusy(false);
    }
  };

  const current = statusMeta(status);
  const next = nextStatus(status);
  const mainLabel = current ? current.label : "Track application";
  const mainTitle = next ? `Mark as ${statusMeta(next).label}` : "Change status";

  return (
    <div ref={wrapRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => (next ? update(next) : setOpen((o) => !o))}
        title={mainTitle}
        aria-label={`Application status: ${current ? current.label : "not tracked"}. ${mainTitle}.`}
        className={`inline-flex items-center gap-1.5 pl-3 pr-2.5 py-2 rounded-l-xl border text-xs font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] ${current ? current.tone : "border-slate-200 bg-white text-slate-600 hover:text-[var(--color-primary)]"}`}
      >
        <ClipboardCheck size={14} aria-hidden="true" /> {mainLabel}
      </button>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label="Choose application status"
        className={`px-2 rounded-r-xl border border-l-0 text-xs transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] ${current ? current.tone : "border-slate-200 bg-white text-slate-500 hover:text-[var(--color-primary)]"}`}
      >
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <ul id={menuId} role="menu" className="absolute left-0 top-full mt-1 z-30 w-44 py-1 rounded-xl border border-slate-200 bg-white shadow-lg">
          {APPLICATION_STATUSES.map((s) => (
            <li key={s.value} role="none">
              <button type="button" role="menuitemradio" aria-checked={status === s.value} onClick={() => update(s.value)}
                className="w-full flex items-center justify-between px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                {s.label} {status === s.value && <Check size={14} className="text-teal-600" aria-hidden="true" />}
              </button>
            </li>
          ))}
          {status && (
            <li role="none" className="border-t border-slate-100 mt-1 pt-1">
              <button type="button" role="menuitem" onClick={() => update(null)}
                className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer">
                Clear status
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
