// "Job alerts" on the jobs page (P7-T1, F-19): save the current search as an emailed alert, and
// manage the student's alerts (pause, frequency, delete). At most 3; opt-in only.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { BellOff, BellRing, Trash2 } from "lucide-react";
import { careersApi, errorMessage } from "../../../api/careersApi";
import { Modal, inputClass, outlineButton, primaryButton } from "../../admin/careers/components/ui";
import { alertSearch, alertSummary, defaultAlertName } from "../lib/alerts";
import { formatDate } from "../lib/format";

const FREQUENCIES = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "DAILY", label: "Daily" },
];

function AlertRow({ alert, onChanged, onClose }) {
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const paused = Boolean(alert.unsubscribedAt);

  const run = async (fn, done) => {
    setBusy(true);
    try {
      await fn();
      if (done) toast.success(done);
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  let state = "No email sent yet.";
  if (paused) state = "Paused: no emails.";
  else if (alert.emailFailed) state = "The last email could not be sent; ACC has been told.";
  else if (alert.lastSentAt) state = `Last email ${formatDate(alert.lastSentAt)} (${alert.lastSentCount} opening${alert.lastSentCount === 1 ? "" : "s"}).`;

  return (
    <li className="rounded-xl border border-slate-200 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-primary)] break-words">{alert.name}</p>
          {alert.summary !== alert.name && <p className="text-xs text-slate-500 break-words">{alert.summary}</p>}
          <p className={`text-[11px] mt-0.5 ${alert.emailFailed && !paused ? "text-amber-700" : "text-slate-500"}`}>{state}</p>
        </div>
        <label className="sr-only" htmlFor={`alert-freq-${alert.id}`}>How often</label>
        <select id={`alert-freq-${alert.id}`} value={alert.frequency} disabled={busy}
          onChange={(e) => run(() => careersApi.updateAlert(alert.id, { frequency: e.target.value }))}
          className="shrink-0 border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white text-slate-700 cursor-pointer">
          {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>
      {confirmDelete ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-600">Delete this alert?</span>
          <button type="button" className={outlineButton} disabled={busy} onClick={() => setConfirmDelete(false)}>Keep</button>
          <button type="button" className={`${outlineButton} text-rose-700`} disabled={busy} onClick={() => run(() => careersApi.deleteAlert(alert.id), "Alert deleted.")}>Delete</button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Link to={`/dashboard/career-vault/jobs?${alertSearch(alert.filters)}`} onClick={onClose} className={outlineButton}>Open this search</Link>
          <button type="button" className={outlineButton} disabled={busy}
            onClick={() => run(() => careersApi.updateAlert(alert.id, { paused: !paused }), paused ? "Emails turned back on." : "Alert paused.")}>
            {paused ? <><BellRing size={14} aria-hidden="true" /> Resume</> : <><BellOff size={14} aria-hidden="true" /> Pause</>}
          </button>
          <button type="button" className={outlineButton} disabled={busy} onClick={() => setConfirmDelete(true)} aria-label={`Delete ${alert.name}`}>
            <Trash2 size={14} aria-hidden="true" /> Delete
          </button>
        </div>
      )}
    </li>
  );
}

export default function JobAlertsDialog({ filters, onClose }) {
  const [list, setList] = useState(null); // { data, meta }
  const [name, setName] = useState(() => defaultAlertName(filters));
  const [frequency, setFrequency] = useState("WEEKLY");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setList(await careersApi.listAlerts());
    } catch (err) {
      toast.error(errorMessage(err, "Could not load your alerts."));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const alerts = list?.data ?? [];
  const max = list?.meta?.max ?? 3;
  const full = alerts.length >= max;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await careersApi.createAlert({ name: name.trim(), frequency, filters });
      toast.success(res.message, { duration: 6000 });
      load();
    } catch (err) {
      toast.error(errorMessage(err, "Could not save the alert."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Job alerts" onClose={saving ? () => {} : onClose}>
      <div className="space-y-5">
        {list && !list.meta.emailsOn && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            ACC has not switched on alert emails yet. Alerts you save now start when it does.
          </p>
        )}

        <form onSubmit={save} className="space-y-3">
          <div>
            <h3 className="text-sm font-bold text-[var(--color-primary)]">Email me new openings for this search</h3>
            <p className="text-xs text-slate-500 mt-0.5">{alertSummary(filters)}</p>
          </div>
          <div>
            <label htmlFor="alert-name" className="text-xs font-semibold text-slate-600">Name</label>
            <input id="alert-name" className={`${inputClass} mt-1`} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} required disabled={full} />
          </div>
          <fieldset className="flex flex-wrap items-center gap-4" disabled={full}>
            <legend className="text-xs font-semibold text-slate-600 mb-1">How often</legend>
            {FREQUENCIES.map((f) => (
              <label key={f.value} className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
                <input type="radio" name="alert-frequency" value={f.value} checked={frequency === f.value} onChange={() => setFrequency(f.value)} className="accent-[var(--color-secondary)]" />
                {f.label}
              </label>
            ))}
          </fieldset>
          <p className="text-[11px] text-slate-500">
            Sent to your portal email only when there are new approved openings. Every email has a link to stop it.
          </p>
          {full ? (
            <p className="text-xs text-slate-600">You have {max} alerts, the most you can keep. Delete one to add this search.</p>
          ) : (
            <button type="submit" className={primaryButton} disabled={saving || !name.trim() || !list}>{saving ? "Saving…" : "Save alert"}</button>
          )}
        </form>

        <div className="space-y-2">
          <h3 className="text-sm font-bold text-[var(--color-primary)]">Your alerts ({alerts.length}/{max})</h3>
          {!list ? (
            <p className="text-xs text-slate-500">Loading…</p>
          ) : alerts.length === 0 ? (
            <p className="text-xs text-slate-500">No alerts yet.</p>
          ) : (
            <ul className="space-y-2">
              {alerts.map((a) => <AlertRow key={a.id} alert={a} onChanged={load} onClose={onClose} />)}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
