import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Briefcase, Building2, ExternalLink, MessageSquareText, SearchX } from "lucide-react";
import AuthContext from "../../context/auth/authContext";
import { careersApi, errorMessage } from "../../api/careersApi";
import { useCareersStatus } from "../../hooks/useCareersStatus";
import CareerVaultTabs from "./components/CareerVaultTabs";
import EmptyState from "./components/EmptyState";
import ExperienceCard from "./components/ExperienceCard";
import JobCard from "./components/JobCard";
import PageTitle from "./components/PageTitle";
import { plural, safeHref } from "./lib/format";

const sectionTitle = "flex items-center gap-2 text-base md:text-lg font-bold text-[var(--color-primary)]";
const countChip = "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold text-teal-700 bg-teal-50 border-teal-100";

function BackLink() {
  return (
    <Link to="/dashboard/career-vault/companies" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[var(--color-primary)]">
      <ArrowLeft size={14} aria-hidden="true" /> All companies
    </Link>
  );
}

export default function CompanyPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const status = useCareersStatus(user?.id);
  const [company, setCompany] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!status.enabled) return undefined;
    let alive = true;
    setCompany(null);
    setError(null);
    careersApi.getCompany(slug)
      .then((c) => { if (alive) setCompany(c); })
      .catch((err) => {
        if (!alive) return;
        const data = err?.response?.data;
        // A merged company's old link goes to the company it was merged into.
        if (data?.details?.movedTo) return navigate(`/dashboard/career-vault/companies/${data.details.movedTo}`, { replace: true });
        setError(data?.error === "NOT_FOUND" ? "GONE" : data?.error === "CAREERS_DISABLED" ? "DISABLED" : errorMessage(err, "Could not load this company."));
      });
    return () => { alive = false; };
  }, [slug, status.enabled, navigate]);

  if (status.loading) return <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" aria-hidden="true" />;
  if (!status.enabled || error === "DISABLED") {
    return <EmptyState icon={Building2} title="Companies isn't open yet." detail="The Academic Council will announce it when it is ready." />;
  }
  if (error) {
    return (
      <div className="space-y-4">
        <BackLink />
        {error === "GONE"
          ? <EmptyState icon={SearchX} title="This company page does not exist." detail="The link may be old. Other companies are still listed." />
          : <EmptyState icon={SearchX} title="This company could not be loaded." detail={error} />}
      </div>
    );
  }
  if (!company) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  const website = safeHref(company.website);
  const { openRoles, experiences } = company.counts;
  return (
    <div className="space-y-6">
      <BackLink />
      <PageTitle
        title={company.name}
        subtitle={website && (
          <a href={website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[var(--color-secondary)] hover:underline">
            {new URL(website).hostname.replace(/^www\./, "")} <ExternalLink size={12} aria-hidden="true" />
          </a>
        )}
      />
      <CareerVaultTabs />
      <div className="flex flex-wrap gap-2">
        <span className={countChip}><Briefcase size={14} aria-hidden="true" /> {plural(openRoles, "open role")}</span>
        <span className={countChip}><MessageSquareText size={14} aria-hidden="true" /> {plural(experiences, "experience")} from seniors</span>
      </div>

      <section aria-labelledby="roles-title" className="space-y-3">
        <h2 id="roles-title" className={sectionTitle}><Briefcase size={18} className="text-[var(--color-secondary)]" aria-hidden="true" /> Open roles</h2>
        {company.postings.length
          ? <ul className="space-y-3">{company.postings.map((p) => <li key={p.id}><JobCard posting={p} /></li>)}</ul>
          : <EmptyState title={`No open roles at ${company.name} right now.`} detail="Openings appear here after ACC reviews them." />}
        {openRoles > company.postings.length && (
          <Link to={`/dashboard/career-vault/jobs?q=${encodeURIComponent(company.name)}`} className="inline-block text-xs font-semibold text-[var(--color-secondary)] hover:underline">
            See all {openRoles} open roles
          </Link>
        )}
      </section>

      <section aria-labelledby="exp-title" className="space-y-3">
        <h2 id="exp-title" className={sectionTitle}><MessageSquareText size={18} className="text-[var(--color-secondary)]" aria-hidden="true" /> Experiences from seniors</h2>
        {company.experiences.length
          ? <ul className="space-y-3">{company.experiences.map((e) => <li key={e.id}><ExperienceCard experience={e} /></li>)}</ul>
          : <EmptyState title={`No experiences shared about ${company.name} yet.`} detail="Interviewed or interned here? Share your experience in Career Vault." />}
      </section>
    </div>
  );
}
