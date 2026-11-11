// Manual entry: an admin adds a posting by hand (e.g. from a company email). It can wait in the
// review queue or be published at once (the admin is the reviewer). Opened with ?fromLink=<id>&url=…
// from a student's link (P5-T4): the URL is prefilled and the link then points at the new posting.
// "Fill from link" (F-34) reads the link (job board, page data, or the AI step) and fills the form;
// nothing is saved until the admin checks the fields and saves.
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Link2, PenLine, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../api/careersApi";
import CompanyPicker from "./components/CompanyPicker";
import PostingFields from "./components/PostingFields";
import UncertainField from "./components/UncertainField";
import { fromForm, toForm } from "./components/postingForm";
import { PageHeader, cardClass, inputClass, outlineButton, primaryButton } from "./components/ui";

const SOURCE_TEXT = { ATS: "Filled from the company's job board.", JSON_LD: "Filled from the job data on the page.", AI: "Filled by the AI step." };

export default function ManualPosting() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const fromLink = Number(params.get("fromLink")) || null;
  const [form, setForm] = useState(() => toForm({ type: "INTERNSHIP", ...(fromLink && params.get("url") ? { applyUrl: params.get("url") } : {}) }));
  const [company, setCompany] = useState(null);
  const [saving, setSaving] = useState(false);
  const [linkUrl, setLinkUrl] = useState(params.get("url") ?? "");
  const [filling, setFilling] = useState(false);
  const [filled, setFilled] = useState(null); // { source, uncertainFields, note }
  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const fillFromLink = async () => {
    const url = linkUrl.trim();
    if (!url) return toast.error("Paste the job link first.");
    const typed = form.roleTitle || form.location || form.descriptionText || company;
    if (typed && !window.confirm("Replace what is already in the form with what the link says?")) return;
    setFilling(true);
    try {
      const res = await careersAdminApi.draftFromUrl(url);
      setForm(toForm({ ...res.draft, applyUrl: res.draft.applyUrl || url }));
      if (res.company) setCompany(res.company);
      setFilled({ source: res.source, uncertainFields: res.uncertainFields, note: res.note });
      toast.success("Form filled. Check each field before saving.");
    } catch (err) {
      toast.error(errorMessage(err, "Could not read that link."), { duration: 8000 });
    } finally {
      setFilling(false);
    }
  };

  const submit = async (publish) => {
    if (!company) return toast.error("Choose a company.");
    if (publish && company.status !== "ACTIVE") return toast.error("Only postings of an active company can be published. Save it for review instead, or approve the company first.");
    const values = fromForm(form);
    const body = { ...values, publish, ...(company.companyId ? { companyId: company.companyId } : { companyName: company.name }), ...(fromLink ? { submissionId: fromLink } : {}) };
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
      {fromLink && (
        <p className="flex items-center gap-2 text-xs text-blue-800 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <Link2 size={14} aria-hidden="true" /> From student link #{fromLink}. The student will see this posting under "My shared links" once it is live.
        </p>
      )}
      <section className={`${cardClass} p-4 space-y-2`} aria-labelledby="fill-title">
        <h2 id="fill-title" className="flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]"><Sparkles size={15} className="text-[var(--color-secondary)]" aria-hidden="true" /> Fill from link</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <label htmlFor="mp-link" className="sr-only">Job link</label>
          <input id="mp-link" className={inputClass} placeholder="https://… the job's page" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
          <button type="button" className={`${primaryButton} shrink-0`} onClick={fillFromLink} disabled={filling}><Sparkles size={14} /> {filling ? "Reading the page…" : "Fill from link"}</button>
        </div>
        <p className="text-[11px] text-slate-500">Reads the company's job board or the page's job data when it has it, otherwise the AI step. Nothing is saved until you save below; fields marked “Check” need a careful look.</p>
        {filled && (
          <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
            {SOURCE_TEXT[filled.source]} {filled.note}
          </p>
        )}
      </section>
      <form className={`${cardClass} p-5 space-y-6`} onSubmit={(e) => { e.preventDefault(); submit(false); }}>
        <PostingFields form={form} set={set} uncertain={filled?.uncertainFields ?? []}
          companySlot={(
            <UncertainField id="mp-company" label="Company" uncertain={!!filled?.uncertainFields.includes("company")} hint="Pick a known company, or type a new name (it becomes a candidate company for review).">
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
