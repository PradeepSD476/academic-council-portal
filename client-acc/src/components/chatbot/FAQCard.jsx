import React, { memo, useState, useCallback } from "react";
import { ChevronDown, ChevronUp, ThumbsUp, ThumbsDown } from "lucide-react";
import { PRIORITY_STYLES, getCategoryConfig } from "@/lib/chatbot/categories.js";

const FAQCard = memo(function FAQCard({ faq }) {
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'up' | 'down' | null

  const toggle = useCallback(() => setExpanded((v) => !v), []);
  const handleFeedback = useCallback((val) => {
    setFeedback((prev) => (prev === val ? null : val));
  }, []);

  const priorityStyle = PRIORITY_STYLES[faq.priority] ?? PRIORITY_STYLES.low;

  return (
    <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-md transition-all duration-200 overflow-hidden">
      {/* Orange accent line */}
      <div className="h-[2px] w-full bg-[var(--color-secondary)]" />

      <div className="p-3.5">
        {/* Header row */}
        <button
          onClick={toggle}
          aria-expanded={expanded}
          className="w-full text-left flex items-start justify-between gap-2 group cursor-pointer"
        >
          <span className="text-xs font-bold text-[var(--color-primary)] leading-snug group-hover:text-[var(--color-secondary)] transition-colors">
            {faq.question}
          </span>
          <span className="shrink-0 mt-0.5 text-slate-500 group-hover:text-[var(--color-secondary)] transition-colors">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </button>

        {/* Answer (expandable) */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            expanded ? "max-h-[500px] opacity-100 mt-2.5" : "max-h-0 opacity-0"
          }`}
        >
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
            {faq.answer}
          </p>

          {/* Footer: badges + feedback */}
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-200">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Category badge */}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-secondary)]/15 text-[var(--color-secondary)]">
                {faq.category}
              </span>

              {/* Priority badge */}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-500">
                {priorityStyle.label}
              </span>
            </div>

            {/* Feedback buttons */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-500 mr-1">Helpful?</span>
              <button
                onClick={() => handleFeedback("up")}
                aria-label="Mark as helpful"
                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                  feedback === "up"
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    : "text-gray-500 hover:text-emerald-400 hover:bg-slate-100"
                }`}
              >
                <ThumbsUp size={11} />
              </button>
              <button
                onClick={() => handleFeedback("down")}
                aria-label="Mark as not helpful"
                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                  feedback === "down"
                    ? "bg-rose-950 text-rose-400 border border-rose-800"
                    : "text-gray-500 hover:text-rose-400 hover:bg-slate-100"
                }`}
              >
                <ThumbsDown size={11} />
              </button>
            </div>
          </div>
        </div>

        {/* Collapsed preview */}
        {!expanded && (
          <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
            {faq.answer}
          </p>
        )}
      </div>
    </div>
  );
});

export default FAQCard;
