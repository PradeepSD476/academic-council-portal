import { useContext, useState } from "react";
import { Building2 } from "lucide-react";
import AuthContext from "../../../context/auth/authContext";
import { useCareersStatus } from "../../../hooks/useCareersStatus";
import CompanyPicker from "./CompanyPicker";

// Company field on the admin experience editor (B-33). Pre-filled with the company the experience
// is linked to (the student's choice); onChange gets the new company id, or null when cleared.
// The editor sends it only after a change, so an untouched link never blocks a save.
export default function ExperienceCompanyField({ company, onChange }) {
  const { user } = useContext(AuthContext);
  const careers = useCareersStatus(user?.id);
  const [value, setValue] = useState(company ? { value: company.id, label: company.name } : null);

  if (!careers.enabled) return null;

  return (
    <div className="space-y-1.5 md:col-span-2">
      <label htmlFor="editor-company" className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
        <Building2 size={14} className="text-blue-600" />
        <span>Company</span>
      </label>
      <CompanyPicker
        inputId="editor-company"
        value={value}
        onChange={(next) => {
          setValue(next);
          onChange(next ? next.value : null);
        }}
        noMatchText="No approved company matches. Add it on the Companies page first."
        plain
      />
      <p className="text-xs text-slate-500">The experience shows on this company's page once published. Clear it to unlink.</p>
    </div>
  );
}
