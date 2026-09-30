import { useCallback, useEffect, useState } from "react";
import { Building2, ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../api/careersApi";
import { PageHeader, Skeleton, StatusChip, cardClass, inputClass, outlineButton, primaryButton } from "./components/ui";
import { plural } from "./components/format";
import CompanyDetail from "./CompanyDetail";
import CreateCompanyDialog from "./CreateCompanyDialog";
import MergeLog from "./MergeLog";

const TABS = [
  { key: "ACTIVE", label: "Active" },
  { key: "CANDIDATE", label: "Candidates" },
  { key: "MERGED", label: "Merged" },
  { key: "HISTORY", label: "History" },
];
const PAGE_SIZE = 25;

export default function Companies() {
  const [tab, setTab] = useState("ACTIVE");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [list, setList] = useState({ data: [], pagination: { total: 0, totalPages: 1 } });
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => { setQuery(q.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    if (tab === "HISTORY") return;
    setLoading(true);
    try {
      setList(await careersAdminApi.listCompanies({ status: tab, q: query || undefined, page, limit: PAGE_SIZE }));
    } catch (err) {
      toast.error(errorMessage(err, "Could not load companies."));
    } finally {
      setLoading(false);
    }
  }, [tab, query, page]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  const closeDetail = useCallback(() => setOpenId(null), []);

  return (
    <div className="space-y-6">
      <PageHeader icon={Building2} title="Companies" subtitle="One record per organisation. Postings and Career Vault experiences link here, never to raw names.">
        <button type="button" className={primaryButton} onClick={() => setCreating(true)}><Plus size={14} /> Add company</button>
      </PageHeader>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex gap-1.5 flex-wrap" role="tablist" aria-label="Company status">
          {TABS.map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={tab === t.key}
              onClick={() => { setTab(t.key); setPage(1); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${tab === t.key ? "bg-white text-slate-950 font-bold border border-slate-200 shadow-xs" : "text-slate-600 hover:bg-white/80"}`}>
              {t.label}
            </button>
          ))}
        </div>
        {tab !== "HISTORY" && (
          <div className="relative md:ml-auto md:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <label htmlFor="company-search" className="sr-only">Search companies</label>
            <input id="company-search" className={`${inputClass} pl-9`} placeholder="Search name or alias" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        )}
      </div>

      {tab === "CANDIDATE" && (
        <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          Candidates were created automatically from names that didn’t match any known company. Approve real new companies, or merge a candidate into the company it actually is.
        </p>
      )}

      {tab === "HISTORY" ? (
        <MergeLog refreshKey={refreshKey} onChanged={refresh} />
      ) : loading ? (
        <Skeleton rows={6} />
      ) : list.data.length === 0 ? (
        <div className={`${cardClass} p-8 text-center text-sm text-slate-500`}>
          {query ? `No ${tab.toLowerCase()} companies match “${query}”.` : `No ${tab.toLowerCase()} companies.`}
        </div>
      ) : (
        <div className={`${cardClass} overflow-hidden`}>
          <ul className="divide-y divide-slate-100">
            {list.data.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => setOpenId(c.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition cursor-pointer">
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-slate-800 truncate">{c.name}</span>
                    <span className="block text-xs text-slate-500">{plural(c._count.aliases, "alias", "aliases")} · {plural(c._count.experiences, "linked experience")}</span>
                  </span>
                  <StatusChip status={c.status} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab !== "HISTORY" && list.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{plural(list.pagination.total, "company", "companies")}</span>
          <div className="flex items-center gap-2">
            <button type="button" className={outlineButton} disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page"><ChevronLeft size={14} /></button>
            <span>Page {page} of {list.pagination.totalPages}</span>
            <button type="button" className={outlineButton} disabled={page >= list.pagination.totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page"><ChevronRight size={14} /></button>
          </div>
        </div>
      )}

      {openId && <CompanyDetail companyId={openId} onClose={closeDetail} onChanged={refresh} onOpenCompany={setOpenId} />}
      {creating && <CreateCompanyDialog onClose={() => setCreating(false)} onDone={(id) => { setCreating(false); refresh(); setOpenId(id); }} />}
    </div>
  );
}
