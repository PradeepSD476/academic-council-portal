import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Bookmark, SearchX } from "lucide-react";
import AuthContext from "../../context/auth/authContext";
import { careersApi, errorMessage } from "../../api/careersApi";
import { useCareersStatus } from "../../hooks/useCareersStatus";
import CareerVaultTabs from "./components/CareerVaultTabs";
import EmptyState from "./components/EmptyState";
import ApplyNudge from "./components/ApplyNudge";
import { applyNudgeAt } from "./lib/applyNudge";
import SavedDeadlines from "./components/SavedDeadlines";
import JobCard from "./components/JobCard";
import PageTitle from "./components/PageTitle";
import { APPLICATION_STATUSES } from "./lib/tracking";
import { plural } from "./lib/format";

const SUBTITLE = "Postings you saved or are tracking. Only you can see this list.";

// Filter pills: everything, bookmarked only, then each application status.
const FILTERS = [
  { value: "", label: "All", match: () => true },
  { value: "saved", label: "Bookmarked", match: (p) => p.saved },
  ...APPLICATION_STATUSES.map((s) => ({ value: s.value, label: s.label, match: (p) => p.applicationStatus === s.value })),
];

export default function SavedPage() {
  const { user } = useContext(AuthContext);
  const status = useCareersStatus(user?.id);
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!status.enabled) return undefined;
    let alive = true;
    careersApi.listSaved()
      .then((res) => { if (alive) { setItems(res.data); setError(null); } })
      .catch((err) => { if (alive) setError(err?.response?.data?.error === "CAREERS_DISABLED" ? "DISABLED" : errorMessage(err, "Could not load your saved postings.")); });
    return () => { alive = false; };
  }, [status.enabled, reload]);

  // A card that is unsaved and untracked stays until the next load, so the list doesn't jump.
  const patch = useCallback((id, changes) => setItems((list) => list.map((p) => (p.id === id ? { ...p, ...changes } : p))), []);
  const [dismissed, setDismissed] = useState(() => new Set());

  if (status.loading) return <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" aria-hidden="true" />;
  if (!status.enabled || error === "DISABLED") {
    return (
      <div className="space-y-6">
        <PageTitle title="Saved" subtitle={SUBTITLE} />
        <EmptyState icon={Bookmark} title="Jobs & Internships isn't open yet." detail="The Academic Council will announce it when it is ready." />
      </div>
    );
  }

  const show = search.get("show") ?? "";
  const filter = FILTERS.find((f) => f.value === show) ?? FILTERS[0];
  const counts = Object.fromEntries(FILTERS.map((f) => [f.value, items ? items.filter(f.match).length : 0]));
  const visible = items ? items.filter(filter.match) : [];
  const pick = (value) => setSearch((prev) => {
    const next = new URLSearchParams(prev);
    if (value) next.set("show", value); else next.delete("show");
    return next;
  }, { replace: true });

  let body;
  if (error) {
    body = <EmptyState icon={SearchX} title="Saved postings could not be loaded." detail={error} action="Try again" onAction={() => setReload((n) => n + 1)} />;
  } else if (!items) {
    body = <div className="space-y-3" aria-hidden="true">{[0, 1, 2].map((i) => <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse" />)}</div>;
  } else if (items.length === 0) {
    body = <EmptyState icon={Bookmark} title="Nothing saved yet." detail="Use the bookmark on any opening to keep it here, or set your application status on its page." action="Browse openings" onAction={() => navigate("/dashboard/career-vault/jobs")} />;
  } else if (visible.length === 0) {
    body = <EmptyState icon={SearchX} title={`No postings marked "${filter.label}".`} detail={`You have ${plural(items.length, "saved or tracked posting")} in total.`} action="Show all" onAction={() => pick("")} />;
  } else {
    body = (
      <ul className="space-y-3">
        {visible.map((p) => <li key={p.id}><JobCard posting={p} showStatus onChange={(changes) => patch(p.id, changes)} /></li>)}
      </ul>
    );
  }

  // "Did you apply?" (P6-T4): live postings whose Apply button was clicked in this browser.
  const nudges = (items ?? [])
    .filter((p) => p.status !== "EXPIRED" && !dismissed.has(p.id))
    .map((p) => ({ posting: p, at: applyNudgeAt(p.id, p.applicationStatus) }))
    .filter((n) => n.at);

  return (
    <div className="space-y-6">
      <PageTitle title="Saved" subtitle={SUBTITLE} />
      <CareerVaultTabs />
      {nudges.length > 0 && (
        <div className="space-y-2" aria-label="Did you apply?">
          {nudges.map(({ posting, at }) => (
            <ApplyNudge key={posting.id} posting={posting} at={at} title={`${posting.roleTitle} · ${posting.company.name}`}
              onApplied={(changes) => patch(posting.id, changes)}
              onDismiss={() => setDismissed((s) => new Set(s).add(posting.id))} />
          ))}
        </div>
      )}
      {items?.length > 0 && <SavedDeadlines items={items} />}
      {items?.length > 0 && (
        <div role="group" aria-label="Filter saved postings" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value || "all"}
              type="button"
              aria-pressed={filter.value === f.value}
              onClick={() => pick(f.value)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] ${filter.value === f.value
                ? "bg-white border-slate-200 shadow-xs text-slate-950 font-bold"
                : "border-transparent text-slate-600 hover:bg-white/80 hover:text-slate-950"}`}
            >
              {f.label} <span className="text-slate-400">{counts[f.value]}</span>
            </button>
          ))}
        </div>
      )}
      {body}
    </div>
  );
}
