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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        
        {/* Top Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to={backTo}
            className="inline-flex items-center gap-1 bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-xs transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-800 leading-none">
              {buttonText === "Add Opportunity" ? "Add Finance Opportunity" : "Edit Finance Opportunity"}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Provide the details below to publish this opportunity.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-6">

          {/* Section 1: Basic Info */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b border-gray-100 pb-2">Basic Info</h3>
            
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Title <Required /></label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g. Merit-cum-Means Scholarship"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Description <Required /></label>
              <textarea
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Details about this opportunity..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-y"
              />
            </div>
          </div>

          {/* Section 2: Details */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b border-gray-100 pb-2">Opportunity Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="SCHOLARSHIP">Scholarship</option>
                  <option value="FEE_WAIVER">Fee Waiver</option>
                  <option value="EDUCATION_LOAN">Education Loan</option>
                  <option value="FINANCIAL_ASSISTANCE">Financial Assistance</option>
                  <option value="GRANT">Grant</option>
                  <option value="FEE_REIMBURSEMENT">Fee Reimbursement</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Provider</label>
                <input
                  type="text"
                  name="provider"
                  value={formData.provider}
                  onChange={handleChange}
                  placeholder="e.g. Government of Bihar"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Amount</label>
                <input
                  type="text"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="e.g. 50000 or Tuition Waiver"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Academic Year</label>
                <input
                  type="text"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  placeholder="e.g. 1st Year / All Students"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Eligibility */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b border-gray-100 pb-2">Eligibility Criteria</h3>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">General Eligibility Details</label>
              <textarea
                rows={3}
                name="eligibilityCriteria"
                value={formData.eligibilityCriteria}
                onChange={handleChange}
                placeholder="e.g. Must maintain CPI > 6.5..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-y"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Family Income Limit</label>
                <input
                  type="text"
                  name="incomeEligibility"
                  value={formData.incomeEligibility}
                  onChange={handleChange}
                  placeholder="e.g. 800000 or 8L"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Gender Eligibility</label>
                <select
                  name="genderEligibility"
                  value={formData.genderEligibility}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="ALL">All Genders</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">State(s)</label>
                <input
                  type="text"
                  name="state"
                  value={Array.isArray(formData.state) ? formData.state.join(", ") : (formData.state || "")}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                  placeholder="e.g. Bihar, UP, All India"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Applicable Branches */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Applicable Branches</label>
              <div className="flex flex-wrap gap-2">
                {BRANCHES.map(branch => {
                  const checked = Array.isArray(formData.applicableBranch) && formData.applicableBranch.includes(branch);
                  return (
                    <label
                      key={branch}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer select-none transition-all ${
                        checked
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
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
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Sub Categories</label>
              <div className="flex flex-wrap gap-2">
                {SUBCATEGORIES.map(cat => {
                  const checked = Array.isArray(formData.subCategory) && formData.subCategory.includes(cat);
                  return (
                    <label
                      key={cat}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer select-none transition-all ${
                        checked
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
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
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b border-gray-100 pb-2">Links & Deadlines</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Application Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Application Link (URL)</label>
                <input
                  type="url"
                  name="applicationUrl"
                  value={formData.applicationUrl}
                  onChange={handleChange}
                  placeholder="https://apply.example.com"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Official Website</label>
              <input
                type="url"
                name="officialWebsite"
                value={formData.officialWebsite}
                onChange={handleChange}
                placeholder="https://example.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Required Documents</label>
              <textarea
                rows={3}
                name="requiredDocuments"
                value={formData.requiredDocuments}
                onChange={handleChange}
                placeholder="e.g. Income Certificate, Marksheets..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-y"
              />
            </div>
          </div>

          {/* Section 5: Status + Save */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <label className="inline-flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="text-sm font-semibold text-gray-700">
                {formData.isActive ? "Active — Visible to students" : "Inactive — Hidden from students"}
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              <Save size={16} />
              {loading ? "Saving..." : buttonText}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

const Required = () => <span className="text-red-500 ml-0.5">*</span>;

export default ScholarshipForm;