import React, { useState, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PRIORITY_STYLES, getCategoryConfig } from "@/lib/chatbot/categories.js";

export default function FAQAccordion({ item, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  const catConfig = getCategoryConfig(item.category);
  const priorityStyle = PRIORITY_STYLES[item.priority] ?? PRIORITY_STYLES.low;

  return (
    <div
      className={`bg-white/95 backdrop-blur-xl rounded-2xl border transition-all duration-200 overflow-hidden ${
        open
          ? "border-[var(--color-secondary)]/50 shadow-[0_0_20px_rgba(21,135,212,0.15)]"
          : "border-slate-200 hover:border-slate-300 shadow-sm"
      }`}
    >
      {/* Orange accent line when open */}
      <div className={`h-[2px] w-full ${open ? "bg-[var(--color-secondary)]" : "bg-transparent"}`} />

      <button
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left cursor-pointer"
      >
        <span className={`font-bold text-sm leading-snug ${open ? "text-[var(--color-secondary)]" : "text-[var(--color-primary)]"}`}>
          {item.question}
        </span>
        <span className={`flex-shrink-0 mt-0.5 transition-colors ${open ? "text-[var(--color-secondary)]" : "text-slate-500"}`}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Answer */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-5 pb-5">
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line mb-3.5">
            {item.answer}
          </p>
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {item.category && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--color-secondary)]/15 text-[var(--color-secondary)] border border-[var(--color-secondary)]/30">
                {item.category}
              </span>
            )}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
              {priorityStyle.label} Priority
            </span>
            {item.subcategory && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200">
                {item.subcategory}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
