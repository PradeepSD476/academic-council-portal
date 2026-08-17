import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

const BRANCHES = ["CSE", "ECE", "EE", "ME", "CE", "AI", "MNC", "MME", "CBE", "EP", "ES", "ALL"];
const SUBCATEGORIES = ["SC", "ST", "OBC", "EWS", "PwD", "General"];

const ScholarshipForm = ({ formData, setFormData, onSubmit, loading, buttonText, backTo = "/admin/finance-vault" }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox" && (name === "applicableBranch" || name === "subCategory")) {
      let arr = [...(formData[name] || [])];
      arr = checked ? [...arr, value] : arr.filter(x => x !== value);
      setFormData({ ...formData, [name]: arr });
      return;
    }
    if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="space-y-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link
              to={backTo}
              className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-[var(--color-primary)] hover:bg-white/10 transition cursor-pointer"
            >
              <ArrowLeft size={14} /> Back
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-[3px] h-5 bg-[var(--color-secondary)] rounded-full shadow-[0_0_8px_var(--color-secondary)]" />
                <h1 className="text-xl md:text-2xl font-extrabold text-[var(--color-primary)] tracking-tight leading-none">
                  {buttonText === "Add Opportunity" ? "Add Financial Opportunity" : "Edit Financial Opportunity"}
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-1 ml-3.5">
                Configure details, eligibility criteria, and links for this listing.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-6">

          {/* Section 1: Basic Info */}
          <div className="bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 rounded-2xl p-6 shadow-md space-y-4">
            <h3 className="text-xs font-bold text-[var(--color-secondary)] uppercase tracking-wider border-b border-slate-200 pb-2.5">Basic Information</h3>
            
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Opportunity Title <Required /></label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g. Merit-cum-Means National Scholarship Scheme"
                className="w-full bg-white/90 border border-slate-200 rounded-xl p-3 text-sm text-[var(--color-primary)] placeholder-slate-400 focus:outline-none focus:border-[var(--color-secondary)] transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description &amp; Highlights <Required /></label>
              <textarea
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Comprehensive details, coverage percentage, and key highlights..."
                className="w-full bg-white/90 border border-slate-200 rounded-xl p-3 text-sm text-[var(--color-primary)] placeholder-slate-400 focus:outline-none focus:border-[var(--color-secondary)] transition resize-y"
              />
            </div>
          </div>

          {/* Section 2: Details */}
          <div className="bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 rounded-2xl p-6 shadow-md space-y-4">
            <h3 className="text-xs font-bold text-[var(--color-secondary)] uppercase tracking-wider border-b border-slate-200 pb-2.5">Opportunity Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-white/90 border border-slate-200 rounded-xl p-3 text-sm text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-secondary)] transition cursor-pointer"
                >
                  <option value="SCHOLARSHIP" className="bg-sky-100 text-[var(--color-primary)]">Scholarship</option>
                  <option value="FEE_WAIVER" className="bg-sky-100 text-[var(--color-primary)]">Fee Waiver</option>
                  <option value="EDUCATION_LOAN" className="bg-sky-100 text-[var(--color-primary)]">Education Loan</option>
                  <option value="FINANCIAL_ASSISTANCE" className="bg-sky-100 text-[var(--color-primary)]">Financial Assistance</option>
                  <option value="GRANT" className="bg-sky-100 text-[var(--color-primary)]">Grant</option>
                  <option value="FEE_REIMBURSEMENT" className="bg-sky-100 text-[var(--color-primary)]">Fee Reimbursement</option>
                  <option value="OTHER" className="bg-sky-100 text-[var(--color-primary)]">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Provider / Organization</label>
                <input
                  type="text"
                  name="provider"
                  value={formData.provider}
                  onChange={handleChange}
                  placeholder="e.g. Ministry of Education / Corporate Trust"
                  className="w-full bg-white/90 border border-slate-200 rounded-xl p-3 text-sm text-[var(--color-primary)] placeholder-slate-400 focus:outline-none focus:border-[var(--color-secondary)] transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Award Amount / Coverage</label>
                <input
                  type="text"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="e.g. ₹50,000 / Year or 100% Tuition Waiver"
                  className="w-full bg-white/90 border border-slate-200 rounded-xl p-3 text-sm text-[var(--color-primary)] placeholder-slate-400 focus:outline-none focus:border-[var(--color-secondary)] transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Target Academic Year</label>
                <input
                  type="text"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  placeholder="e.g. 1st Year / All Undergraduates"
                  className="w-full bg-white/90 border border-slate-200 rounded-xl p-3 text-sm text-[var(--color-primary)] placeholder-slate-400 focus:outline-none focus:border-[var(--color-secondary)] transition"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Eligibility */}
          <div className="bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 rounded-2xl p-6 shadow-md space-y-4">
            <h3 className="text-xs font-bold text-[var(--color-secondary)] uppercase tracking-wider border-b border-slate-200 pb-2.5">Eligibility Criteria</h3>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">General Eligibility Notes</label>
              <textarea
                rows={3}
                name="eligibilityCriteria"
                value={formData.eligibilityCriteria}
                onChange={handleChange}
                placeholder="e.g. Minimum CPI requirement >= 6.5, full-time student..."
                className="w-full bg-white/90 border border-slate-200 rounded-xl p-3 text-sm text-[var(--color-primary)] placeholder-slate-400 focus:outline-none focus:border-[var(--color-secondary)] transition resize-y"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Annual Family Income Limit</label>
                <input
                  type="text"
                  name="incomeEligibility"
                  value={formData.incomeEligibility}
                  onChange={handleChange}
                  placeholder="e.g. ≤ 8 LPA or Below 5 Lakhs"
                  className="w-full bg-white/90 border border-slate-200 rounded-xl p-3 text-sm text-[var(--color-primary)] placeholder-slate-400 focus:outline-none focus:border-[var(--color-secondary)] transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gender Eligibility</label>
                <select
                  name="genderEligibility"
                  value={formData.genderEligibility}
                  onChange={handleChange}
                  className="w-full bg-white/90 border border-slate-200 rounded-xl p-3 text-sm text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-secondary)] transition cursor-pointer"
                >
                  <option value="ALL" className="bg-sky-100 text-[var(--color-primary)]">All Genders</option>
                  <option value="MALE" className="bg-sky-100 text-[var(--color-primary)]">Male Only</option>
                  <option value="FEMALE" className="bg-sky-100 text-[var(--color-primary)]">Female Only</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">State(s) / Domicile</label>
                <input
                  type="text"
                  name="state"
                  value={Array.isArray(formData.state) ? formData.state.join(", ") : (formData.state || "")}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                  placeholder="e.g. All India, Bihar, UP"
                  className="w-full bg-white/90 border border-slate-200 rounded-xl p-3 text-sm text-[var(--color-primary)] placeholder-slate-400 focus:outline-none focus:border-[var(--color-secondary)] transition"
                />
              </div>
            </div>

            {/* Applicable Branches */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Applicable Branches</label>
              <div className="flex flex-wrap gap-2">
                {BRANCHES.map(branch => {
                  const checked = Array.isArray(formData.applicableBranch) && formData.applicableBranch.includes(branch);
                  return (
                    <label
                      key={branch}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer select-none transition-all ${
                        checked
                          ? "bg-sky-50 text-[var(--color-primary)] border-[var(--color-secondary)]/30 shadow-sm"
                          : "bg-white/90 text-slate-500 border-slate-200 hover:bg-white/5 hover:text-[var(--color-primary)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="applicableBranch"
                        value={branch}
                        checked={checked}
                        onChange={handleChange}
                        className="hidden"
                      />
                      {checked && <span>✓</span>}
                      {branch}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Sub Categories */}
            <div className="mt-4">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Social / Category Reservations</label>
              <div className="flex flex-wrap gap-2">
                {SUBCATEGORIES.map(cat => {
                  const checked = Array.isArray(formData.subCategory) && formData.subCategory.includes(cat);
                  return (
                    <label
                      key={cat}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer select-none transition-all ${
                        checked
                          ? "bg-purple-950/60 text-purple-300 border-purple-800/60 shadow-[0_0_8px_rgba(168,85,247,0.2)]"
                          : "bg-white/90 text-slate-500 border-slate-200 hover:bg-white/5 hover:text-[var(--color-primary)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="subCategory"
                        value={cat}
                        checked={checked}
                        onChange={handleChange}
                        className="hidden"
                      />
                      {checked && <span>✓</span>}
                      {cat}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 4: Links & Dates */}
          <div className="bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 rounded-2xl p-6 shadow-md space-y-4">
            <h3 className="text-xs font-bold text-[var(--color-secondary)] uppercase tracking-wider border-b border-slate-200 pb-2.5">Links &amp; Deadlines</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Application Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  className="w-full bg-white/90 border border-slate-200 rounded-xl p-3 text-sm text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-secondary)] transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Direct Application URL</label>
                <input
                  type="url"
                  name="applicationUrl"
                  value={formData.applicationUrl}
                  onChange={handleChange}
                  placeholder="https://scholarships.gov.in/..."
                  className="w-full bg-white/90 border border-slate-200 rounded-xl p-3 text-sm text-[var(--color-primary)] placeholder-slate-400 focus:outline-none focus:border-[var(--color-secondary)] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Official Website / Portal</label>
              <input
                type="url"
                name="officialWebsite"
                value={formData.officialWebsite}
                onChange={handleChange}
                placeholder="https://portal.example.edu"
                className="w-full bg-white/90 border border-slate-200 rounded-xl p-3 text-sm text-[var(--color-primary)] placeholder-slate-400 focus:outline-none focus:border-[var(--color-secondary)] transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Required Documents Checklist</label>
              <textarea
                rows={3}
                name="requiredDocuments"
                value={formData.requiredDocuments}
                onChange={handleChange}
                placeholder="e.g. Income Certificate, Marksheets, Bonafide Student Certificate, Bank Passbook..."
                className="w-full bg-white/90 border border-slate-200 rounded-xl p-3 text-sm text-[var(--color-primary)] placeholder-slate-400 focus:outline-none focus:border-[var(--color-secondary)] transition resize-y"
              />
            </div>
          </div>

          {/* Section 5: Status + Save */}
          <div className="bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 rounded-2xl p-5 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
            <label className="inline-flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 rounded accent-[var(--color-secondary)] cursor-pointer"
              />
              <span className="text-xs font-bold text-[var(--color-primary)]">
                {formData.isActive ? "Active — Visible on Student Finance Vault" : "Inactive — Draft / Hidden from Students"}
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[var(--color-secondary)] hover:opacity-90 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-[0_8px_20px_var(--color-secondary-glow)] disabled:opacity-50 transition cursor-pointer"
            >
              <Save size={14} />
              <span>{loading ? "Saving..." : buttonText}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

const Required = () => <span className="text-[var(--color-secondary)] ml-0.5 font-bold">*</span>;

export default ScholarshipForm;