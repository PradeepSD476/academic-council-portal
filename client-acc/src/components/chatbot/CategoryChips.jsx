import React, { memo } from "react";
import { CATEGORIES } from "@/lib/chatbot/categories.js";

const CategoryChips = memo(function CategoryChips({ onSelect, activeCategory }) {
  return (
    <div className="mt-2">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
        Browse by category
      </p>
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => onSelect(cat.key)}
              aria-pressed={isActive}
              className={`
                inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold
                border transition-all duration-150 cursor-pointer
                ${
                  isActive
                    ? "bg-[var(--color-secondary)] text-[var(--color-primary)] border-transparent shadow-[0_0_10px_rgba(21,135,212,0.3)]"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-[var(--color-primary)] hover:bg-slate-100"
                }
              `}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default CategoryChips;
