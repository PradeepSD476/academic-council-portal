import { useContext, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Briefcase, Building2, ChevronLeft, ChevronRight, MessageSquareText, Search, SearchX } from "lucide-react";
import AuthContext from "../../context/auth/authContext";
import { careersApi, errorMessage } from "../../api/careersApi";
import { useCareersStatus } from "../../hooks/useCareersStatus";
import CareerVaultTabs from "./components/CareerVaultTabs";
import DraftInput from "./components/DraftInput";
import EmptyState from "./components/EmptyState";
import PageTitle from "./components/PageTitle";
import { plural } from "./lib/format";

const SUBTITLE = "Companies with open roles or experiences shared by seniors.";
const pagerButton = "flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-100 text-slate-600 hover:text-[var(--color-primary)] hover:bg-sky-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer font-semibold";

function CompanyCard({ company }) {
  return (
    <Link
      to={`/dashboard/career-vault/companies/${company.slug}`}
      className="flex items-start gap-3 p-5 rounded-2xl border border-slate-200 bg-white/95 shadow-xs hover:border-[var(--color-secondary)]/40 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
    >
      <span className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center bg-teal-50 border border-teal-100 text-teal-700">
        <Building2 size={18} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-base font-bold text-[var(--color-primary)] truncate">{company.name}</span>
        <span className="mt-1.5 flex flex-wrap gap-1.5">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${company.openRoles ? "text-teal-700 bg-teal-50 border-teal-100" : "text-slate-500 bg-slate-50 border-slate-200"}`}>
            <Briefcase size={12} aria-hidden="true" /> {company.openRoles ? plural(company.openRoles, "open role") : "No open roles"}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${company.experiences ? "text-teal-700 bg-teal-50 border-teal-100" : "text-slate-500 bg-slate-50 border-slate-200"}`}>
            <MessageSquareText size={12} aria-hidden="true" /> {company.experiences ? plural(company.experiences, "experience") : "No experiences yet"}
          </span>
        </span>
      </span>
    </Link>
  );
}

export default function CompaniesPage() {
  const { user } = useContext(AuthContext);
  const status = useCareersStatus(user?.id);
  const [search, setSearch] = useSearchParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const q = search.get("q") ?? "";
  const page = Number(search.get("page")) || 1;
  useEffect(() => {
    if (!status.enabled) return undefined;
    let alive = true;
    careersApi.listCompanies({ q: q || undefined, page })
      .then((res) => { if (alive) { setResult(res); setError(null); } })
      .catch((err) => { if (alive) setError(err?.response?.data?.error === "CAREERS_DISABLED" ? "DISABLED" : errorMessage(err, "Could not load companies.")); });
    return () => { alive = false; };
  }, [q, page, status.enabled]);

  const go = (changes) => setSearch((prev) => {
    const next = new URLSearchParams(prev);
    for (const [k, v] of Object.entries(changes)) { if (v) next.set(k, String(v)); else next.delete(k); }
    return next;
  });

  if (status.loading) return <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" aria-hidden="true" />;
  if (!status.enabled || error === "DISABLED") {
    return (
      <div className="space-y-6">
        <PageTitle title="Companies" subtitle={SUBTITLE} />
        <EmptyState icon={Building2} title="Companies isn't open yet." detail="The Academic Council will announce it when it is ready." />
      </div>
    );
  }

  const total = result?.pagination?.total ?? 0;
  const totalPages = result?.pagination?.totalPages ?? 0;
  let body;
  if (error) body = <EmptyState icon={SearchX} title="Companies could not be loaded." detail={error} />;
  else if (!result) body = <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />)}</div>;
  else if (total === 0) {
    body = q
      ? <EmptyState icon={SearchX} title={`No company matches "${q}".`} detail="Only companies with open roles or shared experiences are listed." action="Clear search" onAction={() => go({ q: "", page: "" })} />
      : <EmptyState icon={Building2} title="No companies to show yet." detail="Companies appear here once they have open roles or shared experiences." />;
  } else {
    body = (
      <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {result.data.map((c) => <li key={c.id}><CompanyCard company={c} /></li>)}
      </ul>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle title="Companies" subtitle={SUBTITLE} />
      <CareerVaultTabs />
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        <label htmlFor="companies-search" className="sr-only">Search companies</label>
        <DraftInput
          id="companies-search"
          type="search"
          value={q}
          onCommit={(v) => go({ q: v.trim(), page: "" })}
          placeholder="Search companies"
          maxLength={100}
          className="w-full rounded-2xl border border-slate-200 bg-white/95 shadow-xs py-3 pl-11 pr-4 text-sm text-[var(--color-primary)] placeholder-slate-400 outline-none transition focus:border-[var(--color-secondary)] focus:ring-1 focus:ring-[var(--color-secondary)]"
        />
      </div>
      {result && total > 0 && <p className="text-xs text-slate-500" aria-live="polite">{plural(total, "company", "companies")}</p>}
      {body}
      {totalPages > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-between bg-white/95 shadow-xs border border-slate-200 rounded-2xl p-4 text-xs text-slate-500">
          <button type="button" disabled={page <= 1} onClick={() => go({ page: page - 1 > 1 ? page - 1 : "" })} className={pagerButton}><ChevronLeft size={14} aria-hidden="true" /> Previous</button>
          <span className="font-bold text-[var(--color-primary)]">Page {page} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => go({ page: page + 1 })} className={pagerButton}>Next <ChevronRight size={14} aria-hidden="true" /></button>
        </nav>
      )}
    </div>
  );
}
