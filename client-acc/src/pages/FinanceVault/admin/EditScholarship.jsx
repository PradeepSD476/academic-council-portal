import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import ScholarshipForm from "./ScholarshipForm";

const EditScholarship = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "SCHOLARSHIP",
    provider: "",
    amount: "",
    eligibilityCriteria: "",
    incomeEligibility: "",
    genderEligibility: "ALL",
    applicableBranch: [],
    academicYear: "",
    deadline: "",
    applicationUrl: "",
    officialWebsite: "",
    requiredDocuments: "",
    attachments: null,
    isActive: true,
  });

  useEffect(() => {
    const fetchScholarship = async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/v1/finance-vault/${id}`,
          {
            withCredentials: true,
          }
        );

        const scholarship = data.data;

        setFormData({
          title: scholarship.title || "",
          description: scholarship.description || "",
          category: scholarship.category || "SCHOLARSHIP",
          provider: scholarship.provider || "",
          amount: scholarship.amount || "",
          eligibilityCriteria:
            scholarship.eligibilityCriteria || "",
          incomeEligibility:
            scholarship.incomeEligibility || "",
          genderEligibility:
            scholarship.genderEligibility || "ALL",
          applicableBranch:
            scholarship.applicableBranch || [],
          academicYear: scholarship.academicYear || "",
         deadline: scholarship.deadline 
  ? new Date(scholarship.deadline).toISOString().substring(0, 10) 
  : "",
          applicationUrl:
            scholarship.applicationUrl || "",
          officialWebsite:
            scholarship.officialWebsite || "",
          requiredDocuments:
            scholarship.requiredDocuments || "",
          attachments:
            scholarship.attachments || null,
          isActive: scholarship.isActive,
        });
      } catch (err) {
        console.error(err);

        toast.error("Failed to fetch scholarship.");

        navigate("/admin/finance-vault");
      } finally {
        setFetching(false);
      }
    };

    fetchScholarship();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/v1/finance-vault/${id}`,
        formData,
        {
          withCredentials: true,
        }
      );

      toast.success("Scholarship updated successfully.");

      navigate("/admin/finance-vault");
    } catch (err) {
      console.error(err);

      toast.error(
        err?.response?.data?.message ||
          "Failed to update scholarship."
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <h2 className="text-xl font-semibold">
          Loading...
        </h2>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-6">
      <ScholarshipForm
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        loading={loading}
        buttonText="Update Opportunity"
      />
    </div>
  );
};

export default EditScholarship;