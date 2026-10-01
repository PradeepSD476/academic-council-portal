// Manual entry: an admin adds a posting by hand (e.g. from a company email). It can wait in the
// review queue or be published at once (the admin is the reviewer).
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, PenLine } from "lucide-react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../api/careersApi";
import CompanyPicker from "./components/CompanyPicker";
import PostingFields from "./components/PostingFields";
import UncertainField from "./components/UncertainField";
import { fromForm, toForm } from "./components/postingForm";
import { PageHeader, cardClass, outlineButton, primaryButton } from "./components/ui";

export default function ManualPosting() {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => toForm({ type: "INTERNSHIP" }));
  const [company, setCompany] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const submit = async (publish) => {
    if (!company) return toast.error("Choose a company.");
    if (publish && company.status !== "ACTIVE") return toast.error("Only postings of an active company can be published. Save it for review instead, or approve the company first.");
    const values = fromForm(form);
    const body = { ...values, publish, ...(company.companyId ? { companyId: company.companyId } : { companyName: company.name }) };
    setSaving(true);
    try {
      const res = await careersAdminApi.createPosting(body);
      toast.success(res.message);
      if (res.data.possibleDuplicates?.length) {
        toast(`Looks similar to: ${res.data.possibleDuplicates.map((d) => `#${d.id} ${d.roleTitle}`).join(", ")}`, { duration: 8000 });
      }
      navigate("/admin/careers/review");
    } catch (err) {
      const details = err?.response?.data?.details;
      toast.error(Array.isArray(details) ? details.map((d) => d.issue ?? d).join(" ") : errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={PenLine} title="Add a posting" subtitle="For openings that reach ACC by email or another channel. Only state what the source states.">
        <Link to="/admin/careers/review" className={outlineButton}><ArrowLeft size={14} /> Review queue</Link>
      </PageHeader>
      <form className={`${cardClass} p-5 space-y-6`} onSubmit={(e) => { e.preventDefault(); submit(false); }}>
        <PostingFields form={form} set={set}
          companySlot={(
            <UncertainField id="mp-company" label="Company" hint="Pick a known company, or type a new name (it becomes a candidate company for review).">
              <CompanyPicker id="mp-company" value={company} onChange={setCompany} allowNew />
            </UncertainField>
          )} />
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="submit" className={outlineButton} disabled={saving}>Save for review</button>
          <button type="button" className={primaryButton} disabled={saving} onClick={() => submit(true)}>Publish now</button>
        </div>
      </form>
    </div>
  );
}
