import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, ExternalLink, GraduationCap, MapPin, SearchX, Share2, Wallet } from "lucide-react";
import AuthContext from "../../context/auth/authContext";
import { careersApi, errorMessage } from "../../api/careersApi";
import { useCareersStatus } from "../../hooks/useCareersStatus";
import CompensationBadge from "./components/CompensationBadge";
import EligibilityBadge from "./components/EligibilityBadge";
import FreshnessLine from "./components/FreshnessLine";
import SourceLinks from "./components/SourceLinks";
import ExperiencePanel from "./components/ExperiencePanel";
import SubmitLinkModal from "./components/SubmitLinkModal";
import EmptyState from "./components/EmptyState";
import { collectedBy, formatDate, safeHref } from "./lib/format";

const TYPE_LABELS = { INTERNSHIP: "Internship", FULL_TIME: "Full-time" };
const MODE_LABELS = { ONSITE: "On-site", HYBRID: "Hybrid", REMOTE: "Remote" };
const YEAR_NAMES = ["1st", "2nd", "3rd", "4th", "5th"];
const chip = "inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider";
const card = "p-5 rounded-2xl border border-slate-200 bg-white/95 shadow-xs";
const railTitle = "flex items-center gap-2 text-sm font-bold text-[var(--color-primary)] mb-2";

function BackLink() {
  const location = useLocation();
  const navigate = useNavigate();
  // Back to the filtered list the student came from when there is one, else to the plain list.
  const fromList = location.state?.fromList;
  return (
    <button
      type="button"
      onClick={() => (fromList ? navigate(-1) : navigate("/dashboard/career-vault/jobs"))}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[var(--color-primary)] cursor-pointer"
    >
      <ArrowLeft size={14} aria-hidden="true" /> All openings
    </button>
  );
}

function Rail({ posting }) {
  const e = posting.eligibility;
  return (
    // Below lg the rail comes first: pay and eligibility before a long description.
    <aside className="order-first lg:order-none space-y-4 lg:sticky lg:top-4 self-start">
      <section aria-labelledby="pay-title" className={card}>
        <h2 id="pay-title" className={railTitle}><Wallet size={16} className="text-[var(--color-secondary)]" aria-hidden="true" /> Pay</h2>
        <div className="text-sm"><CompensationBadge posting={posting} /></div>
        {posting.compensationRaw && (
          <p className="mt-2 text-xs text-slate-500">As written by the source: <q className="text-slate-700">{posting.compensationRaw}</q></p>
        )}
      </section>

      <section aria-labelledby="elig-title" className={card}>
        <h2 id="elig-title" className={railTitle}><GraduationCap size={16} className="text-[var(--color-secondary)]" aria-hidden="true" /> Eligibility</h2>
        <EligibilityBadge eligibility={e} />
        {e.status !== "NOT_STATED" && (
          <dl className="mt-3 space-y-1 text-xs text-slate-600">
            <div><dt className="inline font-semibold">Branches: </dt><dd className="inline">{posting.eligibleBranches.length ? posting.eligibleBranches.join(", ") : "not stated"}</dd></div>
            <div><dt className="inline font-semibold">Years: </dt><dd className="inline">{posting.eligibleYears.length ? posting.eligibleYears.map((y) => YEAR_NAMES[y - 1] ?? y).join(", ") : "not stated"}</dd></div>
            <div><dt className="inline font-semibold">Minimum CPI: </dt><dd className="inline">{posting.minCpi ?? "not stated"}</dd></div>
          </dl>
        )}
      </section>

      <ExperiencePanel company={posting.company} count={posting.companyExperienceCount} recent={posting.companyExperiences} />

      <SourceLinks observations={posting.observations} />
    </aside>
  );
}

