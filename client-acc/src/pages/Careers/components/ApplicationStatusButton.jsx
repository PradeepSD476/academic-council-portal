import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, ClipboardCheck, X } from "lucide-react";
import toast from "react-hot-toast";
import { careersApi, errorMessage } from "../../../api/careersApi";
import { APPLICATION_STATUSES, nextStatus, statusMeta } from "../lib/tracking";

const MENU_HEIGHT = 350; // px, with the "Clear status" row

// Your own application status for a posting. The main button moves one step (Interested → Applied →
// In progress); the arrow opens a menu with every status and "Clear". Only the student sees it.
export default function ApplicationStatusButton({ posting, onChange }) {
  const [status, setStatus] = useState(posting.applicationStatus ?? null);
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false); // open upward when the menu wouldn't fit below the button
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    const onClick = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    menuRef.current?.scrollIntoView({ block: "nearest" }); // a menu that opens downward in a short window scrolls into view
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const toggleMenu = () => {
    if (!open) {
      const wrap = wrapRef.current;
      const rect = wrap?.getBoundingClientRect();
      if (rect) {
        // Room inside whatever scrolls around the button (the page rail) and the window.
        const clip = wrap.closest("aside")?.getBoundingClientRect();
        const bottomEdge = Math.min(window.innerHeight, clip?.bottom ?? Infinity);
        const topEdge = Math.max(0, clip?.top ?? 0);
        setUp(rect.bottom + MENU_HEIGHT > bottomEdge && rect.top - MENU_HEIGHT >= topEdge);
      }
    }
    setOpen((o) => !o);
  };

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
        onClick={() => (next ? update(next) : toggleMenu())}
        title={mainTitle}
        aria-label={`Application status: ${current ? current.label : "not tracked"}. ${mainTitle}.`}
        className={`inline-flex items-center gap-1.5 pl-3 pr-2.5 py-2 rounded-l-xl border text-xs font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] ${current ? current.tone : "border-slate-200 bg-white text-slate-600 hover:text-[var(--color-primary)]"}`}
      >
        <ClipboardCheck size={14} aria-hidden="true" /> {mainLabel}
      </button>
      <button
        type="button"
        onClick={toggleMenu}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label="Choose application status"
        className={`px-2 rounded-r-xl border border-l-0 text-xs transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] ${current ? current.tone : "border-slate-200 bg-white text-slate-500 hover:text-[var(--color-primary)]"}`}
      >
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <ul ref={menuRef} id={menuId} role="menu" aria-label="Application status" className={`absolute left-0 ${up ? "bottom-full mb-1.5" : "top-full mt-1.5"} z-30 w-60 p-1.5 rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5`}>
          <li role="presentation" className="px-2.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Where are you with this?</li>
          {APPLICATION_STATUSES.map((s) => {
            const selected = status === s.value;
            return (
              <li key={s.value} role="none">
                <button type="button" role="menuitemradio" aria-checked={selected} onClick={() => update(s.value)}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] ${selected ? s.row : "hover:bg-slate-50"}`}>
                  <span className={`w-2.5 h-2.5 shrink-0 rounded-full ${s.dot}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-slate-800">{s.label}</span>
                    <span className="block text-[11px] leading-tight text-slate-500">{s.hint}</span>
                  </span>
                  {selected && <Check size={14} className="shrink-0 text-slate-700" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
          {status && (
            <li role="none" className="mt-1 pt-1 border-t border-slate-100">
              <button type="button" role="menuitem" onClick={() => update(null)}
                className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]">
                <X size={14} className="shrink-0" aria-hidden="true" /> Clear status
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
