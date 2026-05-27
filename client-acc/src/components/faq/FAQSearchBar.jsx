/**
 * FAQSearchBar – Search input for the /faq page.
 */
import React, { useRef } from "react";
import { Search, X } from "lucide-react";

export default function FAQSearchBar({ value, onChange, resultCount }) {
  const inputRef = useRef(null);

  return (
    <div className="relative">
      <div className="flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 gap-3 focus-within:bg-white/20 transition-colors">
        <Search className="w-5 h-5 text-white/70 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search FAQs — hostel, fees, documents, placement…"
          aria-label="Search FAQs"
          className="flex-1 bg-transparent text-white placeholder-white/50 text-sm focus:outline-none"
        />
        {value && (
          <button
            onClick={() => { onChange(""); inputRef.current?.focus(); }}
            aria-label="Clear search"
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {value && (
        <p className="text-blue-200 text-xs mt-2 pl-1">
          {resultCount} result{resultCount !== 1 ? "s" : ""} found
        </p>
      )}
    </div>
  );
}
