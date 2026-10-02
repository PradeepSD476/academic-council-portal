import { useEffect, useState } from "react";

const inputClass = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-[var(--color-primary)] placeholder-slate-400 bg-sky-50/50 focus:outline-none focus:border-[var(--color-secondary)] transition";

// A text input whose value lives in the URL: typing is local, and the value is committed after a
// pause, on Enter or on blur. If the URL value changes elsewhere (e.g. "Clear filters"), it resyncs.
export default function DraftInput({ value, onCommit, delay = 500, className = inputClass, ...props }) {
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    setSynced(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft === value) return undefined;
    const timer = setTimeout(() => onCommit(draft), delay);
    return () => clearTimeout(timer);
  }, [draft, value, delay, onCommit]);

  const commitNow = () => { if (draft !== value) onCommit(draft); };
  return (
    <input
      {...props}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commitNow}
      onKeyDown={(e) => { if (e.key === "Enter") commitNow(); }}
      className={className}
    />
  );
}