export default function JobDetailPage() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const status = useCareersStatus(user?.id);
  const [posting, setPosting] = useState(null);
  const [error, setError] = useState(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!status.enabled) return undefined;
    let alive = true;
    setPosting(null);
    setError(null);
    careersApi.getPosting(id)
      .then((p) => { if (alive) setPosting(p); })
      .catch((err) => {
        if (!alive) return;
        const code = err?.response?.data?.error;
        setError(code === "NOT_FOUND" || code === "VALIDATION_ERROR" ? "GONE" : code === "CAREERS_DISABLED" ? "DISABLED" : errorMessage(err, "Could not load this posting."));
      });
    return () => { alive = false; };
  }, [id, status.enabled]);

  if (status.loading) return <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" aria-hidden="true" />;
  if (!status.enabled || error === "DISABLED") {
    return <EmptyState icon={SearchX} title="Jobs & Internships isn't open yet." detail="The Academic Council will announce it when it is ready." />;
  }
  if (error) {
    return (
      <div className="space-y-4">
        <BackLink />
        {error === "GONE"
          ? <EmptyState icon={SearchX} title="This posting is not available." detail="It may have closed or been removed. Other openings are still listed." />
          : <EmptyState icon={SearchX} title="This posting could not be loaded." detail={error} />}
      </div>
    );
  }
  if (!posting) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <div className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  const applyHref = safeHref(posting.applyUrl);
  return (
    <div className="space-y-6">
      <BackLink />

      <header className={card}>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/dashboard/career-vault/companies/${posting.company.slug}`} className="text-sm font-bold text-teal-700 hover:underline">{posting.company.name}</Link>
          {TYPE_LABELS[posting.type] && <span className={`${chip} text-blue-700 bg-blue-50 border-blue-100`}>{TYPE_LABELS[posting.type]}</span>}
          {MODE_LABELS[posting.workMode] && <span className={`${chip} text-slate-600 bg-slate-50 border-slate-200`}>{MODE_LABELS[posting.workMode]}</span>}
          {posting.status !== "LIVE" && <span className={`${chip} text-amber-700 bg-amber-50 border-amber-100`}>Admin preview · {posting.status.replace("_", " ")}</span>}
        </div>
        <h1 className="mt-2 text-2xl md:text-3xl font-extrabold text-[var(--color-primary)] tracking-tight">{posting.roleTitle}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <MapPin size={14} className="text-slate-400" aria-hidden="true" />
            <span className={posting.location ? "" : "italic"}>{posting.location || "Location not stated"}</span>
          </span>
          <FreshnessLine posting={posting} />
          {posting.deadlineStated && (
            <span className="inline-flex items-center gap-1 text-slate-600">
              <CalendarDays size={14} className="text-slate-400" aria-hidden="true" />
              Deadline stated by source: {formatDate(posting.deadlineStated, { utc: true })}
            </span>
          )}
          {posting.ppoMentioned === true && <span className="text-slate-600">PPO mentioned by the source</span>}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {applyHref && (
            <a
              href={applyHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[var(--color-secondary)] hover:opacity-90 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-[0_8px_20px_var(--color-secondary-glow)]"
            >
              Apply on the company site <ExternalLink size={14} aria-hidden="true" />
            </a>
          )}
          <button type="button" onClick={() => setSharing(true)} className="academic-btn-outline inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer">
            <Share2 size={14} aria-hidden="true" /> Share another job link
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <section aria-labelledby="desc-title" className={`${card} min-w-0`}>
          <h2 id="desc-title" className="text-base font-bold text-[var(--color-primary)] mb-3">About the role</h2>
          {posting.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {posting.skills.map((s) => <span key={s} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">{s}</span>)}
            </div>
          )}
          {/* Plain text from the source, never rendered as HTML. */}
          <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line break-words">{posting.descriptionText}</div>
          <p className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
            {collectedBy(posting.extractionTier)} Always check the details on the company's own page before applying.
          </p>
        </section>
        <Rail posting={posting} />
      </div>

      {sharing && <SubmitLinkModal onClose={() => setSharing(false)} />}
    </div>
  );
}
