import React from "react";
import {
  Layers,
  FileCheck,
  GraduationCap,
  Building,
  Shuffle,
  Award,
  HelpCircle,
  Folder,
  BookOpen,
  Bookmark,
  DollarSign,
  Briefcase,
  Users
} from "lucide-react";

const getCategoryIcon = (category) => {
  const cat = (category || "").toLowerCase();
  if (cat.includes("all")) return <Layers size={15} />;
  if (cat.includes("regist")) return <FileCheck size={15} />;
  if (cat.includes("academ") || cat.includes("curric")) return <GraduationCap size={15} />;
  if (cat.includes("hostel") || cat.includes("campus") || cat.includes("facilit")) return <Building size={15} />;
  if (cat.includes("branch") || cat.includes("chang")) return <Shuffle size={15} />;
  if (cat.includes("scholar") || cat.includes("fee") || cat.includes("finan")) return <Award size={15} />;
  if (cat.includes("career") || cat.includes("intern") || cat.includes("place")) return <Briefcase size={15} />;
  if (cat.includes("club") || cat.includes("gymkhana") || cat.includes("activit")) return <Users size={15} />;
  if (cat.includes("course") || cat.includes("grade")) return <BookOpen size={15} />;
  return <Bookmark size={15} />;
};

export default function FAQSidebar({ categories, active, onSelect, counts }) {
  return (
    <nav aria-label="FAQ categories">
      <ul className="space-y-1">
        {/* All categories option */}
        <li>
          <button
            onClick={() => onSelect("All")}
            aria-current={active === "All" ? "true" : undefined}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
              active === "All"
                ? "bg-slate-900 text-white font-bold shadow-xs"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className={active === "All" ? "text-blue-400" : "text-slate-500"}>
                {getCategoryIcon("all")}
              </span>
              <span>All Questions</span>
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                active === "All"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 border border-slate-200 text-slate-600"
              }`}
            >
              {Object.values(counts).reduce((a, b) => a + b, 0)}
            </span>
          </button>
        </li>

        {categories.map((cat) => {
          const isActive = active === cat;
          const count = counts[cat] ?? 0;

          return (
            <li key={cat}>
              <button
                onClick={() => onSelect(cat)}
                aria-current={isActive ? "true" : undefined}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                  isActive
                    ? "bg-slate-900 text-white font-bold shadow-xs"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <span className={isActive ? "text-blue-400" : "text-slate-500"}>
                    {getCategoryIcon(cat)}
                  </span>
                  <span className="truncate">{cat}</span>
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 border border-slate-200 text-slate-600"
                  }`}
                >
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
