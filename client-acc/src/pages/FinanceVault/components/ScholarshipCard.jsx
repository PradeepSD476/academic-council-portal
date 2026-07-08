import { Link } from "react-router-dom";

const CATEGORY_META = {
  SCHOLARSHIP:           { label: "Scholarship",            bg: "bg-purple-100 text-purple-800 border-purple-200" },
  FEE_WAIVER:            { label: "Fee Waiver",             bg: "bg-green-100 text-green-800 border-green-200" },
  EDUCATION_LOAN:        { label: "Education Loan",         bg: "bg-amber-100 text-amber-800 border-amber-200" },
  FINANCIAL_ASSISTANCE:  { label: "Financial Assistance",   bg: "bg-red-100 text-red-800 border-red-200" },
  GRANT:                 { label: "Grant",                  bg: "bg-blue-100 text-blue-800 border-blue-200" },
  OTHER:                 { label: "Other",                  bg: "bg-gray-100 text-gray-800 border-gray-200" },
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
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex justify-between items-start gap-4 mb-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-900 leading-snug line-clamp-2">
              {scholarship.title}
            </h2>
            {scholarship.provider && (
              <p className="text-gray-500 text-xs mt-0.5 font-medium">
                {scholarship.provider}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={`px-2 py-0.5 inline-flex items-center text-[10px] font-semibold border rounded-full ${
              isActive ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1 ${isActive ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
              {isActive ? "Active" : "Inactive"}
            </span>

            <span className={`px-2 py-0.5 text-[10px] font-semibold border rounded-full ${cat.bg}`}>
              {cat.label}
            </span>
          </div>
        </div>

        {/* Description */}
        {scholarship.description && (
          <p className="text-gray-600 text-xs leading-relaxed mb-4 line-clamp-2">
            {scholarship.description}
          </p>
        )}

        {/* Info Grid */}
        <div className="flex flex-wrap gap-2 mb-4">
          {scholarship.amount && (
            <InfoChip label="Amount" value={scholarship.amount} />
          )}
          {scholarship.genderEligibility && (
            <InfoChip label="Gender" value={scholarship.genderEligibility} />
          )}
          {scholarship.academicYear && (
            <InfoChip label="Year" value={scholarship.academicYear} />
          )}
          {scholarship.incomeEligibility && (
            <InfoChip label="Income Limit" value={scholarship.incomeEligibility} />
          )}
          <InfoChip
            label="Deadline"
            value={deadline || "No Deadline"}
            highlight={!!deadline}
          />
        </div>

        {/* Applicable Branches */}
        {scholarship.applicableBranch && scholarship.applicableBranch.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {scholarship.applicableBranch.slice(0, 4).map(b => (
              <span key={b} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                {b}
              </span>
            ))}
            {scholarship.applicableBranch.length > 4 && (
              <span className="text-gray-400 text-[10px] self-center ml-1">
                +{scholarship.applicableBranch.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Sub Categories */}
        {scholarship.subCategory && scholarship.subCategory.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {scholarship.subCategory.slice(0, 4).map(c => (
              <span key={c} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                {c}
              </span>
            ))}
            {scholarship.subCategory.length > 4 && (
              <span className="text-gray-400 text-[10px] self-center ml-1">
                +{scholarship.subCategory.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* States */}
        {scholarship.state && scholarship.state.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {scholarship.state.slice(0, 3).map(s => (
              <span key={s} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                {s}
              </span>
            ))}
            {scholarship.state.length > 3 && (
              <span className="text-gray-400 text-[10px] self-center ml-1">
                +{scholarship.state.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Button Action */}
      <div className="flex justify-end mt-2">
        <Link
          to={`/dashboard/finance-vault/${scholarship._id || scholarship.id}`}
          className="inline-flex items-center text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg shadow-xs transition-colors"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
};

const InfoChip = ({ label, value, highlight }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
    highlight ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-gray-50 text-gray-700 border-gray-100"
  }`}>
    <span className="text-gray-400 text-[10px] font-semibold uppercase">{label}:</span>
    <span className="font-semibold">{value}</span>
  </span>
);

export default ScholarshipCard;