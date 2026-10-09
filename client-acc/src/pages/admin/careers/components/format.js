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
