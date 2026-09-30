import { useEffect, useState } from "react";
import { GitMerge, Search } from "lucide-react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../api/careersApi";
import { Modal, StatusChip, inputClass, outlineButton, primaryButton } from "./components/ui";
import { plural } from "./components/format";

// Merge `company` (the one being absorbed) into a target chosen by search.
export default function MergeDialog({ company, onClose, onDone }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [target, setTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const res = await careersAdminApi.listCompanies({ status: "ALL", q: q || undefined, limit: 8 });
        if (alive) setResults(res.data.filter((c) => c.id !== company.id && c.status !== "MERGED"));
      } catch (err) {
        if (alive) toast.error(errorMessage(err, "Could not search companies."));
      }
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q, company.id]);

  const submit = async () => {
    if (!target) return;
    setSaving(true);
    try {
      const res = await careersAdminApi.mergeCompanies(company.id, target.id);
      toast.success(res.message);
      onDone(target.id);
    } catch (err) {
      toast.error(errorMessage(err, "Merge failed."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Merge “${company.name}” into another company`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={outlineButton} onClick={onClose}>Cancel</button>
          <button type="button" className={primaryButton} onClick={submit} disabled={!target || saving}>
            <GitMerge size={14} /> {target ? `Merge into ${target.name}` : "Choose a company"}
          </button>
        </>
      }
    >
      <p className="text-xs text-slate-500 mb-3">
        All {plural(company._count?.aliases ?? 0, "alias", "aliases")} and {plural(company._count?.experiences ?? 0, "linked experience")} of{" "}
        <span className="font-semibold text-slate-700">{company.name}</span> will move to the company you pick.
        This is logged and can be undone from the History tab.
      </p>
      <label htmlFor="merge-search" className="text-xs font-semibold text-slate-600">Target company</label>
      <div className="relative mt-1.5 mb-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input id="merge-search" className={`${inputClass} pl-9`} placeholder="Search by name or alias" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      </div>
      <ul className="space-y-1.5" role="listbox" aria-label="Matching companies">
        {results.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              role="option"
              aria-selected={target?.id === c.id}
              onClick={() => setTarget(c)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border text-left text-sm transition cursor-pointer ${target?.id === c.id ? "border-[var(--color-secondary)] bg-[var(--color-secondary-light)]" : "border-slate-200 hover:bg-slate-50"}`}
            >
              <span className="font-semibold text-slate-800 truncate">{c.name}</span>
              <span className="flex items-center gap-2 shrink-0 text-xs text-slate-500">
                {plural(c._count.aliases, "alias", "aliases")} · {c._count.experiences} exp. <StatusChip status={c.status} />
              </span>
            </button>
          </li>
        ))}
        {results.length === 0 && <li className="text-xs text-slate-500 px-1 py-2">No matching companies.</li>}
      </ul>
    </Modal>
  );
}
