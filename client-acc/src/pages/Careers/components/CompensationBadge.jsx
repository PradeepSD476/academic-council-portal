import { Wallet } from "lucide-react";
import { compensation } from "../lib/format";

const TONES = {
  value: "text-slate-700 font-semibold",
  undisclosed: "text-slate-500 italic",
  unclear: "text-slate-500",
};

// Pay as stated by the source. Unknown pay is "Undisclosed", never ₹0.
export default function CompensationBadge({ posting }) {
  const { tone, text } = compensation(posting);
  return (
    <span className={`inline-flex items-center gap-1 ${TONES[tone]}`}>
      <Wallet size={14} className="text-slate-400 shrink-0" aria-hidden="true" />
      {text}
    </span>
  );
}
