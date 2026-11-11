import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Undo2 } from "lucide-react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../api/careersApi";
import { Skeleton, cardClass, dangerButton, outlineButton } from "./components/ui";
import { plural } from "./components/format";

const fmt = (iso) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

// History of merges and splits. Undo works newest-first; the server refuses anything else and
// says which later change to undo first.
export default function MergeLog({ refreshKey, onChanged }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await careersAdminApi.listMergeLog({ limit: 50 });
      setRows(res.data);
    } catch (err) {
      toast.error(errorMessage(err, "Could not load the history."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const undo = async (id) => {
    setBusyId(id);
    try {
      const res = await careersAdminApi.undoMergeLog(id);
      toast.success(res.message);
      setConfirmId(null);
      await load();
      onChanged?.();
    } catch (err) {
      toast.error(errorMessage(err, "Undo failed."));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Skeleton rows={4} />;
  if (rows.length === 0) {
    return <div className={`${cardClass} p-8 text-center text-sm text-slate-500`}>No merges or splits yet. Corrections you make will appear here and can be undone.</div>;
  }

  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.id} className={`${cardClass} p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${r.undoneAt ? "opacity-60" : ""}`}>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border bg-slate-50 border-slate-200 text-slate-600">
                #{r.id} {r.action}
              </span>
              <span className="font-semibold text-slate-800">{r.fromCompany?.name ?? `#${r.fromCompanyId}`}</span>
              <ArrowRight size={14} className="text-slate-400" aria-label={r.action === "MERGE" ? "merged into" : "split into"} />
              <span className="font-semibold text-slate-800">{r.toCompany?.name ?? `#${r.toCompanyId}`}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {plural(r.moved?.aliasIds?.length ?? 0, "alias", "aliases")} · {plural(r.moved?.experienceIds?.length ?? 0, "experience")} · by {r.performedBy ?? "admin"} · {fmt(r.createdAt)}
              {r.undoneAt && <> · <span className="font-semibold">undone</span> by {r.undoneBy ?? "admin"} · {fmt(r.undoneAt)}</>}
            </p>
          </div>
          {!r.undoneAt && (
            confirmId === r.id ? (
              <div className="flex gap-2">
                <button type="button" className={outlineButton} onClick={() => setConfirmId(null)}>Keep</button>
                <button type="button" className={dangerButton} onClick={() => undo(r.id)} disabled={busyId === r.id}>
                  <Undo2 size={14} /> Confirm undo
                </button>
              </div>
            ) : (
              <button type="button" className={outlineButton} onClick={() => setConfirmId(r.id)}>
                <Undo2 size={14} /> Undo
              </button>
            )
          )}
        </li>
      ))}
    </ul>
  );
}
