import { useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, useReducedMotion } from "framer-motion";
import { Briefcase, ChevronLeft, ChevronRight, EyeOff, Info, Search, SearchX, Share2, SlidersHorizontal, X } from "lucide-react";
import AuthContext from "../../context/auth/authContext";
import { careersApi, errorMessage } from "../../api/careersApi";
import { useCareersStatus } from "../../hooks/useCareersStatus";
import CareerVaultTabs from "./components/CareerVaultTabs";
import JobCard from "./components/JobCard";
import { isNewSince, visitBaseline } from "./lib/tracking";
import JobFilters from "./components/JobFilters";
import QuickFilters from "./components/QuickFilters";
import EligibilityCard from "./components/EligibilityCard";
import EmptyState from "./components/EmptyState";
import SubmitLinkModal from "./components/SubmitLinkModal";
import DraftInput from "./components/DraftInput";
import { AboutBanner, AboutPanel } from "./components/AboutOpenings";
import { apiParams, withChanges, activeFilterCount, hasAnyFilter, cleared } from "./lib/filters";
import { plural } from "./lib/format";

const MotionLi = motion.li;
const LG = "(min-width: 1024px)";
const subscribe = (cb) => {
  const mq = window.matchMedia(LG);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useIsDesktop = () => useSyncExternalStore(subscribe, () => window.matchMedia(LG).matches);

const pagerButton = "flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-100 text-slate-600 hover:text-[var(--color-primary)] hover:bg-sky-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer font-semibold";

function Skeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[0, 1, 2].map((i) => <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse" />)}
    </div>
  );
}

function Header({ onShare, onAbout }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-[3px] h-6 bg-[var(--color-secondary)] rounded-full shadow-[0_0_8px_var(--color-secondary)]" />
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-primary)] tracking-tight">Jobs & Internships</h1>
        </div>
        <p className="text-slate-500 text-sm ml-4">
          Approved openings, collected from company career pages and links shared by students.
          {onAbout && (
            <button type="button" onClick={onAbout} className="ml-1.5 inline-flex items-center gap-1 font-semibold text-[var(--color-secondary)] hover:underline cursor-pointer">
              <Info size={13} aria-hidden="true" /> About these openings
            </button>
          )}
        </p>
      </div>
      {onShare && (
        <button
          type="button"
          onClick={onShare}
          className="self-start sm:self-auto inline-flex items-center gap-2 whitespace-nowrap bg-[var(--color-secondary)] hover:opacity-90 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-[0_8px_20px_var(--color-secondary-glow)] cursor-pointer"
        >
          <Share2 size={14} aria-hidden="true" /> Share a job link
        </button>
      )}
    </div>
  );
}

