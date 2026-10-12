// Add many ATS boards at once (P6-T1, F-23): one `kind token company` per line. Each board is read
// once before it is saved, like Add board; the result lists what was added, skipped or failed.
// scripts/careers/scanBoards.js prints lines in this format.
import { useState } from "react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../api/careersApi";
import { Modal, inputClass, outlineButton, primaryButton } from "./components/ui";

const RESULT_STYLE = {
  added: "text-emerald-800 bg-emerald-50 border-emerald-100",
  skipped: "text-slate-700 bg-slate-50 border-slate-200",
  failed: "text-rose-800 bg-rose-50 border-rose-100",
};
const RESULT_LABEL = { added: "Added", skipped: "Already there", failed: "Failed" };

function ResultList({ data }) {
  const rows = [
    ...data.results.map((r) => ({ ...r, label: `${r.kind.toLowerCase()} / ${r.boardToken} · ${r.companyName}` })),
    ...data.lineErrors.map((e) => ({ lineNo: e.lineNo, result: "failed", label: e.line, message: e.reason })),
  ].sort((a, b) => a.lineNo - b.lineNo);
  return (
    <ul className="space-y-1.5" aria-label="Results">
      {rows.map((r) => (
        <li key={r.lineNo} className={`rounded-lg border px-3 py-2 text-xs ${RESULT_STYLE[r.result]}`}>
          <span className="font-bold">Line {r.lineNo} · {RESULT_LABEL[r.result]}</span>
          <span className="block break-words">{r.label}</span>
          <span className="block break-words opacity-90">{r.message}</span>
        </li>
      ))}
    </ul>
  );
}

export default function BulkAddSourcesDialog({ onClose, onDone }) {
  const [lines, setLines] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await careersAdminApi.bulkCreateSources(lines);
      setDone(res.data);
      // B-45: a green tick only when something was added; nothing added + failures = error style.
      const { added, failed } = res.data.summary;
      if (added) toast.success(res.message, { duration: 6000 });
      else if (failed) toast.error(res.message, { duration: 8000 });
      else toast(res.message, { duration: 6000 });
      if (added) onDone();
    } catch (err) {
      toast.error(errorMessage(err), { duration: 8000 });
    } finally {
      setSaving(false);
    }
  };

  const close = () => (saving ? null : onClose());
  return (
    <Modal title="Add boards in bulk" onClose={close} wide
      footer={done ? (
        <>
          <button type="button" className={outlineButton} onClick={() => setDone(null)}>Add more</button>
          <button type="button" className={primaryButton} onClick={onClose}>Done</button>
        </>
      ) : (
        <>
          <button type="button" className={outlineButton} onClick={close} disabled={saving}>Cancel</button>
          <button type="submit" form="bulk-sources" className={primaryButton} disabled={saving || !lines.trim()}>{saving ? "Checking the boards…" : "Check and add"}</button>
        </>
      )}>
      {done ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-700">
            <span className="font-semibold">{done.summary.added} added</span> · {done.summary.skipped} already there · {done.summary.failed} failed.
            {done.runRequest && " The new boards are queued for fetching."}
          </p>
          <ResultList data={done} />
        </div>
      ) : (
        <form id="bulk-sources" onSubmit={submit} className="space-y-2">
          <label htmlFor="bulk-lines" className="text-xs font-semibold text-slate-600">One board per line: ATS, board token, company name</label>
          <textarea id="bulk-lines" rows={10} className={`${inputClass} font-mono text-xs`} value={lines} onChange={(e) => setLines(e.target.value)}
            placeholder={"greenhouse stripe Stripe\nlever palantir Palantir\nashby perplexity Perplexity"} required />
          <p className="text-[11px] text-slate-500">
            Up to 30 boards at a time; lines starting with # are ignored. Every board is read once before it is saved.
            A company name that matches no company exactly is added as a new candidate company for you to confirm under Jobs review → Candidates.
          </p>
        </form>
      )}
    </Modal>
  );
}
