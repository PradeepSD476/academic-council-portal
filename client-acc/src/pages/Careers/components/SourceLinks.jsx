import { ExternalLink, Link2 } from "lucide-react";
import { daysAgo, safeHref } from "../lib/format";

const KIND_LABELS = {
  GREENHOUSE: "Company job board",
  LEVER: "Company job board",
  ASHBY: "Company job board",
  MANUAL: "Added by ACC",
  STUDENT_LINK: "Shared by a student",
};

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

// Every place this posting was seen, with when. Links open in a new tab and never send a referrer.
export default function SourceLinks({ observations }) {
  return (
    <section aria-labelledby="sources-title" className="p-5 rounded-2xl border border-slate-200 bg-white/95 shadow-xs">
      <h2 id="sources-title" className="flex items-center gap-2 text-sm font-bold text-[var(--color-primary)] mb-3">
        <Link2 size={16} className="text-[var(--color-secondary)]" aria-hidden="true" /> Where this was found
      </h2>
      <ul className="space-y-3">
        {observations.map((o) => (
          <li key={`${o.url}-${o.firstSeenAt}`} className="text-xs">
            {safeHref(o.url) ? (
              <a
                href={safeHref(o.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-[var(--color-secondary)] hover:underline break-all"
              >
                {hostOf(o.url)} <ExternalLink size={12} className="shrink-0" aria-hidden="true" />
              </a>
            ) : (
              <span className="font-semibold text-slate-600 break-all">{o.url}</span>
            )}
            <p className="text-slate-500 mt-0.5">
              {KIND_LABELS[o.sourceKind] ?? o.sourceName} · first seen {daysAgo(o.firstSeenAt)}
              {o.isLive ? ` · last seen ${daysAgo(o.lastSeenAt)}` : " · no longer listed there"}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
