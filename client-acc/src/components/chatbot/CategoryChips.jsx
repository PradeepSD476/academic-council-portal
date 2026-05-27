/**
 * CategoryChips – Horizontally scrollable category quick-filter chips.
 *
 * Uses CATEGORIES config (no hardcoded strings).
 * React.memo + useCallback for zero unnecessary re-renders.
 */
import React, { memo, useMemo } from "react";
import { CATEGORIES } from "@/lib/chatbot/categories.js";

const CategoryChips = memo(function CategoryChips({ onSelect, activeCategory }) {
  return (
    <div className="mt-3">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
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
                inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium
                border transition-all duration-150 cursor-pointer
                ${
                  isActive
                    ? `${cat.color} text-white border-transparent shadow-sm`
                    : `${cat.bgLight} ${cat.textColor} ${cat.border} hover:opacity-90`
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
