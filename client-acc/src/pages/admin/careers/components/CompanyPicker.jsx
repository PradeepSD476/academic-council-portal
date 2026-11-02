// Search-and-pick a company from the registry. With allowNew, a typed name that matches nothing can
// be used as is (the server resolves it, creating a CANDIDATE company if it is really new).
// The list closes on a click outside, Escape or tabbing away, and is drawn in a portal at the input's
// position, so no card, scroll area or dialog around the picker can hide or clip it (B-27); it closes
// when the box itself is scrolled out of sight or under a sticky bar (B-48).
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../../api/careersApi";
import { StatusChip, inputClass } from "./ui";

export default function CompanyPicker({ id, value, onChange, allowNew = false }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null); // { left, width, top } or { left, width, bottom } (opens upwards)
  const wrapRef = useRef(null);
  const listRef = useRef(null);

  const place = useCallback(() => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    // B-48: the box scrolled away or under a sticky bar -> close instead of leaving the list floating.
    const hit = document.elementFromPoint(r.left + Math.min(20, r.width / 2), r.top + r.height / 2);
    if (!hit || !(wrapRef.current.contains(hit) || listRef.current?.contains(hit))) {
      setOpen(false);
      return;
    }
    const below = window.innerHeight - r.bottom;
    const up = below < 260 && r.top > below;
    setPos(up ? { left: r.left, width: r.width, bottom: window.innerHeight - r.top + 4 } : { left: r.left, width: r.width, top: r.bottom + 4 });
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
    const inside = (el) => wrapRef.current?.contains(el) || listRef.current?.contains(el);
    const onDown = (e) => { if (!inside(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false); } };
    const onFocus = (e) => { if (!inside(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("focusin", onFocus);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("focusin", onFocus);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const res = await careersAdminApi.listCompanies({ status: "ALL", q: q.trim() || undefined, limit: 8 });
        if (alive) setResults(res.data.filter((c) => c.status !== "MERGED"));
      } catch (err) {
        if (alive) toast.error(errorMessage(err, "Could not search companies."));
      }
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q, open]);

  const pick = (company) => {
    onChange({ companyId: company.id, name: company.name, status: company.status });
    setQ("");
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapRef}>
      {value && !open ? (
        <div className="flex items-center gap-2">
          <span className="flex-1 min-w-0 truncate text-sm font-semibold text-slate-800">{value.name}</span>
          {value.status ? <StatusChip status={value.status} /> : <span className="text-[10px] font-bold uppercase text-blue-700">New name</span>}
          <button type="button" className="text-xs font-semibold text-[var(--color-secondary)] hover:underline cursor-pointer" onClick={() => setOpen(true)}>Change</button>
        </div>
      ) : (
        <>
          <input id={id} className={inputClass} placeholder="Search company name or alias" value={q} autoComplete="off"
            onFocus={() => setOpen(true)} onClick={() => setOpen(true)}
            onKeyDown={(e) => { if (e.key === "ArrowDown") setOpen(true); }}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }} />
          {open && pos && createPortal(
            <ul ref={listRef} role="listbox" style={{ position: "fixed", ...pos }} className="z-[1000] max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
              {results.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => pick(c)} className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 cursor-pointer">
                    <span className="flex-1 truncate">{c.name}</span>
                    <StatusChip status={c.status} />
                  </button>
                </li>
              ))}
              {allowNew && q.trim() && !results.some((c) => c.name.toLowerCase() === q.trim().toLowerCase()) && (
                <li>
                  <button type="button" onClick={() => { onChange({ companyId: null, name: q.trim(), status: null }); setOpen(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-blue-700 hover:bg-blue-50 cursor-pointer">
                    Use “{q.trim()}” (matched or created as a candidate on save)
                  </button>
                </li>
              )}
              {!results.length && !allowNew && <li className="px-3 py-2 text-sm text-slate-500">No companies match.</li>}
              <li>
                <button type="button" onClick={() => setOpen(false)} className="w-full px-3 py-1.5 text-left text-xs text-slate-500 hover:bg-slate-50 cursor-pointer">Close</button>
              </li>
            </ul>,
            document.body,
          )}
        </>
      )}
    </div>
  );
}
