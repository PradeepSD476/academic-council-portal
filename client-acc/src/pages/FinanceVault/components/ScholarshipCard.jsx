import React from "react";
import { Link } from "react-router-dom";
import { Calendar, Award, Building2, CheckCircle2, ChevronRight } from "lucide-react";

const CATEGORY_META = {
  SCHOLARSHIP: { label: "Scholarship", bg: "bg-sky-100 text-[var(--color-primary)] border-sky-300" },
  FEE_WAIVER: { label: "Fee Waiver", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  EDUCATION_LOAN: { label: "Education Loan", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  FINANCIAL_ASSISTANCE: { label: "Financial Assistance", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  GRANT: { label: "Grant", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  FEE_REIMBURSEMENT: { label: "Fee Reimbursement", bg: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  OTHER: { label: "Other", bg: "bg-slate-100 text-slate-700 border-slate-200" },
};

const ScholarshipCard = ({ scholarship }) => {
  const cat = CATEGORY_META[scholarship.category] || CATEGORY_META.OTHER;
  const isActive = scholarship.isActive;

  const deadline = scholarship.deadline
    ? new Date(scholarship.deadline).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric"
    })
    : null;

  return (
    <div className="bg-gradient-to-b from-white/95 via-sky-50/25 to-blue-50/35 backdrop-blur-2xl border-2 border-[var(--color-secondary)]/40 hover:border-[var(--color-primary-accent)]/60 rounded-[2.2rem] p-6 sm:p-7 shadow-[0_12px_35px_rgba(11,30,63,0.06)] hover:shadow-[0_20px_50px_var(--color-secondary-glow)] transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
      <div>
        {/* Top Meta: Category + Active Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`px-3 py-0.5 text-[11px] font-black border rounded-full uppercase tracking-wider shadow-xs ${cat.bg}`}>
            {cat.label}
          </span>

          <span className={`px-3 py-0.5 inline-flex items-center text-[10px] font-black border rounded-full shadow-xs ${isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
            {isActive ? "Active" : "Closed"}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-lg font-black text-[var(--color-primary)] group-hover:text-[var(--color-primary-accent)] transition-colors leading-snug line-clamp-2 mb-1.5">
          {scholarship.title}
        </h2>

        {/* Provider */}
        {scholarship.provider && (
          <p className="text-slate-600 text-xs font-semibold flex items-center gap-1.5 mb-3">
            <Building2 size={14} className="text-[var(--color-secondary)] shrink-0" />
            <span className="truncate">{scholarship.provider}</span>
          </p>
        )}

        {/* Amount Badge */}
        {scholarship.amount && (
          <div className="mb-4 inline-flex items-center gap-2 bg-white/90 border border-sky-200/90 px-3.5 py-1.5 rounded-xl shadow-xs">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Benefit:</span>
            <span className="text-xs font-black text-[var(--color-primary)]">{scholarship.amount}</span>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4 text-xs">
          <div className="bg-white/90 border border-sky-100/90 rounded-2xl p-3 shadow-xs">
            <span className="text-slate-400 block text-[10px] font-black uppercase tracking-wider mb-0.5">Deadline</span>
            <span className={`font-bold ${deadline ? "text-[var(--color-primary)]" : "text-slate-500"}`}>
              {deadline || "Rolling / No Deadline"}
            </span>
          </div>

          <div className="bg-white/90 border border-sky-100/90 rounded-2xl p-3 shadow-xs">
            <span className="text-slate-400 block text-[10px] font-black uppercase tracking-wider mb-0.5">Eligibility</span>
            <span className="font-bold text-[var(--color-primary)] truncate block">
              {scholarship.incomeEligibility ? `Income ≤ ${scholarship.incomeEligibility}` : (scholarship.genderEligibility === 'ALL' || !scholarship.genderEligibility ? "All Students" : scholarship.genderEligibility)}
            </span>
          </div>
        </div>

        {/* Branches preview */}
        {scholarship.applicableBranch && scholarship.applicableBranch.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider mr-1">Branches:</span>
            {scholarship.applicableBranch.slice(0, 4).map(b => (
              <span key={b} className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-white/90 text-slate-700 border border-slate-200 shadow-xs">
                {b}
              </span>
            ))}
            {scholarship.applicableBranch.length > 4 && (
              <span className="text-slate-500 text-[10px] font-black self-center">
                +{scholarship.applicableBranch.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Button Action */}
      <div className="pt-3.5 border-t border-slate-200/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-500 font-medium">
          {scholarship.academicYear ? `Year: ${scholarship.academicYear}` : "All academic years"}
        </span>

        <Link
          to={`/dashboard/finance-vault/${scholarship._id || scholarship.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-black bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] hover:opacity-95 text-white px-4 py-2 rounded-full shadow-xs transition-all cursor-pointer group-hover:scale-105"
        >
          <span>View Details</span>
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
};
export default ScholarshipCard;