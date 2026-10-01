// Search-and-pick a company from the registry. With allowNew, a typed name that matches nothing can
// be used as is (the server resolves it, creating a CANDIDATE company if it is really new).
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { careersAdminApi, errorMessage } from "../../../../api/careersApi";
import { StatusChip, inputClass } from "./ui";

export default function CompanyPicker({ id, value, onChange, allowNew = false }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const res = await careersAdminApi.listCompanies({ status: "ALL", q: q.trim() || undefined, limit: 8 });
        if (alive) setResults(res.data.filter((c) => c.status !== "MERGED"));
      } catch (err) {
        if (alive) toast.error(errorMessage(err, "Could not search companies."));
      }
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q, open]);

  const pick = (company) => {
    onChange({ companyId: company.id, name: company.name, status: company.status });
    setQ("");
    setOpen(false);
  };

  return (
    <div className="relative">
      {value && !open ? (
        <div className="flex items-center gap-2">
          <span className="flex-1 min-w-0 truncate text-sm font-semibold text-slate-800">{value.name}</span>
          {value.status ? <StatusChip status={value.status} /> : <span className="text-[10px] font-bold uppercase text-blue-700">New name</span>}
          <button type="button" className="text-xs font-semibold text-[var(--color-secondary)] hover:underline cursor-pointer" onClick={() => setOpen(true)}>Change</button>
        </div>
      ) : (
        <>
          <input id={id} className={inputClass} placeholder="Search company name or alias" value={q} autoComplete="off"
            onFocus={() => setOpen(true)} onChange={(e) => { setQ(e.target.value); setOpen(true); }} />
          {open && (
            <ul className="absolute z-10 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
              {results.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => pick(c)} className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 cursor-pointer">
                    <span className="flex-1 truncate">{c.name}</span>
                    <StatusChip status={c.status} />
                  </button>
                </li>
              ))}
              {allowNew && q.trim() && !results.some((c) => c.name.toLowerCase() === q.trim().toLowerCase()) && (
                <li>
                  <button type="button" onClick={() => { onChange({ companyId: null, name: q.trim(), status: null }); setOpen(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-blue-700 hover:bg-blue-50 cursor-pointer">
                    Use “{q.trim()}” (matched or created as a candidate on save)
                  </button>
                </li>
              )}
              {!results.length && !allowNew && <li className="px-3 py-2 text-sm text-slate-500">No companies match.</li>}
              <li>
                <button type="button" onClick={() => setOpen(false)} className="w-full px-3 py-1.5 text-left text-xs text-slate-500 hover:bg-slate-50 cursor-pointer">Close</button>
              </li>
            </ul>
          )}
        </>
      )}
    </div>
  );
}
