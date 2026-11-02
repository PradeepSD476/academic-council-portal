import { useState } from "react";
import CompanyPicker from "./components/CompanyPicker";
import { outlineButton, dangerButton } from "./components/ui";

const METHOD_LABELS = { alias: "Name in title", exact: "exact", normalized: "normalised", fuzzy: "close spelling" };

// "pattern:at:fuzzy" -> "after “at” · close spelling 0.93"
function methodText(s) {
  if (s.method === "alias") return `${METHOD_LABELS.alias}${s.score < 1 ? " (short name)" : ""}`;
  const [, kind, how] = s.method.split(":");
  const where = kind === "at" || kind === "@" ? `after “${kind}”` : `before “${kind}”`;
  return `${where} · ${METHOD_LABELS[how] ?? how}${how === "fuzzy" ? ` ${s.score.toFixed(2)}` : ""}`;
}

const pubChip = (status) => (
  <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${status === "PUBLISHED" ? "text-emerald-700 bg-emerald-50 border-emerald-100" : "text-slate-500 bg-slate-50 border-slate-200"}`}>
    {status === "PUBLISHED" ? "Published" : "Draft"}
  </span>
);

// One experience. Unlinked: a suggestion (or the admin's own pick) and Link. Linked: its company,
// Change (re-link) and Unlink.
export default function BackfillRow({ exp, view, selected, onSelect, choice, onChoose, onLink, onUnlink, busy }) {
  const [picking, setPicking] = useState(false);
  const target = choice ?? (exp.suggestion?.company ? { companyId: exp.suggestion.company.id, name: exp.suggestion.company.name, status: "ACTIVE" } : null);
  const notActive = target && target.status !== "ACTIVE";
  return (
    <li className="p-4 grid gap-3 md:grid-cols-[auto_minmax(0,1.3fr)_minmax(0,1fr)_auto] md:items-center">
      {view === "unlinked" ? (
        <input
          type="checkbox"
          aria-label={`Select “${exp.title}”`}
          checked={selected}
          disabled={!target || notActive}
          onChange={(e) => onSelect(e.target.checked)}
          className="w-4 h-4 accent-[var(--color-secondary)] cursor-pointer disabled:cursor-not-allowed"
        />
      ) : <span className="hidden md:block w-4" />}

      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--color-primary)] break-words">{exp.title}</p>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {pubChip(exp.status)} {exp.authorName} · {new Date(exp.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="min-w-0 text-xs">
        {view === "linked" && !choice ? (
          <p className="font-semibold text-slate-700">Linked to <span className="text-teal-700">{exp.company?.name}</span></p>
        ) : exp.suggestion && !choice ? (
          <p className="text-slate-600">
            <span className="font-semibold text-[var(--color-primary)]">{exp.suggestion.company?.name}</span>
            <span className="block text-slate-500">{methodText(exp.suggestion)}</span>
          </p>
        ) : !choice && <p className="italic text-slate-500">No suggestion</p>}
        {picking || choice ? (
          <div className="mt-1.5">
            <CompanyPicker id={`pick-${exp.id}`} value={choice} onChange={onChoose} />
          </div>
        ) : (
          <button type="button" onClick={() => setPicking(true)} className="mt-1 font-semibold text-[var(--color-secondary)] hover:underline cursor-pointer">
            {view === "linked" ? "Link to another company" : exp.suggestion ? "Choose another company" : "Choose a company"}
          </button>
        )}
        {notActive && <p className="mt-1 text-amber-700">Only active companies can be linked. Approve or merge this candidate first.</p>}
      </div>

      <div className="flex gap-2 md:justify-end">
        {(view === "unlinked" || choice) && (
          <button type="button" className={outlineButton} disabled={busy || !target || notActive} onClick={() => onLink(target.companyId)}>
            {view === "linked" ? "Re-link" : "Link"}
          </button>
        )}
        {view === "linked" && <button type="button" className={dangerButton} disabled={busy} onClick={onUnlink}>Unlink</button>}
      </div>
    </li>
  );
}
