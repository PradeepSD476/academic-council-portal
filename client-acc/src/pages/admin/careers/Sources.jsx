// Job boards (ATS sources): health, last run, enable/disable, run now, recent runs.
import { Fragment, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ChevronDown, ChevronUp, Link2, Play, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../api/careersApi";
import AddSourceDialog from "./AddSourceDialog";
import HealthBadge from "./components/HealthBadge";
import { PageHeader, Skeleton, cardClass, outlineButton, primaryButton } from "./components/ui";

const when = (iso) => (iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "never");

function Runs({ sourceId }) {
  const [runs, setRuns] = useState(null);
  useEffect(() => {
    careersAdminApi.listRuns(sourceId, 10).then(setRuns).catch((err) => toast.error(errorMessage(err)));
  }, [sourceId]);
  if (!runs) return <p className="text-xs text-slate-500">Loading runs…</p>;
  if (!runs.length) return <p className="text-xs text-slate-500">No runs yet.</p>;
  return (
    <ul className="space-y-1">
      {runs.map((r) => (
        <li key={r.id} className="text-xs text-slate-600">
          <span className={r.status === "FAILED" ? "font-semibold text-rose-700" : "font-semibold"}>{r.status}</span> · {when(r.startedAt)} ·
          {" "}{r.fetchedCount} fetched, {r.keptCount} relevant, {r.newCount} new, {r.duplicateCount} merged
          {r.error && <span className="block text-rose-700 break-words">{r.error}</span>}
        </li>
      ))}
    </ul>
  );
}

export default function Sources() {
  const [data, setData] = useState(null);
  const [openRuns, setOpenRuns] = useState(null);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await careersAdminApi.listSources());
    } catch (err) {
      toast.error(errorMessage(err, "Could not load sources."));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id, fn) => {
    setBusyId(id);
    try {
      const res = await fn();
      toast.success(res.message);
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const boards = data?.data.filter((s) => s.boardToken) ?? [];
  const pending = data?.pendingRequest;

  return (
    <div className="space-y-6">
      <PageHeader icon={Link2} title="Sources" subtitle="Public job boards fetched every night at 02:00 IST. Only roles in India (or remote) and early-career are kept.">
        <Link to="/admin/careers/ops" className={outlineButton}><Activity size={14} /> Operations</Link>
        <button type="button" className={outlineButton} disabled={busyId === "all"} onClick={() => act("all", careersAdminApi.runAllSources)}><Play size={14} /> Run all</button>
        <button type="button" className={primaryButton} onClick={() => setAdding(true)}><Plus size={14} /> Add board</button>
      </PageHeader>

      {pending && (
        <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          Run requested for {pending.sourceId === "ALL" ? "all sources" : `source #${pending.sourceId}`} at {when(pending.requestedAt)}. The worker picks it up within about a minute; if this stays here, check that the worker is running.
        </p>
      )}

      {!data ? <Skeleton rows={6} /> : (
        <div className={`${cardClass} overflow-hidden`}>
          <ul className="divide-y divide-slate-100">
            {boards.map((s) => (
              <Fragment key={s.id}>
                <li className="px-4 py-3 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <HealthBadge health={s.health} />
                      <span className="text-sm font-semibold text-slate-800 truncate">{s.name}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {s.kind.toLowerCase()} / {s.boardToken} · {s.company?.name ?? "no company"} · last run {when(s.lastRunAt)}
                      {s.lastFetchedCount !== null && ` · ${s.lastFetchedCount} fetched, ${s.lastKeptCount} relevant`} · {s.liveObservations} live
                    </p>
                    {s.health === "FAILING" && s.lastError && (
                      <p className="mt-1 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-2 py-1 break-words">
                        {s.lastError} ({s.consecutiveFailures} failed run{s.consecutiveFailures === 1 ? "" : "s"} in a row)
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={outlineButton} onClick={() => setOpenRuns(openRuns === s.id ? null : s.id)} aria-expanded={openRuns === s.id}>
                      Runs {openRuns === s.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button type="button" className={outlineButton} disabled={!s.isEnabled || busyId === s.id} onClick={() => act(s.id, () => careersAdminApi.runSource(s.id))}><Play size={14} /> Run now</button>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer px-2">
                      <input type="checkbox" className="w-4 h-4 accent-[var(--color-primary)]" checked={s.isEnabled} disabled={busyId === s.id}
                        onChange={() => act(s.id, () => careersAdminApi.updateSource(s.id, { isEnabled: !s.isEnabled }))} />
                      Enabled
                    </label>
                  </div>
                </li>
                {openRuns === s.id && <li className="px-4 py-3 bg-slate-50/70"><Runs sourceId={s.id} /></li>}
              </Fragment>
            ))}
          </ul>
        </div>
      )}

      {adding && <AddSourceDialog onClose={() => setAdding(false)} onDone={() => { setAdding(false); load(); }} />}
    </div>
  );
}
