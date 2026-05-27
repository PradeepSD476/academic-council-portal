/**
 * FAQCard – Expandable FAQ card with premium styling.
 *
 * Features:
 * - Smooth height animation on expand/collapse
 * - Category + priority badges
 * - Feedback thumbs (👍 / 👎)
 * - Source chip
 * - React.memo for performance
 */
import React, { memo, useState, useCallback } from "react";
import { ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, ExternalLink } from "lucide-react";
import { PRIORITY_STYLES, getCategoryConfig } from "@/lib/chatbot/categories.js";

const FAQCard = memo(function FAQCard({ faq }) {
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'up' | 'down' | null

  const toggle = useCallback(() => setExpanded((v) => !v), []);
  const handleFeedback = useCallback((val) => {
    setFeedback((prev) => (prev === val ? null : val));
  }, []);

  const catConfig = getCategoryConfig(faq.category);
  const priorityStyle = PRIORITY_STYLES[faq.priority] ?? PRIORITY_STYLES.low;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Category color stripe */}
      <div className={`h-0.5 w-full ${catConfig?.color ?? "bg-blue-500"}`} />

      <div className="p-3.5">
        {/* Header row */}
        <button
          onClick={toggle}
          aria-expanded={expanded}
          className="w-full text-left flex items-start justify-between gap-2 group"
        >
          <span className="text-sm font-semibold text-gray-800 leading-snug group-hover:text-blue-700 transition-colors">
            {faq.question}
          </span>
          <span className="flex-shrink-0 mt-0.5 text-gray-400 group-hover:text-blue-500 transition-colors">
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </span>
        </button>

        {/* Answer (expandable) */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            expanded ? "max-h-[500px] opacity-100 mt-2.5" : "max-h-0 opacity-0"
          }`}
        >
          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
            {faq.answer}
          </p>

          {/* Footer: badges + feedback */}
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-50">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Category badge */}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  catConfig
                    ? `${catConfig.bgLight} ${catConfig.textColor}`
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {faq.category}
              </span>

              {/* Priority badge */}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${priorityStyle.bg} ${priorityStyle.text}`}
              >
                {priorityStyle.label}
              </span>
            </div>

            {/* Feedback buttons */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400 mr-1">Helpful?</span>
              <button
                onClick={() => handleFeedback("up")}
                aria-label="Mark as helpful"
                className={`p-1 rounded-full transition-colors ${
                  feedback === "up"
                    ? "bg-green-100 text-green-600"
                    : "text-gray-300 hover:text-green-500 hover:bg-green-50"
                }`}
              >
                <ThumbsUp size={11} />
              </button>
              <button
                onClick={() => handleFeedback("down")}
                aria-label="Mark as not helpful"
                className={`p-1 rounded-full transition-colors ${
                  feedback === "down"
                    ? "bg-red-100 text-red-500"
                    : "text-gray-300 hover:text-red-400 hover:bg-red-50"
                }`}
              >
                <ThumbsDown size={11} />
              </button>
            </div>
          </div>
        </div>

        {/* Collapsed preview */}
        {!expanded && (
          <p className="text-[11px] text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
            {faq.answer}
          </p>
        )}
      </div>
    </div>
  );
});

export default FAQCard;
