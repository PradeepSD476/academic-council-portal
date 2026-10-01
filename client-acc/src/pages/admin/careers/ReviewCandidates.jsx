// Review queue tab: companies created automatically from unmatched names. Approve real new
// companies, or merge a candidate into the company it really is.
import { useCallback, useEffect, useState } from "react";
import { Check, GitMerge } from "lucide-react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../api/careersApi";
import CompanyDetail from "./CompanyDetail";
import MergeDialog from "./MergeDialog";
import { Skeleton, cardClass, outlineButton } from "./components/ui";
import { plural } from "./components/format";

export default function ReviewCandidates({ onChanged, refreshKey }) {
  const [items, setItems] = useState(null);
  const [merging, setMerging] = useState(null);
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    try {
      setItems((await careersAdminApi.listCompanies({ status: "CANDIDATE", limit: 100 })).data);
    } catch (err) {
      toast.error(errorMessage(err, "Could not load candidate companies."));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const approve = async (c) => {
    try {
      await careersAdminApi.approveCompany(c.id);
      toast.success(`${c.name} approved.`);
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (!items) return <Skeleton rows={4} />;
  if (!items.length) return <div className={`${cardClass} p-8 text-center text-sm text-slate-500`}>No candidate companies. Every posting points at a confirmed company.</div>;

  return (
    <>
      <div className={`${cardClass} overflow-hidden`}>
        <ul className="divide-y divide-slate-100">
          {items.map((c) => (
            <li key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3">
              <button type="button" onClick={() => setOpenId(c.id)} className="flex-1 min-w-0 text-left cursor-pointer">
                <span className="block text-sm font-semibold text-slate-800 truncate">{c.name}</span>
                <span className="block text-xs text-slate-500">{plural(c._count.aliases, "alias", "aliases")} · created {new Date(c.createdAt).toLocaleDateString("en-IN")}</span>
              </button>
              <div className="flex gap-2">
                <button type="button" className={outlineButton} onClick={() => setMerging(c)}><GitMerge size={14} /> Merge into…</button>
                <button type="button" className={outlineButton} onClick={() => approve(c)}><Check size={14} /> Approve</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {merging && <MergeDialog company={merging} onClose={() => setMerging(null)} onDone={() => { setMerging(null); onChanged(); }} />}
      {openId && <CompanyDetail companyId={openId} onClose={() => setOpenId(null)} onChanged={onChanged} onOpenCompany={setOpenId} />}
    </>
  );
}
