import { useEffect, useState } from "react";
import { GitMerge, Search } from "lucide-react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../api/careersApi";
import { Modal, StatusChip, inputClass, outlineButton, primaryButton } from "./components/ui";
import { plural } from "./components/format";
import MergePostingsDialog from "./components/MergePostingsDialog";

// Merge `company` (the one being absorbed) into a target chosen by search.
export default function MergeDialog({ company, onClose, onDone }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [target, setTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pairs, setPairs] = useState(null); // { list, targetId } after the merge (P7-T8)
  const [mergingPair, setMergingPair] = useState(null);
  const [mergedPairs, setMergedPairs] = useState([]);

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
      // P7-T8: the merge can bring two copies of one role together; offer to merge them.
      if (res.data?.possibleDuplicatePostings?.length) setPairs({ list: res.data.possibleDuplicatePostings, targetId: target.id });
      else onDone(target.id);
    } catch (err) {
      toast.error(errorMessage(err, "Merge failed."));
    } finally {
      setSaving(false);
    }
  };

  if (pairs) {
    const done = () => onDone(pairs.targetId);
    return (
      <>
        <Modal title="Possible duplicate postings" onClose={done}
          footer={<button type="button" className={primaryButton} onClick={done}>Done</button>}>
          <p className="text-xs text-slate-500 mb-3">The two companies had postings that look like the same role. Merge the ones that are; leave the rest.</p>
          <ul className="space-y-2">
            {pairs.list.map((p) => {
              const key = p.postingIds.join("-");
              const merged = mergedPairs.includes(key);
              return (
                <li key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                  <span className="min-w-0 text-slate-700 break-words">#{p.postingIds[0]} {p.roleTitles[0]} <span className="text-slate-400">·</span> #{p.postingIds[1]} {p.roleTitles[1]}</span>
                  {merged ? <span className="text-xs font-semibold text-emerald-700">Merged</span> : (
                    <button type="button" className={outlineButton} onClick={() => setMergingPair(p)}><GitMerge size={14} /> Merge…</button>
                  )}
                </li>
              );
            })}
          </ul>
        </Modal>
        {mergingPair && (
          <MergePostingsDialog drop={{ id: mergingPair.postingIds[1], roleTitle: mergingPair.roleTitles[1] }} keepId={mergingPair.postingIds[0]}
            onClose={() => setMergingPair(null)}
            onDone={() => { setMergedPairs((m) => [...m, mergingPair.postingIds.join("-")]); setMergingPair(null); }} />
        )}
      </>
    );
  }

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
