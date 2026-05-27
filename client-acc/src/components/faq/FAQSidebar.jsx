/**
 * FAQSidebar – Category navigation sidebar for the /faq page.
 */
import React from "react";
import { getCategoryConfig } from "@/lib/chatbot/categories.js";

export default function FAQSidebar({ categories, active, onSelect, counts }) {
  return (
    <nav aria-label="FAQ categories">
      <ul className="space-y-0.5">
        {/* All categories option */}
        <li>
          <button
            onClick={() => onSelect("All")}
            aria-current={active === "All" ? "true" : undefined}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${
              active === "All"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center gap-2">
              <span>🗂️</span>
              <span>All</span>
            </span>
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
              active === "All" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
            }`}>
              {Object.values(counts).reduce((a, b) => a + b, 0)}
            </span>
          </button>
        </li>

        {categories.map((cat) => {
          const config = getCategoryConfig(cat);
          const isActive = active === cat;
          const count = counts[cat] ?? 0;

          return (
            <li key={cat}>
              <button
                onClick={() => onSelect(cat)}
                aria-current={isActive ? "true" : undefined}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span>{config?.label?.split(" ")[0] ?? "📌"}</span>
                  <span className="truncate">{cat}</span>
                </span>
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                  isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {count}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
