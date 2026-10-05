import { useMemo } from "react";
import { structureDescription } from "../lib/description";

// The source's description, laid out as headings, bullet lists and paragraphs. Plain text only.
export default function JobDescription({ text }) {
  const blocks = useMemo(() => structureDescription(text), [text]);
  if (!blocks.length) return <p className="text-sm italic text-slate-500">No description was provided.</p>;
  return (
    <div className="text-sm text-slate-600 leading-relaxed break-words space-y-3">
      {blocks.map((b, i) => {
        if (b.type === "heading") {
          return (
            <h3 key={i} className="flex items-center gap-2 pt-3 first:pt-0 text-sm font-bold text-[var(--color-primary)]">
              <span className="w-[3px] h-4 shrink-0 rounded-full bg-[var(--color-secondary)]" aria-hidden="true" />
              {b.text}
            </h3>
          );
        }
        if (b.type === "list") {
          return (
            <ul key={i} className="space-y-1.5">
              {b.items.map((item, j) => (
                <li key={j} className="flex gap-2.5">
                  {item.n === null
                    ? <span className="mt-[9px] w-1.5 h-1.5 shrink-0 rounded-full bg-teal-500/70" aria-hidden="true" />
                    : <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-teal-50 border border-teal-100 text-[11px] font-bold text-teal-700 flex items-center justify-center">{item.n}</span>}
                  <span className="min-w-0">{item.text}</span>
                </li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{b.lines.map((line, j) => (j ? [<br key={`b${j}`} />, line] : line))}</p>;
      })}
    </div>
  );
}
