import React from "react";
import { getCategoryConfig } from "@/lib/chatbot/categories.js";

export default function FAQSidebar({ categories, active, onSelect, counts }) {
  return (
    <nav aria-label="FAQ categories">
      <ul className="space-y-1">
        {/* All categories option */}
        <li>
          <button
            onClick={() => onSelect("All")}
            aria-current={active === "All" ? "true" : undefined}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-left ${
              active === "All"
                ? "bg-[var(--color-secondary)] text-white shadow-[0_0_12px_rgba(21,135,212,0.35)]"
                : "text-slate-600 hover:bg-slate-100 hover:text-[var(--color-primary)]"
            }`}
          >
            <span className="flex items-center gap-2">
              <span>🗂️</span>
              <span>All Questions</span>
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              active === "All" ? "bg-white/30 text-white" : "bg-slate-100 border border-slate-200 text-slate-500"
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-left ${
                  isActive
                    ? "bg-[var(--color-secondary)] text-white shadow-[0_0_12px_rgba(21,135,212,0.35)]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-[var(--color-primary)]"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span>{config?.label?.split(" ")[0] ?? "📌"}</span>
                  <span className="truncate">{cat}</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  isActive ? "bg-white/30 text-white" : "bg-slate-100 border border-slate-200 text-slate-500"
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
