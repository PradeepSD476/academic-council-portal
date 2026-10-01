// Operations: is the fetcher healthy? Alerts first (red, then amber), then the numbers, then flags.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, AlertTriangle, Briefcase, Cpu, Link2, ListChecks, RefreshCw, Server } from "lucide-react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../api/careersApi";
import FlagsCard from "./FlagsCard";
import StatCard from "./components/StatCard";
import { PageHeader, Skeleton, outlineButton } from "./components/ui";

const ALERT_LINKS = {
  SOURCE_FAILING: "/admin/careers/sources",
  SOURCE_ZERO_RESULTS: "/admin/careers/sources",
  FLAGGED_BACKLOG: "/admin/careers/review",
  SUBMISSIONS_FAILED: "/admin/careers/review",
};

function ago(minutes) {
  if (minutes === null) return "never";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 48 * 60) return `${Math.round(minutes / 60)} h ago`;
  return `${Math.round(minutes / 1440)} days ago`;
}

export default function Operations() {
  const [ops, setOps] = useState(null);

  const load = useCallback(async () => {
    try {
      setOps(await careersAdminApi.getOps());
    } catch (err) {
      toast.error(errorMessage(err, "Could not load the operations summary."));
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  const alerts = ops ? [...ops.alerts].sort((a, b) => (a.level === b.level ? 0 : a.level === "red" ? -1 : 1)) : [];
  const llm = ops?.llm;

  return (
    <div className="space-y-6">
      <PageHeader icon={Activity} title="Operations" subtitle="Health of the job fetcher. Problems show here instead of failing silently.">
        <Link to="/admin/careers/sources" className={outlineButton}><Link2 size={14} /> Sources</Link>
        <button type="button" className={outlineButton} onClick={load} aria-label="Refresh"><RefreshCw size={14} /></button>
      </PageHeader>

      {!ops ? <Skeleton rows={6} /> : (
        <>
          {alerts.length > 0 ? (
            <ul className="space-y-2" aria-label="Alerts">
              {alerts.map((a, i) => {
                const style = a.level === "red" ? "text-rose-800 bg-rose-50 border-rose-200" : "text-amber-800 bg-amber-50 border-amber-200";
                const link = ALERT_LINKS[a.code];
                return (
                  <li key={`${a.code}-${i}`} className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${style}`}>
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <span className="flex-1 break-words">{a.message}</span>
                    {link && <Link to={link} className="text-xs font-bold underline whitespace-nowrap">Open</Link>}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">No alerts. The worker is reporting and every board answered on its last run.</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            <StatCard icon={Server} title="Worker" value={ops.worker.stale ? "Stale" : "Running"} tone={ops.worker.stale ? "red" : "green"}>
              <p>Last heartbeat {ago(ops.worker.minutesSince)}{ops.worker.lastJob ? ` (${ops.worker.lastJob})` : ""}</p>
            </StatCard>
            <StatCard icon={Link2} title="Sources" value={`${ops.sources.ok}/${ops.sources.total} OK`} tone={ops.sources.failing ? "red" : ops.sources.zeroResults ? "amber" : "green"}>
              <p>{ops.sources.failing} failing · {ops.sources.zeroResults} empty · {ops.sources.disabled} disabled</p>
            </StatCard>
            <StatCard icon={ListChecks} title="Review queue" value={ops.queue.pending + ops.queue.flagged} tone={ops.queue.flagged > 50 ? "amber" : "slate"}>
              <p>{ops.queue.pending} pending · {ops.queue.flagged} flagged · {ops.queue.candidates} candidate companies</p>
              <p>Student links: {ops.queue.submissions.received} new · {ops.queue.submissions.extracting} extracting · {ops.queue.submissions.failed} failed</p>
            </StatCard>
            <StatCard icon={Cpu} title={`LLM (${llm.provider})`} value={llm.enabled ? (llm.usable === false ? "Unavailable" : "On") : "Off"} tone={llm.enabled && llm.usable === false ? "red" : "slate"}>
              <p>{llm.queued} queued · {llm.failedLast24h} failed (24 h) · {llm.todayRequests} calls today{llm.dailyLimit ? ` of ${llm.dailyLimit}` : ""}</p>
              {llm.budgetEnforced ? (
                <>
                  <p>${llm.monthSpendUsd.toFixed(2)} of ${llm.budgetUsd} this month</p>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full ${llm.pctUsed >= 80 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, llm.pctUsed ?? 0)}%` }} /></div>
                </>
              ) : <p>No spend cap ({llm.provider === "ollama" ? "local model, free" : "free tier"})</p>}
              {llm.reachable === null && <p className="text-slate-500">Reachability not checked</p>}
            </StatCard>
            <StatCard icon={Briefcase} title="Live postings" value={ops.postings.live}>
              <p>{ops.postings.newLast24h} new in 24 h · {ops.postings.expiredLast7d} expired in 7 days</p>
            </StatCard>
          </div>

          <FlagsCard onChanged={load} />
        </>
      )}
    </div>
  );
}
