import { GraduationCap } from "lucide-react";
import { eligibilityText } from "../lib/format";

const TONES = {
  eligible: "text-emerald-700 bg-emerald-50 border-emerald-100",
  notEligible: "text-rose-700 bg-rose-50 border-rose-100",
  needsCpi: "text-amber-700 bg-amber-50 border-amber-100",
  unknown: "text-slate-500 bg-slate-50 border-slate-200 italic",
};

// eligibility = { status, reasons, minCpi } from the API (postings/eligibility.js on the server).
export default function EligibilityBadge({ eligibility }) {
  const { tone, text } = eligibilityText(eligibility);
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[11px] font-semibold ${TONES[tone]}`}>
      <GraduationCap size={13} className="shrink-0" aria-hidden="true" />
      {text}
    </span>
  );
}
