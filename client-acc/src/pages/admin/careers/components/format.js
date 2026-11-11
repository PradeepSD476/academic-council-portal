// "1 alias", "2 aliases"
export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// What a finished "Fetch now" found (B-17); summary = { runs, newPostings, failed } from the server.
export function fetchFinishedMessage(summary) {
  if (!summary || summary.runs === 0) return "Fetch finished.";
  const found = summary.newPostings > 0
    ? `${plural(summary.newPostings, "new posting")} in Jobs Review`
    : "no new postings";
  const failed = summary.failed > 0 ? ` ${plural(summary.failed, "board")} failed; see below.` : "";
  return `Fetch finished: ${found}.${failed}`;
}

// Per-source quality over the last 30 days (P6-T1, F-23); q = { kept, approved, rejected, pending } or null.
export function qualityText(q) {
  if (!q || !q.kept) return "no new postings";
  return `${plural(q.kept, "posting")} kept · ${q.approved} approved · ${q.rejected} rejected · ${q.pending} waiting for review`;
}

// Share of reviewed postings that were rejected, or null while nothing was reviewed.
export function rejectedShare(q) {
  const reviewed = q ? q.approved + q.rejected : 0;
  return reviewed ? Math.round((q.rejected / reviewed) * 100) : null;
}
