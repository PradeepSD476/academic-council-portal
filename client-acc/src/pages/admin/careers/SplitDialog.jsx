import { useState } from "react";
import { Split } from "lucide-react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../api/careersApi";
import { Modal, inputClass, outlineButton, primaryButton } from "./components/ui";

function toggle(set, id) {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

// `company` is the full detail object (with aliases and experiences).
export default function SplitDialog({ company, onClose, onDone }) {
  const [name, setName] = useState("");
  const [aliasIds, setAliasIds] = useState(new Set());
  const [experienceIds, setExperienceIds] = useState(new Set());
  const [saving, setSaving] = useState(false);

  const keepsAlias = aliasIds.size < company.aliases.length;
  const movesSomething = aliasIds.size + experienceIds.size > 0;
  const canSubmit = name.trim() && keepsAlias && movesSomething && !saving;

  const submit = async () => {
    setSaving(true);
    try {
      const res = await careersAdminApi.splitCompany(company.id, {
        name: name.trim(),
        aliasIds: [...aliasIds],
        experienceIds: [...experienceIds],
      });
      toast.success(res.message);
      onDone(res.data.created.id);
    } catch (err) {
      toast.error(errorMessage(err, "Split failed."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      wide
      title={`Split a company out of “${company.name}”`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={outlineButton} onClick={onClose}>Cancel</button>
          <button type="button" className={primaryButton} onClick={submit} disabled={!canSubmit}>
            <Split size={14} /> Create “{name.trim() || "…"}”
          </button>
        </>
      }
    >
      <p className="text-xs text-slate-500 mb-4">
        Use this when two different organisations were wrongly treated as one. The selected aliases and experiences
        move to a new company. Logged and undoable from the History tab.
      </p>
      <label htmlFor="split-name" className="text-xs font-semibold text-slate-600">New company name</label>
      <input id="split-name" className={`${inputClass} mt-1.5 mb-5`} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Google Cloud" autoFocus />

      <div className="grid gap-5 sm:grid-cols-2">
        <fieldset>
          <legend className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Aliases to move</legend>
          <div className="space-y-1.5">
            {company.aliases.map((a) => (
              <label key={a.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={aliasIds.has(a.id)} onChange={() => setAliasIds((s) => toggle(s, a.id))} />
                {a.alias}
              </label>
            ))}
          </div>
          {!keepsAlias && <p className="text-xs text-rose-600 mt-2">{company.name} must keep at least one alias.</p>}
        </fieldset>
        <fieldset>
          <legend className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Experiences to move</legend>
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {company.experiences.map((e) => (
              <label key={e.id} className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" className="mt-1" checked={experienceIds.has(e.id)} onChange={() => setExperienceIds((s) => toggle(s, e.id))} />
                <span>{e.title}</span>
              </label>
            ))}
            {company.experiences.length === 0 && <p className="text-xs text-slate-500">No linked experiences.</p>}
          </div>
        </fieldset>
      </div>
    </Modal>
  );
}
