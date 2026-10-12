import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, ClipboardCheck, X } from "lucide-react";
import toast from "react-hot-toast";
import { careersApi, errorMessage } from "../../../api/careersApi";
import { APPLICATION_STATUSES, nextStatus, statusMeta } from "../lib/tracking";
import { menuPosition } from "../lib/menuPosition";

// Your own application status for a posting. The main button moves one step (Interested → Applied →
// In progress); the arrow opens a menu with every status and "Clear". Only the student sees it.
// The menu is drawn on <body> at the button's position (B-39), so the next card can't cover it and
// it never pushes the page sideways on a phone; it follows the button while the page scrolls and
// closes when the button is hidden, on a click outside, Escape or tabbing away.
export default function ApplicationStatusButton({ posting, onChange }) {
  const [status, setStatus] = useState(posting.applicationStatus ?? null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null); // { left, top | bottom, maxHeight }
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();

  const place = useCallback(() => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    // Hidden button (scrolled away, or under a sticky bar): close rather than float a detached menu.
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (!hit || !(wrapRef.current.contains(hit) || menuRef.current?.contains(hit))) {
      setOpen(false);
      return;
    }
    setPos(menuPosition(r, menuRef.current?.offsetHeight ?? 0, { width: window.innerWidth, height: window.innerHeight }));
  }, []);

  useLayoutEffect(() => {
    if (!open) return undefined;
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true); // any scrolling container
    return () => { window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [open, place]);

  useEffect(() => {
    if (!open) return undefined;
    const inside = (el) => wrapRef.current?.contains(el) || menuRef.current?.contains(el);
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    const onDown = (e) => { if (!inside(e.target)) setOpen(false); };
    const onFocus = (e) => { if (!inside(e.target)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("focusin", onFocus);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("focusin", onFocus);
    };
  }, [open]);

  const toggleMenu = () => {
    setPos(null);
    setOpen((o) => !o);
  };

  const update = async (value) => {
    setOpen(false);
    if (busy || value === status) return;
    // P6-T10: the note is kept with the status, so clearing the status removes it too.
    if (value === null && posting.applicationNote && !window.confirm("Clearing the status also deletes your note on this application. Clear it?")) return;
    const before = status;
    setStatus(value);
    setBusy(true);
    try {
      const data = await careersApi.setApplication(posting.id, value);
      onChange?.({ applicationStatus: value, appliedAt: data.appliedAt ?? null, applicationNote: data.applicationNote ?? null });
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
      {open && createPortal(
        <ul ref={menuRef} id={menuId} role="menu" aria-label="Application status"
          style={{ position: "fixed", ...(pos ?? { left: 0, top: 0 }), visibility: pos ? "visible" : "hidden" }}
          className="z-[1000] w-60 overflow-y-auto p-1.5 rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5">
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
        </ul>,
        document.body,
      )}
    </div>
  );
}
