import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const TYPE_LABELS = { INTERNSHIP: "Internship", PLACEMENT: "Placement", STARTUP: "Startup" };

// A published Career Vault experience, expandable. The description is rendered exactly the way
// pages/CareerVaultuser/index.jsx renders it (same element, classes and HTML), as the project
// rules require; it is the same published content Career Vault already shows.
export default function ExperienceCard({ experience }) {
  const [open, setOpen] = useState(false);
  const bodyId = `experience-body-${experience.id}`;
  return (
    <article className="rounded-2xl border border-slate-200 bg-white/95 shadow-xs overflow-hidden hover:border-[var(--color-secondary)]/40 transition-all duration-300">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={bodyId}
        className="w-full text-left p-5 flex justify-between items-start gap-3 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-secondary)]"
      >
        <div className="min-w-0">
          <h3 className="text-base font-bold text-[var(--color-primary)] group-hover:text-[var(--color-secondary)] transition-colors leading-snug">
            {experience.title}
          </h3>
          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-1.5">
            <span className="font-semibold text-slate-600">{experience.authorName}</span>
            <span aria-hidden="true">•</span>
            <span>{new Date(experience.createdAt).toLocaleDateString()}</span>
            <span aria-hidden="true">•</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] border border-[var(--color-secondary)]/20 uppercase">
              {experience.domain || "Uncategorized"}
            </span>
            {TYPE_LABELS[experience.experienceType] && (
              <span className="text-slate-500">{TYPE_LABELS[experience.experienceType]}</span>
            )}
          </div>
        </div>
        <span className="text-slate-500 shrink-0 flex flex-col items-center gap-0.5 group-hover:text-[var(--color-secondary)] transition-colors">
          {open ? <ChevronUp size={20} aria-hidden="true" /> : <ChevronDown size={20} aria-hidden="true" />}
          <span className="text-[9px] font-bold uppercase tracking-wider">{open ? "Close" : "Read"}</span>
        </span>
      </button>
      {open && (
        <div id={bodyId} className="px-5 pb-5 border-t border-slate-200 pt-4 bg-slate-50/50">
          <div
            className="text-slate-600 leading-relaxed quill-content text-sm"
            dangerouslySetInnerHTML={{ __html: experience.description }}
          />
        </div>
      )}
    </article>
  );
}
