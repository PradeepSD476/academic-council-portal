// Add an ATS job board. The server reads the board once before saving, so a wrong token is
// reported here instead of failing at the next ingest.
import { useState } from "react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../api/careersApi";
import CompanyPicker from "./components/CompanyPicker";
import { Modal, inputClass, outlineButton, primaryButton } from "./components/ui";

const KINDS = [
  { value: "GREENHOUSE", label: "Greenhouse", example: "boards.greenhouse.io/<token>" },
  { value: "LEVER", label: "Lever", example: "jobs.lever.co/<token>" },
  { value: "ASHBY", label: "Ashby", example: "jobs.ashbyhq.com/<token>" },
];

export default function AddSourceDialog({ onClose, onDone }) {
  const [kind, setKind] = useState("GREENHOUSE");
  const [boardToken, setBoardToken] = useState("");
  const [company, setCompany] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!company?.companyId) return toast.error("Choose the company this board belongs to.");
    setSaving(true);
    try {
      const res = await careersAdminApi.createSource({ kind, boardToken: boardToken.trim(), companyId: company.companyId });
      toast.success(res.message, { duration: 6000 });
      onDone();
    } catch (err) {
      toast.error(errorMessage(err), { duration: 8000 });
    } finally {
      setSaving(false);
    }
  };

  const example = KINDS.find((k) => k.value === kind).example;
  return (
    <Modal title="Add a job board" onClose={onClose}
      footer={(
        <>
          <button type="button" className={outlineButton} onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="add-source" className={primaryButton} disabled={saving}>{saving ? "Checking the board…" : "Check and add"}</button>
        </>
      )}>
      <form id="add-source" onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="src-kind" className="text-xs font-semibold text-slate-600">ATS</label>
            <select id="src-kind" className={`${inputClass} mt-1`} value={kind} onChange={(e) => setKind(e.target.value)}>
              {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="src-token" className="text-xs font-semibold text-slate-600">Board token</label>
            <input id="src-token" className={`${inputClass} mt-1`} value={boardToken} onChange={(e) => setBoardToken(e.target.value)} required placeholder="e.g. stripe" />
            <p className="mt-1 text-[11px] text-slate-500">The last part of the board URL: {example}</p>
          </div>
        </div>
        <div>
          <label htmlFor="src-company" className="text-xs font-semibold text-slate-600">Company</label>
          <div className="mt-1"><CompanyPicker id="src-company" value={company} onChange={setCompany} /></div>
        </div>
      </form>
    </Modal>
  );
}
