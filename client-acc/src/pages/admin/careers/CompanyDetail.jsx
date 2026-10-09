import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, GitMerge, Pencil, Plus, Split, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../api/careersApi";
import { Modal, Skeleton, StatusChip, inputClass, outlineButton, primaryButton } from "./components/ui";
import MergeDialog from "./MergeDialog";
import SplitDialog from "./SplitDialog";
import { safeHref } from "../../Careers/lib/format";

const ORIGIN_LABEL = { SEED: "seed", MANUAL: "admin", AUTO: "auto", MERGE: "merge" };

export default function CompanyDetail({ companyId, onClose, onChanged, onOpenCompany }) {
  const [company, setCompany] = useState(null);
  const [alias, setAlias] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", website: "" });
  const [dialog, setDialog] = useState(null); // "merge" | "split" | null
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await careersAdminApi.getCompany(companyId);
      setCompany(data);
      setForm({ name: data.name, website: data.website || "" });
    } catch (err) {
      toast.error(errorMessage(err, "Could not load the company."));
      onClose();
    }
  }, [companyId, onClose]);

  useEffect(() => {
    setCompany(null);
    load();
  }, [load]);

  const run = async (fn, success) => {
    setBusy(true);
    try {
      await fn();
      if (success) toast.success(success);
      await load();
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const addAlias = (e) => {
    e.preventDefault();
    if (!alias.trim()) return;
    run(() => careersAdminApi.addAlias(companyId, alias.trim()), "Alias added.").then(() => setAlias(""));
  };

  const saveEdit = (e) => {
    e.preventDefault();
    run(() => careersAdminApi.updateCompany(companyId, { name: form.name.trim(), website: form.website.trim() || null }), "Company updated.")
      .then(() => setEditing(false));
  };

  const merged = company?.status === "MERGED";

  return (
    <Modal wide title={company ? company.name : "Loading…"} onClose={onClose}>
      {!company ? <Skeleton rows={4} /> : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={company.status} />
            <span className="text-xs text-slate-500">/{company.slug}</span>
            {company.website && (
              <a href={safeHref(company.website) ?? undefined} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-secondary)] hover:underline">{company.website}</a>
            )}
          </div>

          {merged && company.mergedInto && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Merged into{" "}
              <button type="button" className="font-semibold text-[var(--color-secondary)] hover:underline cursor-pointer" onClick={() => onOpenCompany(company.mergedInto.id)}>
                {company.mergedInto.name}
              </button>
              . Undo it from the History tab.
            </div>
          )}

          {!merged && (
            <div className="flex flex-wrap gap-2">
              {company.status === "CANDIDATE" && (
                <button type="button" className={primaryButton} disabled={busy} onClick={() => run(() => careersAdminApi.approveCompany(companyId), `${company.name} approved.`)}>
                  <CheckCircle2 size={14} /> Approve as a real company
                </button>
              )}
              <button type="button" className={outlineButton} onClick={() => setDialog("merge")}><GitMerge size={14} /> Merge into…</button>
              <button type="button" className={outlineButton} onClick={() => setDialog("split")} disabled={company.aliases.length < 2 && company.experiences.length === 0}>
                <Split size={14} /> Split…
              </button>
              <button type="button" className={outlineButton} onClick={() => setEditing((v) => !v)}><Pencil size={14} /> Edit</button>
            </div>
          )}

          {editing && (
            <form onSubmit={saveEdit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end">
              <div>
                <label htmlFor="co-name" className="text-xs font-semibold text-slate-600">Name</label>
                <input id="co-name" className={`${inputClass} mt-1`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label htmlFor="co-web" className="text-xs font-semibold text-slate-600">Website (optional)</label>
                <input id="co-web" className={`${inputClass} mt-1`} placeholder="https://" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>
              <button type="submit" className={primaryButton} disabled={busy || !form.name.trim()}>Save</button>
            </form>
          )}

          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Aliases ({company.aliases.length})</h3>
            <p className="text-xs text-slate-500 mb-2">Names that resolve to this company. Spelling variants like “Pvt Ltd” or “India” are matched automatically.</p>
            <ul className="flex flex-wrap gap-2 mb-3">
              {company.aliases.map((a) => (
                <li key={a.id} className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-lg border border-slate-200 bg-white text-sm text-slate-700">
                  {a.alias}
                  <span className="text-[10px] text-slate-400">{ORIGIN_LABEL[a.origin]}</span>
                  {!merged && company.aliases.length > 1 && (
                    <button type="button" aria-label={`Remove alias ${a.alias}`} disabled={busy}
                      onClick={() => run(() => careersAdminApi.deleteAlias(a.id), "Alias removed.")}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer">
                      <Trash2 size={13} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {!merged && (
              <form onSubmit={addAlias} className="flex gap-2">
                <label htmlFor="new-alias" className="sr-only">New alias</label>
                <input id="new-alias" className={inputClass} placeholder="Add an alias, e.g. Alphabet" value={alias} onChange={(e) => setAlias(e.target.value)} />
                <button type="submit" className={outlineButton} disabled={busy || !alias.trim()}><Plus size={14} /> Add</button>
              </form>
            )}
          </section>

          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Linked Career Vault experiences ({company.experiences.length})</h3>
            {company.experiences.length === 0 ? (
              <p className="text-xs text-slate-500">None yet. Experiences are linked from the experience backfill tool.</p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {company.experiences.map((e) => (
                  <li key={e.id} className="px-3 py-2 text-sm text-slate-700 flex justify-between gap-3">
                    <span className="truncate">{e.title}</span>
                    <span className="text-xs text-slate-400 shrink-0">{e.experienceType.toLowerCase()} · {e.status.toLowerCase()}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {dialog === "merge" && company && (
        <MergeDialog company={company} onClose={() => setDialog(null)} onDone={(targetId) => { setDialog(null); onChanged(); onOpenCompany(targetId); }} />
      )}
      {dialog === "split" && company && (
        <SplitDialog company={company} onClose={() => setDialog(null)} onDone={(newId) => { setDialog(null); onChanged(); onOpenCompany(newId); }} />
      )}
    </Modal>
  );
}
