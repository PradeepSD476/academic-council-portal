import React, { memo } from "react";
import { QUICK_SUGGESTIONS } from "@/lib/chatbot/categories.js";

const QuickSuggestions = memo(function QuickSuggestions({ onSelect }) {
  return (
    <div className="mt-1">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
        Quick questions
      </p>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_SUGGESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="
              inline-block px-3 py-1.5 rounded-full text-[11px] font-semibold
              bg-white text-slate-600 border border-slate-200
              hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-secondary)]
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
