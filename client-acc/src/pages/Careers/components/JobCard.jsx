import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import CompensationBadge from "./CompensationBadge";
import EligibilityBadge from "./EligibilityBadge";
import FreshnessLine from "./FreshnessLine";

const TYPE_LABELS = { INTERNSHIP: "Internship", FULL_TIME: "Full-time" };
const MODE_LABELS = { ONSITE: "On-site", HYBRID: "Hybrid", REMOTE: "Remote" };
const MAX_SKILLS = 5;

const chip = "inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider";

export default function JobCard({ posting }) {
  const skills = posting.skills ?? [];
  return (
    <Link
      to={`/dashboard/career-vault/jobs/${posting.id}`}
      className="block p-5 rounded-2xl border border-slate-200 bg-white/95 shadow-xs hover:border-[var(--color-secondary)]/40 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-teal-700">{posting.company.name}</span>
        {TYPE_LABELS[posting.type] && (
          <span className={`${chip} text-blue-700 bg-blue-50 border-blue-100`}>{TYPE_LABELS[posting.type]}</span>
        )}
        {MODE_LABELS[posting.workMode] && (
          <span className={`${chip} text-slate-600 bg-slate-50 border-slate-200`}>{MODE_LABELS[posting.workMode]}</span>
        )}
      </div>

      <h2 className="mt-1.5 text-base font-bold text-[var(--color-primary)] leading-snug">{posting.roleTitle}</h2>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1 min-w-0">
          <MapPin size={14} className="text-slate-400 shrink-0" aria-hidden="true" />
          <span className={posting.location ? "truncate max-w-[16rem]" : "italic"}>{posting.location || "Location not stated"}</span>
        </span>
        <CompensationBadge posting={posting} />
        <EligibilityBadge eligibility={posting.eligibility} />
      </div>

      <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {skills.slice(0, MAX_SKILLS).map((s) => (
            <span key={s} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">{s}</span>
          ))}
          {skills.length > MAX_SKILLS && (
            <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 text-[11px] font-medium">+{skills.length - MAX_SKILLS}</span>
          )}
        </div>
        <FreshnessLine posting={posting} />
      </div>
    </Link>
  );
}
