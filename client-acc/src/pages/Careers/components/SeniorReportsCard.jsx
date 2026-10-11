// Company page summary of seniors' reported numbers (P8-T1, F-29). The API sends a figure only when
// 3 or more published experiences report it, with ranges widened to ₹5k / 1 lakh steps. Labelled as
// reported by seniors; never shown as any posting's pay.
import { IndianRupee } from "lucide-react";
import { money, plural } from "../lib/format";

const years = (r) => (r.fromYear === r.toYear ? `${r.fromYear}` : `${r.fromYear} – ${r.toYear}`);
const seniors = (n) => plural(n, "senior");

export default function SeniorReportsCard({ reports }) {
  if (!reports || (!reports.stipend && !reports.ctc && !reports.rounds)) return null;
  const { stipend, ctc, rounds } = reports;
  return (
    <section aria-labelledby="reports-title" className="rounded-2xl border border-slate-200 bg-white/95 p-4 md:p-5 shadow-xs space-y-2">
      <h2 id="reports-title" className="flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">
        <IndianRupee size={16} className="text-[var(--color-secondary)]" aria-hidden="true" /> Reported by seniors
      </h2>
      <ul className="space-y-1 text-sm text-slate-700">
        {stipend && <li><b>Stipend:</b> {seniors(stipend.count)} reported {money(stipend.min)} – {money(stipend.max).replace("₹", "")} a month ({years(stipend)}).</li>}
        {ctc && <li><b>CTC:</b> {seniors(ctc.count)} reported {ctc.min === ctc.max ? `about ${ctc.min}` : `${ctc.min} – ${ctc.max}`} lakh a year ({years(ctc)}).</li>}
        {rounds && <li><b>Interview rounds:</b> usually {rounds.typical}{rounds.min !== rounds.max && ` (${rounds.min} – ${rounds.max})`}, from {seniors(rounds.count)} ({years(rounds)}).</li>}
      </ul>
      <p className="text-[11px] text-slate-500">What seniors shared in their experiences, as ranges. Not the pay of any opening listed here.</p>
    </section>
  );
}
