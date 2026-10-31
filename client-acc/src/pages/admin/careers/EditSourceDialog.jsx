// Edit a board's name and company (P6-T11, F-07). The ATS and board token are fixed: a different
// token is a different board (add it instead). Archive lives here too, with a confirmation.
import { useState } from "react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../api/careersApi";
import CompanyPicker from "./components/CompanyPicker";
import { Modal, dangerButton, inputClass, outlineButton, primaryButton } from "./components/ui";

export default function EditSourceDialog({ source, onClose, onDone }) {
  const [name, setName] = useState(source.name);
  const [company, setCompany] = useState(source.company ? { companyId: source.company.id, name: source.company.name, status: source.company.status } : null);
  const [saving, setSaving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [exclude, setExclude] = useState((source.excludeTitleKeywords ?? []).join(", "));
  const [include, setInclude] = useState((source.includeTitleKeywords ?? []).join(", "));

  const run = async (fn) => {
    setSaving(true);
    try {
      const res = await fn();
      toast.success(res.message, { duration: 6000 });
      onDone();
    } catch (err) {
      toast.error(errorMessage(err), { duration: 8000 });
    } finally {
      setSaving(false);
    }
  };

  const save = (e) => {
    e.preventDefault();
    if (!company?.companyId) return toast.error("Choose the company this board belongs to.");
    const body = {};
    if (name.trim() !== source.name) body.name = name.trim();
    if (company.companyId !== source.company?.id) body.companyId = company.companyId;
    // P7-T9: comma-separated keyword rules for this board's titles.
    const list = (v) => v.split(",").map((k) => k.trim()).filter(Boolean);
    if (list(exclude).join(",") !== (source.excludeTitleKeywords ?? []).join(",")) body.excludeTitleKeywords = list(exclude);
    if (list(include).join(",") !== (source.includeTitleKeywords ?? []).join(",")) body.includeTitleKeywords = list(include);
    if (!Object.keys(body).length) return onClose();
    return run(() => careersAdminApi.updateSource(source.id, body));
  };

  return (
    <Modal title="Edit board" onClose={saving ? () => {} : onClose}
      footer={confirmArchive ? (
        <>
          <button type="button" className={outlineButton} onClick={() => setConfirmArchive(false)} disabled={saving}>Keep it</button>
          <button type="button" className={dangerButton} onClick={() => run(() => careersAdminApi.archiveSource(source.id))} disabled={saving}>{saving ? "Archiving…" : "Archive board"}</button>
        </>
      ) : (
        <>
          <button type="button" className={`${outlineButton} mr-auto text-rose-700`} onClick={() => setConfirmArchive(true)} disabled={saving}>Archive…</button>
          <button type="button" className={outlineButton} onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="edit-source" className={primaryButton} disabled={saving || !name.trim()}>{saving ? "Saving…" : "Save"}</button>
        </>
      )}>
      {confirmArchive ? (
        <div className="space-y-2 text-sm text-slate-600">
          <p><span className="font-semibold text-slate-800">{source.name}</span> will stop being fetched and leave this list (see it with "Show archived").</p>
          <p>Nothing is deleted: its postings and past runs keep their history, and you can restore it at any time.</p>
        </div>
      ) : (
        <form id="edit-source" onSubmit={save} className="space-y-4">
          <p className="text-xs text-slate-500">{source.kind.toLowerCase()} / <span className="font-mono">{source.boardToken}</span> (fixed; a different token is a different board)</p>
          <div>
            <label htmlFor="edit-src-name" className="text-xs font-semibold text-slate-600">Name</label>
            <input id="edit-src-name" className={`${inputClass} mt-1`} value={name} maxLength={120} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="edit-src-company" className="text-xs font-semibold text-slate-600">Company</label>
            <div className="mt-1"><CompanyPicker id="edit-src-company" value={company} onChange={setCompany} /></div>
            <p className="mt-1 text-[11px] text-slate-500">New postings from this board go to this company; existing postings keep theirs.</p>
          </div>
          <div>
            <label htmlFor="edit-src-exclude" className="text-xs font-semibold text-slate-600">Drop titles containing</label>
            <input id="edit-src-exclude" className={`${inputClass} mt-1`} value={exclude} onChange={(e) => setExclude(e.target.value)} placeholder="e.g. tele, sales, field executive" />
          </div>
          <div>
            <label htmlFor="edit-src-include" className="text-xs font-semibold text-slate-600">Only keep titles containing</label>
            <input id="edit-src-include" className={`${inputClass} mt-1`} value={include} onChange={(e) => setInclude(e.target.value)} placeholder="Empty = keep everything the global rules keep" />
            <p className="mt-1 text-[11px] text-slate-500">Comma-separated whole words, applied after the global rules from the next fetch on. Postings already listed stay until you take them down.</p>
          </div>
        </form>
      )}
    </Modal>
  );
}
