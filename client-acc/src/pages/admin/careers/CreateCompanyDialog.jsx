import { useState } from "react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../api/careersApi";
import { Modal, inputClass, outlineButton, primaryButton } from "./components/ui";

export default function CreateCompanyDialog({ onClose, onDone }) {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [aliases, setAliases] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await careersAdminApi.createCompany({
        name: name.trim(),
        website: website.trim() || null,
        aliases: aliases.split(",").map((a) => a.trim()).filter(Boolean),
      });
      toast.success(`${created.name} created.`);
      onDone(created.id);
    } catch (err) {
      toast.error(errorMessage(err, "Could not create the company."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add a company" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="new-co-name" className="text-xs font-semibold text-slate-600">Name <span className="text-[var(--color-secondary)]">*</span></label>
          <input id="new-co-name" className={`${inputClass} mt-1.5`} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sprinklr" autoFocus />
        </div>
        <div>
          <label htmlFor="new-co-web" className="text-xs font-semibold text-slate-600">Website (optional)</label>
          <input id="new-co-web" className={`${inputClass} mt-1.5`} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
        </div>
        <div>
          <label htmlFor="new-co-aliases" className="text-xs font-semibold text-slate-600">Other names (optional, comma separated)</label>
          <input id="new-co-aliases" className={`${inputClass} mt-1.5`} value={aliases} onChange={(e) => setAliases(e.target.value)} placeholder="e.g. Sprinklr India, SPRINKLR" />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className={outlineButton} onClick={onClose}>Cancel</button>
          <button type="submit" className={primaryButton} disabled={saving || !name.trim()}><Plus size={14} /> Create</button>
        </div>
      </form>
    </Modal>
  );
}
