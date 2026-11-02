// Company page summary of seniors' reported numbers (P8-T1, F-29). The API sends a figure only from 3
// published reports: a rounded typical value, plus the middle half (never min / max) from 5 reports.
// Labelled as reported by seniors; never shown as any posting's pay.
import { IndianRupee } from "lucide-react";
import { money, plural } from "../lib/format";

const years = (r) => (r.fromYear === r.toYear ? `${r.fromYear}` : `${r.fromYear} – ${r.toYear}`);
const seniors = (n) => plural(n, "senior");
// The middle half of the reports (sent only from 5 reports), when it is a real range.
const middle = (r, fmt) => (r.low != null && r.high != null && r.low !== r.high ? `; middle half ${fmt(r.low)} – ${fmt(r.high)}` : "");

export default function SeniorReportsCard({ reports }) {
  if (!reports || (!reports.stipend && !reports.ctc && !reports.rounds)) return null;
  const { stipend, ctc, rounds } = reports;
  return (
    <section aria-labelledby="reports-title" className="rounded-2xl border border-slate-200 bg-white/95 p-4 md:p-5 shadow-xs space-y-2">
      <h2 id="reports-title" className="flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">
        <IndianRupee size={16} className="text-[var(--color-secondary)]" aria-hidden="true" /> Reported by seniors
      </h2>
      <ul className="space-y-1 text-sm text-slate-700">
        {stipend && <li><b>Stipend:</b> typically about {money(stipend.typical)} a month{middle(stipend, (v) => money(v))}, from {seniors(stipend.count)} ({years(stipend)}).</li>}
        {ctc && <li><b>CTC:</b> typically about {ctc.typical} lakh a year{middle(ctc, (v) => `${v} lakh`)}, from {seniors(ctc.count)} ({years(ctc)}).</li>}
        {rounds && <li><b>Interview rounds:</b> usually {rounds.typical}{middle(rounds, String)}, from {seniors(rounds.count)} ({years(rounds)}).</li>}
      </ul>
      <p className="text-[11px] text-slate-500">Rounded from what seniors shared in their experiences. Not the pay of any opening listed here.</p>
    </section>
  );
}
