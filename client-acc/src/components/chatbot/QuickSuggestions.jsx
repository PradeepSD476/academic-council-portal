/**
 * QuickSuggestions – Prompt pill suggestions shown after welcome message.
 *
 * Clicking a pill fires the query directly through sendMessage.
 */
import React, { memo } from "react";
import { QUICK_SUGGESTIONS } from "@/lib/chatbot/categories.js";

const QuickSuggestions = memo(function QuickSuggestions({ onSelect }) {
  return (
    <div className="mt-3">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
        Quick questions
      </p>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_SUGGESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="
              inline-block px-2.5 py-1 rounded-full text-[11px] font-medium
              bg-blue-50 text-blue-700 border border-blue-200
              hover:bg-blue-600 hover:text-white hover:border-blue-600
              transition-all duration-150 cursor-pointer text-left
            "
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
});

export default QuickSuggestions;
