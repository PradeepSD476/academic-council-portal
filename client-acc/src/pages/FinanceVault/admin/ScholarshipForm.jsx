import React from "react";

const branches = [
  "CSE",
  "ECE",
  "EE",
  "ME",
  "CE",
  "AI",
  "MNC",
];

const ScholarshipForm = ({
  formData,
  setFormData,
  onSubmit,
  loading,
  buttonText,
}) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox" && name === "applicableBranch") {
      let arr = [...formData.applicableBranch];

      if (checked) {
        arr.push(value);
      } else {
        arr = arr.filter((x) => x !== value);
      }

      setFormData({
        ...formData,
        applicableBranch: arr,
      });

      return;
    }

    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: checked,
      });

      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-xl shadow p-8 space-y-6"
    >
      <h2 className="text-3xl font-bold">Finance Opportunity</h2>

      <div>
        <label className="block font-medium mb-2">
          Title
        </label>

        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full border rounded-lg p-3"
          required
        />
      </div>

      <div>
        <label className="block font-medium mb-2">
          Description
        </label>

        <textarea
          rows={5}
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full border rounded-lg p-3"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block font-medium mb-2">
            Category
          </label>

          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
          >
            <option value="SCHOLARSHIP">Scholarship</option>
            <option value="FEE_WAIVER">Fee Waiver</option>
            <option value="EDUCATION_LOAN">Education Loan</option>
            <option value="FINANCIAL_ASSISTANCE">
              Financial Assistance
            </option>
            <option value="GRANT">Grant</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-2">
            Provider
          </label>

          <input
            type="text"
            name="provider"
            value={formData.provider}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block font-medium mb-2">
            Amount
          </label>

          <input
            type="text"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">
            Academic Year
          </label>

          <input
            type="text"
            name="academicYear"
            value={formData.academicYear}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
            placeholder="1st Year / All"
          />
        </div>
      </div>

      <div>
        <label className="block font-medium mb-2">
          Eligibility Criteria
        </label>

        <textarea
          rows={4}
          name="eligibilityCriteria"
          value={formData.eligibilityCriteria}
          onChange={handleChange}
          className="w-full border rounded-lg p-3"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block font-medium mb-2">
            Income Eligibility
          </label>

          <input
            type="text"
            name="incomeEligibility"
            value={formData.incomeEligibility}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">
            Gender Eligibility
          </label>

          <select
            name="genderEligibility"
            value={formData.genderEligibility}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
          >
            <option value="ALL">All</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block font-medium mb-3">
          Applicable Branches
        </label>

        <div className="grid grid-cols-4 gap-3">
          {branches.map((branch) => (
            <label
              key={branch}
              className="flex items-center gap-2"
            >
              <input
                type="checkbox"
                name="applicableBranch"
                value={branch}
                checked={Array.isArray(formData.applicableBranch) && formData.applicableBranch.includes(branch)}
                onChange={handleChange}
              />

              {branch}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-medium mb-2">
          Deadline
        </label>

        <input
          type="date"
          name="deadline"
          value={formData.deadline}
          onChange={handleChange}
          className="w-full border rounded-lg p-3"
        />
      </div>

      <div>
        <label className="block font-medium mb-2">
          Application URL
        </label>

        <input
          type="url"
          name="applicationUrl"
          value={formData.applicationUrl}
          onChange={handleChange}
          className="w-full border rounded-lg p-3"
        />
      </div>

      <div>
        <label className="block font-medium mb-2">
          Official Website
        </label>

        <input
          type="url"
          name="officialWebsite"
          value={formData.officialWebsite}
          onChange={handleChange}
          className="w-full border rounded-lg p-3"
        />
      </div>

      <div>
        <label className="block font-medium mb-2">
          Required Documents
        </label>

        <textarea
          rows={4}
          name="requiredDocuments"
          value={formData.requiredDocuments}
          onChange={handleChange}
          className="w-full border rounded-lg p-3"
        />
      </div>

      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
          />

          Active
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold disabled:opacity-60"
      >
        {loading ? "Saving..." : buttonText}
      </button>
    </form>
  );
};

export default ScholarshipForm;