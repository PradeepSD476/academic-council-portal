import { Link } from "react-router-dom";

const ScholarshipCard = ({ scholarship }) => {
  const getStatusColor = (active) => {
    return active
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {scholarship.title}
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {scholarship.provider || "Provider Not Available"}
          </p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
            scholarship.isActive
          )}`}
        >
          {scholarship.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <p className="mt-4 text-gray-700 line-clamp-3">
        {scholarship.description}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mt-5 text-sm text-gray-700">
        <div>
          <span className="font-semibold">Category :</span>{" "}
          {scholarship.category}
        </div>

        <div>
          <span className="font-semibold">Amount :</span>{" "}
          {scholarship.amount || "Not Specified"}
        </div>

        <div>
          <span className="font-semibold">Gender :</span>{" "}
          {scholarship.genderEligibility}
        </div>

        <div>
          <span className="font-semibold">Income :</span>{" "}
          {scholarship.incomeEligibility || "No Limit"}
        </div>

        <div>
          <span className="font-semibold">Academic Year :</span>{" "}
          {scholarship.academicYear || "All"}
        </div>

        <div>
          <span className="font-semibold">Deadline :</span>{" "}
          {scholarship.deadline
            ? new Date(scholarship.deadline).toLocaleDateString()
            : "No Deadline"}
        </div>
      </div>

      {scholarship.applicableBranch &&
        scholarship.applicableBranch.length > 0 && (
          <div className="mt-5">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Applicable Branches
            </p>

            <div className="flex flex-wrap gap-2">
              {scholarship.applicableBranch.map((branch) => (
                <span
                  key={branch}
                  className="px-3 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-100"
                >
                  {branch}
                </span>
              ))}
            </div>
          </div>
        )}

      <div className="flex justify-end mt-6">
        <Link
         to={`/dashboard/finance-vault/${scholarship._id || scholarship.id}`}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default ScholarshipCard;