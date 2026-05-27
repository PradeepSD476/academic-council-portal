/**
 * FAQAccordion – Expandable FAQ accordion for the /faq page.
 * Features smooth height animation, category badge, priority indicator.
 */
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
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
        open ? "border-blue-200 shadow-md" : "border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200"
      }`}
    >
      {/* Color stripe */}
      <div className={`h-0.5 w-full ${catConfig?.color ?? "bg-blue-500"}`} />

      <button
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left"
      >
        <span className={`font-semibold text-sm leading-snug ${open ? "text-blue-700" : "text-gray-800"}`}>
          {item.question}
        </span>
        <span className={`flex-shrink-0 mt-0.5 transition-colors ${open ? "text-blue-500" : "text-gray-400"}`}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Answer */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-5 pb-4">
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line mb-3">
            {item.answer}
          </p>
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {catConfig && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${catConfig.bgLight} ${catConfig.textColor}`}>
                {item.category}
              </span>
            )}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${priorityStyle.bg} ${priorityStyle.text}`}>
              {priorityStyle.label}
            </span>
            {item.subcategory && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                {item.subcategory}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
