import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Link2, Search } from "lucide-react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../api/careersApi";
import { PageHeader, Skeleton, cardClass, inputClass, outlineButton, primaryButton } from "./components/ui";
import BackfillRow from "./BackfillRow";

const VIEWS = [
  { key: "unlinked", label: "Not linked" },
  { key: "linked", label: "Linked" },
];

// Link existing Career Vault experiences to companies, so they show on company pages. Suggestions
// come from the title; nothing is linked until an admin applies it, and Unlink reverts.
export default function ExperienceBackfill() {
  const [view, setView] = useState("unlinked");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [choices, setChoices] = useState({}); // experienceId -> { companyId, name, status }
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      careersAdminApi.listBackfill({ view, q: q.trim() || undefined, page })
        .then((res) => { if (alive) setResult(res); })
        .catch((err) => toast.error(errorMessage(err, "Could not load experiences.")));
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [view, q, page, reload]);

  const refresh = useCallback(() => {
    setSelected(new Set());
    setChoices({});
    setReload((n) => n + 1);
  }, []);

  const targetOf = (exp) => {
    const c = choices[exp.id];
    if (c) return c.status === "ACTIVE" ? c.companyId : null;
    return exp.suggestion?.company?.id ?? null;
  };

  const apply = async (items) => {
    setBusy(true);
    try {
      const res = await careersAdminApi.applyBackfill(items);
      toast.success(res.message);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not link."));
    } finally {
      setBusy(false);
    }
  };

  const unlink = async (exp) => {
    setBusy(true);
    try {
      await careersAdminApi.unlinkBackfill(exp.id);
      toast.success(`Unlinked “${exp.title}” from ${exp.company?.name}.`);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not unlink."));
    } finally {
      setBusy(false);
    }
  };

  const rows = result?.data ?? [];
  const linkable = rows.filter((e) => targetOf(e));
  const selectedItems = linkable.filter((e) => selected.has(e.id)).map((e) => ({ experienceId: e.id, companyId: targetOf(e) }));
  const toggle = (id, on) => setSelected((prev) => {
    const next = new Set(prev);
    if (on) next.add(id); else next.delete(id);
    return next;
  });
  const counts = result?.counts;
  const totalPages = result?.pagination?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader icon={Link2} title="Link experiences" subtitle="Connect Career Vault experiences to companies so they appear on company pages. Nothing is linked until you apply it.">
        <Link to="/admin/careers/companies" className={outlineButton}>Companies</Link>
      </PageHeader>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex gap-1.5 flex-wrap" role="tablist" aria-label="Link status">
          {VIEWS.map((v) => (
            <button key={v.key} type="button" role="tab" aria-selected={view === v.key}
              onClick={() => { setView(v.key); setPage(1); refresh(); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${view === v.key ? "bg-white text-slate-950 font-bold border border-slate-200 shadow-xs" : "text-slate-600 hover:bg-white/80"}`}>
              {v.label}{counts ? ` (${counts[v.key]})` : ""}
            </button>
          ))}
        </div>
        <div className="relative md:ml-auto md:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <label htmlFor="backfill-search" className="sr-only">Search titles</label>
          <input id="backfill-search" className={`${inputClass} pl-9`} placeholder="Search titles" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
      </div>

      {view === "unlinked" && rows.length > 0 && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 p-3 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <button type="button" className={outlineButton} disabled={!linkable.length}
            onClick={() => setSelected(new Set(linkable.map((e) => e.id)))}>
            Select all with a company ({linkable.length})
          </button>
          {selected.size > 0 && <button type="button" className={outlineButton} onClick={() => setSelected(new Set())}>Clear</button>}
          <button type="button" className={`${primaryButton} sm:ml-auto`} disabled={busy || !selectedItems.length} onClick={() => apply(selectedItems)}>
            Link {selectedItems.length} selected
          </button>
        </div>
      )}

      {!result ? <Skeleton rows={6} /> : rows.length === 0 ? (
        <p className={`${cardClass} p-8 text-center text-sm text-slate-500`}>
          {q ? "No experiences match this search." : view === "unlinked" ? "Every experience is linked to a company." : "No experience is linked yet."}
        </p>
      ) : (
        <ul className={`${cardClass} divide-y divide-slate-100`}>
          {rows.map((exp) => (
            <BackfillRow
              key={exp.id}
              exp={exp}
              view={view}
              busy={busy}
              selected={selected.has(exp.id)}
              onSelect={(on) => toggle(exp.id, on)}
              choice={choices[exp.id]}
              onChoose={(c) => setChoices((prev) => ({ ...prev, [exp.id]: c }))}
              onLink={(companyId) => apply([{ experienceId: exp.id, companyId }])}
              onUnlink={() => unlink(exp)}
            />
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <button type="button" className={outlineButton} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button type="button" className={outlineButton} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
