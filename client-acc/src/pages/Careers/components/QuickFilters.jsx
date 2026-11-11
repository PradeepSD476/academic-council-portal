import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { QUICK_FILTERS, chipChanges, filterPart, isChipActive, lastFilters, rememberFilters } from "../lib/quickFilters";

const chipClass = (active) =>
  `inline-flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full border text-xs font-semibold transition cursor-pointer ${
    active
      ? "bg-[var(--color-secondary)] border-[var(--color-secondary)] text-white"
      : "bg-white border-slate-200 text-slate-600 hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)]"
  }`;

// One-tap filters above the jobs list (P6-T3, F-27). "My last filters" brings back the filters
// from the previous visit (remembered in this browser).
export default function QuickFilters({ search, onChange, onReplace }) {
  // Read once: the filters left from before this visit. The current ones are saved as they change.
  const [previous] = useState(lastFilters);
  const current = filterPart(search);
  useEffect(() => {
    rememberFilters(new URLSearchParams(current));
  }, [current]);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mb-1" role="group" aria-label="Quick filters">
      {QUICK_FILTERS.map((chip) => {
        const active = isChipActive(search, chip);
        return (
          <button key={chip.id} type="button" aria-pressed={active} className={chipClass(active)} onClick={() => onChange(chipChanges(search, chip))}>
            {chip.label}
          </button>
        );
      })}
      {previous && previous !== current && (
        <button type="button" className={chipClass(false)} onClick={() => onReplace(new URLSearchParams(previous))} title="The filters you used last time">
          <History size={13} aria-hidden="true" /> My last filters
        </button>
      )}
    </div>
  );
}
