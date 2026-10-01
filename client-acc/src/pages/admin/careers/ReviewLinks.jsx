// Review queue tab: links submitted by students and what happened to each one.
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../api/careersApi";
import { Skeleton, cardClass, inputClass } from "./components/ui";

const STATUSES = ["ALL", "RECEIVED", "PROCESSING", "EXTRACTING", "PENDING_REVIEW", "STORED_ONLY", "DUPLICATE", "FAILED"];
const STYLE = {
  FAILED: "text-rose-700 bg-rose-50 border-rose-100",
  STORED_ONLY: "text-slate-600 bg-slate-100 border-slate-200",
  DUPLICATE: "text-slate-600 bg-slate-100 border-slate-200",
  PENDING_REVIEW: "text-emerald-700 bg-emerald-50 border-emerald-100",
};

export default function ReviewLinks({ refreshKey, onOpenPosting }) {
  const [status, setStatus] = useState("ALL");
  const [items, setItems] = useState(null);

  useEffect(() => {
    let alive = true;
    careersAdminApi.listSubmissions({ status, limit: 100 })
      .then((res) => alive && setItems(res.data))
      .catch((err) => toast.error(errorMessage(err, "Could not load student links.")));
    return () => {
      alive = false;
    };
  }, [status, refreshKey]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label htmlFor="links-status" className="text-xs font-semibold text-slate-600">Status</label>
        <select id="links-status" className={`${inputClass} w-48`} value={status} onChange={(e) => { setStatus(e.target.value); setItems(null); }}>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ").toLowerCase()}</option>)}
        </select>
      </div>
      {!items ? <Skeleton rows={4} /> : !items.length ? (
        <div className={`${cardClass} p-8 text-center text-sm text-slate-500`}>No student links{status !== "ALL" ? ` with status ${status.toLowerCase().replace("_", " ")}` : " yet"}.</div>
      ) : (
        <div className={`${cardClass} overflow-hidden`}>
          <ul className="divide-y divide-slate-100">
            {items.map((s) => (
              <li key={s.id} className="px-4 py-3 space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${STYLE[s.status] || "text-blue-700 bg-blue-50 border-blue-100"}`}>{s.status.replace("_", " ")}</span>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--color-secondary)] hover:underline truncate inline-flex items-center gap-1 min-w-0">
                    <span className="truncate">{s.url}</span> <ExternalLink size={12} className="shrink-0" />
                  </a>
                </div>
                <p className="text-xs text-slate-500">
                  By {s.submittedBy ?? `user #${s.submittedById}`} · {new Date(s.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  {s.postingId && <> · <button type="button" className="text-[var(--color-secondary)] hover:underline cursor-pointer" onClick={() => onOpenPosting(s.postingId)}>posting #{s.postingId}</button></>}
                </p>
                {s.note && <p className="text-xs text-slate-600">Note: {s.note}</p>}
                {s.error && <p className="text-xs text-rose-700">{s.error}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