export default function JobsPage() {
  const { user } = useContext(AuthContext);
  const status = useCareersStatus(user?.id);
  const [search, setSearch] = useSearchParams();
  const [result, setResult] = useState(null); // { data, pagination, meta }
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [about, setAbout] = useState(false);
  const isDesktop = useIsDesktop();
  const reduceMotion = useReducedMotion();
  // Previous visit, for the "New" badges (read once per browser session; only while the feature is on).
  const baseline = useMemo(() => (status.enabled ? visitBaseline() : null), [status.enabled]);

  const query = search.toString();
  useEffect(() => {
    if (!status.enabled) return undefined;
    const controller = new AbortController();
    setLoading(true);
    careersApi.listPostings(apiParams(new URLSearchParams(query)), { signal: controller.signal })
      .then((res) => { setResult(res); setError(null); })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err?.response?.data?.error === "CAREERS_DISABLED" ? "DISABLED" : errorMessage(err, "Could not load openings."));
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, reload, status.enabled]);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setDrawerOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const change = useCallback((changes) => setSearch((prev) => withChanges(prev, changes)), [setSearch]);
  const clearAll = useCallback(() => setSearch((prev) => cleared(prev)), [setSearch]);
  const refresh = useCallback(() => setReload((n) => n + 1), []);

  // "Not for me" (P6-T9): the card leaves the list at once; the toast can bring it back.
  const dropCard = useCallback((id) => setResult((r) => (r ? {
    ...r,
    data: r.data.filter((p) => p.id !== id),
    pagination: { ...r.pagination, total: r.pagination.total - 1 },
    meta: { ...r.meta, hiddenByYou: r.meta.hiddenByYou + (r.meta.showHidden ? -1 : 1) },
  } : r)), []);
  const unhide = useCallback(async (id, again) => {
    try {
      await careersApi.unhidePosting(id);
      if (again) refresh(); else dropCard(id);
      toast.success("It is back in your list.");
    } catch (err) {
      toast.error(errorMessage(err, "Could not show it again."));
    }
  }, [dropCard, refresh]);
  const hide = useCallback(async (posting) => {
    try {
      await careersApi.hidePosting(posting.id);
      dropCard(posting.id);
      toast((t) => (
        <span className="flex items-center gap-3">
          <span>Hidden from your list.</span>
          <button type="button" className="font-bold underline cursor-pointer" onClick={() => { toast.dismiss(t.id); unhide(posting.id, true); }}>Undo</button>
        </span>
      ), { duration: 8000 });
    } catch (err) {
      toast.error(errorMessage(err, "Could not hide it."));
    }
  }, [dropCard, unhide]);

  if (status.loading) return <div className="space-y-6"><Header /><Skeleton /></div>;
  if (!status.enabled || error === "DISABLED") {
    return (
      <div className="space-y-6">
        <Header />
        <EmptyState icon={Briefcase} title="Jobs & Internships isn't open yet." detail="The Academic Council will announce it when it is ready." />
      </div>
    );
  }

  const page = result?.pagination?.page ?? 1;
  const totalPages = result?.pagination?.totalPages ?? 0;
  const total = result?.pagination?.total ?? 0;
  const meta = result?.meta;
  const filterCount = activeFilterCount(search);
  const sidebar = (
    <>
      <EligibilityCard onChange={refresh} />
      <JobFilters search={search} onChange={change} meta={meta} onClear={clearAll} />
    </>
  );

  const summary = meta && [
    plural(total, "opening"),
    meta.undisclosedIncluded > 0 && `${meta.undisclosedIncluded} with undisclosed pay included`,
    meta.hiddenByEligibility > 0 && `${meta.hiddenByEligibility} hidden by eligibility`,
  ].filter(Boolean).join(" · ");

  let body;
  if (error) {
    body = <EmptyState icon={SearchX} title="Openings could not be loaded." detail={error} action="Try again" onAction={refresh} />;
  } else if (!result) {
    body = <Skeleton />;
  } else if (total === 0) {
    if (meta.showHidden) {
      body = <EmptyState icon={EyeOff} title="Nothing hidden." detail={'Openings you mark "Not for me" are listed here, so you can bring them back.'} action="Back to all openings" onAction={() => change({ showHidden: "" })} />;
    } else if (meta.hiddenByEligibility > 0) {
      body = <EmptyState icon={SearchX} title="No openings match." detail={`${plural(meta.hiddenByEligibility, "is", "are")} hidden by "Eligible for me".`} action="Show all" onAction={() => change({ eligibleOnly: "" })} />;
    } else if (hasAnyFilter(search)) {
      body = <EmptyState icon={SearchX} title="No openings match these filters." detail="Try fewer filters or a different search." action="Clear filters" onAction={clearAll} />;
    } else {
      body = <EmptyState icon={Briefcase} title="No openings right now." detail="New openings are checked several times a day and reviewed by ACC before they appear here." />;
    }
  } else {
    body = (
      <ul className={`space-y-3 transition-opacity ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
        {result.data.map((p, i) => (
          <MotionLi
            key={p.id}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: Math.min(i, 8) * 0.02, ease: [0.16, 1, 0.3, 1] }}
          >
            {search.get("sort") === "deadline" && !p.deadlineStated && (i === 0 || result.data[i - 1].deadlineStated) && (
              <p className="mb-3 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">No deadline stated</p>
            )}
            <JobCard posting={p} isNew={isNewSince(p, baseline)}
              {...(meta?.showHidden ? { onUnhide: () => unhide(p.id) } : { onHide: () => hide(p) })} />
          </MotionLi>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-6">
      <Header onShare={() => setSharing(true)} onAbout={() => setAbout(true)} />
      <CareerVaultTabs />
      <AboutBanner onOpen={() => setAbout(true)} />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {isDesktop && <aside className="space-y-4 lg:sticky lg:top-4 self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overscroll-contain lg:-mx-1 lg:px-1 lg:pb-1">{sidebar}</aside>}

        <div className="space-y-4 min-w-0">
          <div className="flex gap-2">
            <div className="relative flex-1 min-w-0">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <label htmlFor="jobs-search" className="sr-only">Search openings</label>
              <DraftInput
                id="jobs-search"
                type="search"
                value={search.get("q") ?? ""}
                onCommit={(v) => change({ q: v.trim() })}
                placeholder="Search by role, company or skill"
                maxLength={100}
                className="w-full rounded-2xl border border-slate-200 bg-white/95 shadow-xs py-3 pl-11 pr-4 text-sm text-[var(--color-primary)] placeholder-slate-400 outline-none transition focus:border-[var(--color-secondary)] focus:ring-1 focus:ring-[var(--color-secondary)]"
              />
            </div>
            {!isDesktop && (
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="shrink-0 flex items-center gap-1.5 px-4 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-[var(--color-primary)] shadow-xs cursor-pointer"
              >
                <SlidersHorizontal size={15} aria-hidden="true" /> Filters{filterCount > 0 && ` (${filterCount})`}
              </button>
            )}
          </div>

          <QuickFilters search={search} onChange={change} onReplace={(next) => setSearch(next)} />

          {meta?.eligibility?.reason === "NO_ROLL_NUMBER" && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              "Eligible for me" needs your roll number. Add it in your profile; until then all openings are shown.
            </p>
          )}
          {meta?.showHidden ? (
            <p className="flex flex-wrap items-center gap-2 text-xs text-slate-600 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2">
              <EyeOff size={14} aria-hidden="true" /> Openings you marked "Not for me". Only you see this list.
              <button type="button" onClick={() => change({ showHidden: "" })} className="font-semibold text-[var(--color-secondary)] hover:underline cursor-pointer">Back to all openings</button>
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {summary && total > 0 && <p className="text-xs text-slate-500" aria-live="polite">{summary}</p>}
              {meta?.hiddenByYou > 0 && (
                <button type="button" onClick={() => change({ showHidden: "true" })} className="text-xs font-semibold text-slate-500 hover:text-[var(--color-secondary)] hover:underline cursor-pointer">
                  Show hidden ({meta.hiddenByYou})
                </button>
              )}
            </div>
          )}

          {body}

          {totalPages > 1 && (
            <nav aria-label="Pages" className="flex items-center justify-between bg-white/95 shadow-xs border border-slate-200 rounded-2xl p-4 text-xs text-slate-500">
              <button type="button" disabled={page <= 1} onClick={() => change({ page: page - 1 > 1 ? page - 1 : "" })} className={pagerButton}>
                <ChevronLeft size={14} aria-hidden="true" /> Previous
              </button>
              <span className="font-bold text-[var(--color-primary)]">Page {page} of {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => change({ page: page + 1 })} className={pagerButton}>
                Next <ChevronRight size={14} aria-hidden="true" />
              </button>
            </nav>
          )}
        </div>
      </div>

      {sharing && <SubmitLinkModal onClose={() => setSharing(false)} />}
      {about && <AboutPanel onClose={() => setAbout(false)} />}

      {!isDesktop && drawerOpen && (
        <div className="fixed inset-0 z-[70] flex justify-end bg-black/30" role="dialog" aria-modal="true" aria-label="Filters" onClick={() => setDrawerOpen(false)}>
          <div className="w-full max-w-sm h-full overflow-y-auto bg-[var(--color-canvas)] p-4 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--color-primary)]">Filters</h2>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close filters" className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            {sidebar}
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="sticky bottom-0 w-full px-5 py-3 rounded-xl text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-accent)] transition-colors cursor-pointer"
            >
              Show {plural(total, "opening")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
