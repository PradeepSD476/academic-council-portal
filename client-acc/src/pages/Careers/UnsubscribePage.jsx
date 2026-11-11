// The "Stop these emails" link in a job-alert digest (P7-T1). No login: opening the link pauses the
// alert at once (one click); "Turn it back on" undoes it.
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BellOff, BellRing } from "lucide-react";
import { careersApi, errorMessage } from "../../api/careersApi";

export default function UnsubscribePage() {
  const [search] = useSearchParams();
  const token = search.get("token") ?? "";
  const [state, setState] = useState({ phase: token ? "working" : "error", message: token ? null : "This link is incomplete." });
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true; // StrictMode runs effects twice in dev; one request is enough
    careersApi.unsubscribeAlert(token)
      .then((d) => setState({ phase: "off", name: d.name }))
      .catch((err) => setState({ phase: "error", message: errorMessage(err, "Could not stop the emails. Try the link again.") }));
  }, [token]);

  const resubscribe = async () => {
    setState((s) => ({ ...s, phase: "working" }));
    try {
      const d = await careersApi.resubscribeAlert(token);
      setState({ phase: "on", name: d.name });
    } catch (err) {
      setState({ phase: "error", message: errorMessage(err, "Could not turn the emails back on.") });
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-24">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center space-y-3">
        {state.phase === "working" && <p className="text-sm text-slate-600" aria-live="polite">One moment…</p>}
        {state.phase === "off" && (
          <>
            <BellOff className="mx-auto text-[var(--color-secondary)]" size={28} aria-hidden="true" />
            <h1 className="text-lg font-bold text-[var(--color-primary)]">Emails stopped</h1>
            <p className="text-sm text-slate-600">You will not get job-alert emails for “{state.name}” any more.</p>
            <button type="button" onClick={resubscribe} className="text-sm font-semibold text-[var(--color-secondary)] hover:underline cursor-pointer">Turn it back on</button>
          </>
        )}
        {state.phase === "on" && (
          <>
            <BellRing className="mx-auto text-[var(--color-secondary)]" size={28} aria-hidden="true" />
            <h1 className="text-lg font-bold text-[var(--color-primary)]">Emails back on</h1>
            <p className="text-sm text-slate-600">“{state.name}” will email you again when there are new openings.</p>
          </>
        )}
        {state.phase === "error" && (
          <>
            <h1 className="text-lg font-bold text-[var(--color-primary)]">Something went wrong</h1>
            <p className="text-sm text-slate-600">{state.message}</p>
          </>
        )}
        <p className="text-xs text-slate-500 pt-2">
          Manage all your alerts from <Link to="/dashboard/career-vault/jobs" className="font-semibold text-[var(--color-secondary)] hover:underline">Jobs & Internships</Link> → Job alerts.
        </p>
      </div>
    </div>
  );
}
