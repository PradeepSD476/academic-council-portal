import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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

    await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/finance-vault`, formData, {
      withCredentials: true,
    });

    alert("Finance Opportunity Added Successfully");
    navigate("/admin/finance-vault");
  } catch (err) {
    console.error("Full Error Object:", err);
    const backendError = err?.response?.data?.message || err?.response?.data || err.message;
    alert("Server Response: " + JSON.stringify(backendError));
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="max-w-6xl mx-auto py-8 px-6">
      <ScholarshipForm
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        loading={loading}
        buttonText="Add Opportunity"
      />
    </div>
  );
};

export default AddScholarship;