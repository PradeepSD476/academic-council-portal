import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Award, Calendar, DollarSign, Users, Globe, FileText } from "lucide-react";

const ScholarshipDetails = () => {
  const { id } = useParams();

  const [scholarship, setScholarship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchScholarship = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/v1/finance-vault/${id}`, {
          withCredentials: true,
        });

        setScholarship(data.data);
      } catch (err) {
        console.error(err);
        setError("Unable to fetch scholarship details.");
      } finally {
        setLoading(false);
      }
    };

    fetchScholarship();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <div className="w-8 h-8 border-3 border-[var(--color-secondary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !scholarship) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-lg font-bold text-red-400">
          {error || "Scholarship Not Found"}
        </h2>
        <Link
          to="/dashboard/finance-vault"
          className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold text-[var(--color-secondary)]"
        >
          ← Back to Finance Vault
        </Link>
      </div>
    );
  }

  const deadline = scholarship.deadline
    ? new Date(scholarship.deadline).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric"
    })
    : "No Deadline";

  return (
    <div className="space-y-6 text-[var(--color-primary)] pb-12">
      {/* Back Button */}
      <Link
        to="/dashboard/finance-vault"
        className="inline-flex items-center gap-2 text-xs font-bold text-[var(--color-primary)] transition px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer"
      >
        <ArrowLeft size={14} />
        <span>Back to Opportunities</span>
      </Link>

      {/* Main Grid: 2 Columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Detailed Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Banner Card */}
          <div className="bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[11px] font-bold text-[var(--color-secondary)] uppercase tracking-wider bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/20 px-3 py-0.5 rounded-full">
                {scholarship.category?.replace(/_/g, " ")}
              </span>
              <span className={`px-2.5 py-0.5 inline-flex items-center text-[10px] font-bold border rounded-full ${scholarship.isActive ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/60" : "bg-neutral-800 text-slate-500 border-slate-300"
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${scholarship.isActive ? "bg-emerald-400 animate-pulse" : "bg-neutral-500"}`} />
                {scholarship.isActive ? "Active Listing" : "Closed / Inactive"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-primary)] tracking-tight mb-2 leading-snug">
              {scholarship.title}
            </h1>

            {scholarship.provider && (
              <p className="text-slate-500 text-sm font-medium">
                Offered by <span className="text-[var(--color-primary)] font-semibold">{scholarship.provider}</span>
              </p>
            )}
          </div>

          {/* Overview / Description */}
          {scholarship.description && (
            <div className="bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-md space-y-3">
              <h3 className="text-xs font-bold text-[var(--color-secondary)] uppercase tracking-wider flex items-center gap-2">
                <FileText size={15} />
                Overview &amp; Details
              </h3>
              <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                {scholarship.description}
              </div>
            </div>
          )}

          {/* Eligibility Criteria */}
          {scholarship.eligibilityCriteria && (
            <div className="bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-md space-y-3">
              <h3 className="text-xs font-bold text-[var(--color-secondary)] uppercase tracking-wider flex items-center gap-2">
                <Award size={15} />
                Eligibility Criteria &amp; Guidelines
              </h3>
              <div className="bg-white/90 border border-slate-200/80 rounded-2xl p-5 text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                {scholarship.eligibilityCriteria}
              </div>
            </div>
          )}

          {/* Applicable Branches & Reservations */}
          {((scholarship.applicableBranch && scholarship.applicableBranch.length > 0) ||
            (scholarship.subCategory && scholarship.subCategory.length > 0) ||
            (scholarship.state && scholarship.state.length > 0)) && (
              <div className="bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-md space-y-5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Target Groups &amp; Disciplines
                </h3>

                {scholarship.applicableBranch && scholarship.applicableBranch.length > 0 && (
                  <div>
                    <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Applicable Engineering &amp; Science Branches
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {scholarship.applicableBranch.map((branch) => (
                        <span
                          key={branch}
                          className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-gray-200 text-xs font-bold"
                        >
                          {branch}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {scholarship.subCategory && scholarship.subCategory.length > 0 && (
                  <div>
                    <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Eligible Social / Category Reservations
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {scholarship.subCategory.map((cat) => (
                        <span
                          key={cat}
                          className="px-3 py-1 rounded-xl bg-purple-950/60 border border-purple-800/60 text-purple-300 text-xs font-bold"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {scholarship.state && scholarship.state.length > 0 && (
                  <div>
                    <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      State / Domicile Requirements
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {scholarship.state.map((s) => (
                        <span
                          key={s}
                          className="px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-bold"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Required Documents */}
          {scholarship.requiredDocuments && (
            <div className="bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-md space-y-3">
              <h3 className="text-xs font-bold text-[var(--color-secondary)] uppercase tracking-wider flex items-center gap-2">
                <FileText size={15} />
                Required Documents Checklist
              </h3>
              <div className="bg-white/90 border border-slate-200/80 rounded-2xl p-5 text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                {scholarship.requiredDocuments}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Quick Facts & Application Actions */}
        <div className="space-y-5 sticky top-24">
          <div className="bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 rounded-3xl p-6 shadow-xl space-y-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-3">
              Quick Highlights
            </h3>

            {/* Benefit Amount */}
            {scholarship.amount && (
              <div className="bg-white/90 border border-slate-200 rounded-2xl p-4">
                <span className="text-slate-500 block uppercase text-[10px] font-bold tracking-wider mb-1">
                  Award / Benefit Amount
                </span>
                <span className="font-extrabold text-[var(--color-secondary)] text-xl">
                  {scholarship.amount}
                </span>
              </div>
            )}

            {/* Deadline */}
            <div className="bg-white/90 border border-slate-200 rounded-2xl p-4">
              <span className="text-slate-500 block uppercase text-[10px] font-bold tracking-wider mb-1">
                Application Deadline
              </span>
              <div className="flex items-center gap-2 text-[var(--color-primary)] font-bold text-sm">
                <Calendar size={15} className="text-[var(--color-secondary)]" />
                <span>{deadline}</span>
              </div>
            </div>

            {/* Other Meta */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500">Gender</span>
                <span className="font-bold text-[var(--color-primary)]">
                  {scholarship.genderEligibility || "All Genders"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500">Academic Year</span>
                <span className="font-bold text-[var(--color-primary)]">
                  {scholarship.academicYear || "All Years"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500">Income Limit</span>
                <span className="font-bold text-[var(--color-primary)]">
                  {scholarship.incomeEligibility || "No Restriction"}
                </span>
              </div>
            </div>

            {/* Application CTAs */}
            <div className="pt-2 space-y-2.5">
              {scholarship.applicationUrl && (
                <a
                  href={scholarship.applicationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[var(--color-secondary)] hover:opacity-90 text-white px-5 py-3 rounded-xl font-bold text-xs shadow-[0_8px_20px_var(--color-secondary-glow)] transition cursor-pointer"
                >
                  <span>Apply on Official Portal</span>
                  <ExternalLink size={14} />
                </a>
              )}

              {scholarship.officialWebsite && (
                <a
                  href={scholarship.officialWebsite}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-slate-600 hover:text-[var(--color-primary)] border border-white/10 px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  <span>Visit Website</span>
                  <Globe size={14} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipDetails;