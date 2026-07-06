import React from "react";

const FilterSidebar = ({ filters, setFilters }) => {
  const handleChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      gender: "",
      income: "",
      branch: "",
      activeStatus: "",
    });
  };

  return (
    <div className="sticky top-24 bg-white border rounded-lg shadow-sm p-5">
      <h2 className="text-xl font-semibold mb-6">Filters</h2>

      <div className="space-y-5">
        <div>
          <label className="block mb-2 font-medium">
            Category
          </label>

          <select
            name="category"
            value={filters.category}
            onChange={handleChange}
            className="w-full border rounded-md p-2"
          >
            <option value="">All</option>
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
          <label className="block mb-2 font-medium">
            Gender Eligibility
          </label>

          <select
            name="gender"
            value={filters.gender}
            onChange={handleChange}
            className="w-full border rounded-md p-2"
          >
            <option value="">All</option>
            <option value="ALL">All</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Annual Family Income
          </label>

          <input
            type="text"
            name="income"
            value={filters.income}
            onChange={handleChange}
            placeholder="e.g. 800000"
            className="w-full border rounded-md p-2"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Applicable Branch
          </label>

          <input
            type="text"
            name="branch"
            value={filters.branch}
            onChange={handleChange}
            placeholder="e.g. CSE"
            className="w-full border rounded-md p-2"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Status
          </label>

          <select
            name="activeStatus"
            value={filters.activeStatus}
            onChange={handleChange}
            className="w-full border rounded-md p-2"
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <button
          onClick={clearFilters}
          className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};

export default FilterSidebar;