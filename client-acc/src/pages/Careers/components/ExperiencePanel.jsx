import { Link } from "react-router-dom";
import { Building2, MessageSquareText } from "lucide-react";
import { plural } from "../lib/format";

const TYPE_LABELS = { INTERNSHIP: "Internship", PLACEMENT: "Placement", STARTUP: "Startup" };

// On the job detail page: what seniors wrote about this company, linking to the company page.
export default function ExperiencePanel({ company, count, recent = [] }) {
  const companyPage = `/dashboard/career-vault/companies/${company.slug}`;
  return (
    <section aria-labelledby="company-title" className="p-5 rounded-2xl border border-slate-200 bg-white/95 shadow-xs">
      <h2 id="company-title" className="flex items-center gap-2 text-sm font-bold text-[var(--color-primary)] mb-2">
        <Building2 size={16} className="text-[var(--color-secondary)]" aria-hidden="true" /> {company.name}
      </h2>
      {count > 0 ? (
        <>
          <Link to={companyPage} className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:underline">
            <MessageSquareText size={14} aria-hidden="true" /> {plural(count, "past experience")} at {company.name} →
          </Link>
          <ul className="mt-2 space-y-1.5">
            {recent.map((e) => (
              <li key={e.id} className="text-xs text-slate-600">
                <Link to={companyPage} className="hover:text-[var(--color-primary)] hover:underline">{e.title}</Link>
                {TYPE_LABELS[e.experienceType] && <span className="text-slate-500"> · {TYPE_LABELS[e.experienceType]}</span>}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-xs text-slate-600">
          No experiences shared about {company.name} yet. <Link to={companyPage} className="font-semibold text-teal-700 hover:underline">Company page →</Link>
        </p>
      )}
    </section>
  );
}
