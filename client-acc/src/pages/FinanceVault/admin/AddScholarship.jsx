import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import ScholarshipForm from "./ScholarshipForm";

const AddScholarship = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_API_URL}/v1/finance-vault`, formData, {
        withCredentials: true,
      });
      toast.success("Finance opportunity added successfully!");
      navigate("/admin/finance-vault");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to add opportunity.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScholarshipForm
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
      loading={loading}
      buttonText="Add Opportunity"
      backTo="/admin/finance-vault"
    />
  );
};

export default AddScholarship;