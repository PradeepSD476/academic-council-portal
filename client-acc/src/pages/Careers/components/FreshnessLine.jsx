import { Clock } from "lucide-react";
import { freshness } from "../lib/format";

const DOTS = { fresh: "bg-emerald-500", ok: "bg-slate-300", stale: "bg-amber-500" };

// Only observed facts: when the posting was first seen and last confirmed live. No countdowns.
export default function FreshnessLine({ posting }) {
  const { text, tone } = freshness(posting);
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
      <Clock size={13} className="shrink-0" aria-hidden="true" />
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOTS[tone]}`} aria-hidden="true" />
      {text}
    </span>
  );
}
