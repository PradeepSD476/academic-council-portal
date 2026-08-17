import React, { useRef } from "react";
import { Search, X } from "lucide-react";

export default function FAQSearchBar({ value, onChange, resultCount }) {
  const inputRef = useRef(null);

  return (
    <div className="relative w-full">
      <div className="flex items-center bg-white/95 backdrop-blur-xl border border-slate-200 focus-within:border-[var(--color-secondary)] focus-within:ring-4 focus-within:ring-[var(--color-secondary)]/15 rounded-2xl px-4 py-3.5 gap-3 shadow-sm hover:shadow-md transition-all">
        <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search FAQs — hostel, fees, documents, placements, scholarships…"
          aria-label="Search FAQs"
          className="flex-1 bg-transparent text-[var(--color-primary)] placeholder-slate-400 text-sm focus:outline-none"
        />
        {value && (
          <button
            onClick={() => { onChange(""); inputRef.current?.focus(); }}
            aria-label="Clear search"
            className="text-slate-400 hover:text-[var(--color-primary-accent)] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {value && (
        <p className="text-slate-500 text-xs mt-2 pl-2">
          Found <span className="font-bold text-[var(--color-secondary)]">{resultCount}</span> matching question{resultCount !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
