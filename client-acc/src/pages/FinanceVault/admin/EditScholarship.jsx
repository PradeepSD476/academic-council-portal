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
          `${import.meta.env.VITE_API_URL}/v1/finance-vault/${id}`,
          { withCredentials: true }
        );
        const s = data.data;
        setFormData({
          title:               s.title || "",
          description:         s.description || "",
          category:            s.category || "SCHOLARSHIP",
          provider:            s.provider || "",
          amount:              s.amount || "",
          eligibilityCriteria: s.eligibilityCriteria || "",
          incomeEligibility:   s.incomeEligibility || "",
          genderEligibility:   s.genderEligibility || "ALL",
          applicableBranch:    s.applicableBranch || [],
          academicYear:        s.academicYear || "",
          deadline:            s.deadline ? new Date(s.deadline).toISOString().substring(0, 10) : "",
          applicationUrl:      s.applicationUrl || "",
          officialWebsite:     s.officialWebsite || "",
          requiredDocuments:   s.requiredDocuments || "",
          attachments:         s.attachments || null,
          isActive:            s.isActive,
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
        `${import.meta.env.VITE_API_URL}/v1/finance-vault/${id}`,
        formData,
        { withCredentials: true }
      );
      toast.success("Scholarship updated successfully.");
      navigate("/admin/finance-vault");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to update scholarship.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-9 h-9 border-3 border-slate-200 border-t-[var(--color-secondary)] rounded-full animate-spin" />
        <p className="text-slate-500 text-xs font-semibold">Loading opportunity details...</p>
      </div>
    );
  }

  return (
    <ScholarshipForm
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
      loading={loading}
      buttonText="Update Opportunity"
      backTo="/admin/finance-vault"
    />
  );
};

export default EditScholarship;