import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";

const ScholarshipDetails = () => {
  const { id } = useParams();

  const [scholarship, setScholarship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchScholarship = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/finance-vault/${id}`, {
          withCredentials: true,
        });

        setScholarship(data.data);
      } catch (err) {
        console.error(err);
        setError("Unable to fetch scholarship.");
      } finally {
        setLoading(false);
      }
    };

    fetchScholarship();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <h2 className="text-xl font-semibold">Loading...</h2>
      </div>
    );
  }

  if (error || !scholarship) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <h2 className="text-xl font-semibold text-red-600">
          {error || "Scholarship Not Found"}
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-8">

        <Link
          to="/dashboard/finance-vault"
          className="inline-flex items-center px-4 py-2 mb-6 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          ← Back
        </Link>

        <h1 className="text-3xl font-bold">
          {scholarship.title}
        </h1>

        <p className="mt-4 text-gray-700 leading-relaxed">
          {scholarship.description}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

          <div>
            <h3 className="font-semibold text-gray-700">Provider</h3>
            <p>{scholarship.provider || "Not Specified"}</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700">Category</h3>
            <p>{scholarship.category}</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700">
              Scholarship Amount
            </h3>
            <p>{scholarship.amount || "Not Specified"}</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700">
              Gender Eligibility
            </h3>
            <p>{scholarship.genderEligibility}</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700">
              Family Income Eligibility
            </h3>
            <p>{scholarship.incomeEligibility || "No Restriction"}</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700">
              Academic Year
            </h3>
            <p>{scholarship.academicYear || "All"}</p>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-semibold text-gray-700">
              Eligibility Criteria
            </h3>

            <p className="whitespace-pre-line">
              {scholarship.eligibilityCriteria || "Not Specified"}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700">
              Deadline
            </h3>

            <p>
              {scholarship.deadline
                ? new Date(scholarship.deadline).toLocaleDateString()
                : "No Deadline"}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700">
              Status
            </h3>

            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                scholarship.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {scholarship.isActive ? "Active" : "Inactive"}
            </span>
          </div>

        </div>

        {scholarship.applicableBranch &&
          scholarship.applicableBranch.length > 0 && (
            <div className="mt-8">

              <h2 className="text-2xl font-semibold mb-3">
                Applicable Branches
              </h2>

              <div className="flex flex-wrap gap-2">
                {scholarship.applicableBranch.map((branch) => (
                  <span
                    key={branch}
                    className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm"
                  >
                    {branch}
                  </span>
                ))}
              </div>

            </div>
          )}

        {scholarship.subCategory &&
          scholarship.subCategory.length > 0 && (
            <div className="mt-6">

              <h2 className="text-2xl font-semibold mb-3">
                Eligible Categories
              </h2>

              <div className="flex flex-wrap gap-2">
                {scholarship.subCategory.map((cat) => (
                  <span
                    key={cat}
                    className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm"
                  >
                    {cat}
                  </span>
                ))}
              </div>

            </div>
          )}

        {scholarship.state &&
          scholarship.state.length > 0 && (
            <div className="mt-6">

              <h2 className="text-2xl font-semibold mb-3">
                Applicable States
              </h2>

              <div className="flex flex-wrap gap-2">
                {scholarship.state.map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm"
                  >
                    {s}
                  </span>
                ))}
              </div>

            </div>
          )}

        {scholarship.requiredDocuments && (
          <div className="mt-8">

            <h2 className="text-2xl font-semibold mb-3">
              Required Documents
            </h2>

            <p className="whitespace-pre-line">
              {scholarship.requiredDocuments}
            </p>

          </div>
        )}

        {scholarship.officialWebsite && (
          <div className="mt-8">

            <h2 className="text-2xl font-semibold mb-3">
              Official Website
            </h2>

            <a
              href={scholarship.officialWebsite}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {scholarship.officialWebsite}
            </a>

          </div>
        )}

        <div className="mt-10 flex gap-4">

          {scholarship.applicationUrl && (
            <a
              href={scholarship.applicationUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
            >
              Apply Now
            </a>
          )}

          {scholarship.officialWebsite && (
            <a
              href={scholarship.officialWebsite}
              target="_blank"
              rel="noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
            >
              Visit Official Website
            </a>
          )}

        </div>

      </div>
    </div>
  );
};

export default ScholarshipDetails;