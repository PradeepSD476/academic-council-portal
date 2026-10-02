import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { careersApi, errorMessage } from "../../../api/careersApi";
import { Modal, inputClass, primaryButton, outlineButton } from "../../admin/careers/components/ui";
import MySubmissions from "./MySubmissions";

const NOTE_MAX = 500;

// Share a job link with ACC. The server queues it; the worker reads the page later, and an admin
// reviews it before it appears. The student's earlier links and their statuses are listed below.
export default function SubmitLinkModal({ onClose }) {
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [mine, setMine] = useState(null);

  const loadMine = useCallback(() => {
    careersApi.mySubmissions().then(setMine).catch(() => setMine([]));
  }, []);
  useEffect(() => { loadMine(); }, [loadMine]);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await careersApi.submitLink({ url: url.trim(), ...(note.trim() ? { note: note.trim() } : {}) });
      toast.success(res.message);
      setUrl("");
      setNote("");
      loadMine();
    } catch (err) {
      toast.error(errorMessage(err, "Could not share the link."));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      title="Share a job link"
      onClose={onClose}
      footer={<button type="button" onClick={onClose} className={outlineButton}>Close</button>}
    >
      <form onSubmit={submit} className="space-y-3">
        <p className="text-xs text-slate-500">
          Found an internship or job for IIT Patna students? Paste the link to the job page. ACC reviews every link before it appears.
        </p>
        <div>
          <label htmlFor="share-url" className="block text-xs font-semibold text-slate-600 mb-1.5">Job page link</label>
          <input
            id="share-url"
            type="url"
            required
            maxLength={2048}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://company.com/careers/software-intern"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="share-note" className="block text-xs font-semibold text-slate-600 mb-1.5">Note for ACC (optional)</label>
          <textarea
            id="share-note"
            rows={2}
            maxLength={NOTE_MAX}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Open to 3rd years, deadline mentioned in the PDF"
            className={inputClass}
          />
          <p className="mt-1 text-[11px] text-slate-500 text-right">{note.length}/{NOTE_MAX}</p>
        </div>
        <button type="submit" disabled={sending || !url.trim()} className={primaryButton}>
          {sending ? "Sharing…" : "Share link"}
        </button>
      </form>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Your shared links</h3>
          <button type="button" onClick={loadMine} aria-label="Refresh statuses" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer">
            <RefreshCw size={14} />
          </button>
        </div>
        {mine === null ? <div className="h-16 rounded-xl bg-slate-100 animate-pulse" aria-hidden="true" /> : <MySubmissions items={mine} />}
      </div>
    </Modal>
  );
}
