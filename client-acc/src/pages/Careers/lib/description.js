// Turns a posting's plain-text description into blocks the page can lay out: headings, bullet lists
// and paragraphs. The text is only re-arranged, never changed or shortened (a test script checks
// that on the real postings), and it is rendered as React text, never as HTML.

const BULLET = /^\s*(?:[•●▪‣◦·■□○▶►➤✓✔*]|[-–—](?=\s))\s*/;
const LONE_MARKER = /^\s*(?:[•●▪‣◦·■□○▶►➤✓✔*]|[-–—])\s*$/; // a bullet mark alone on its line: the text is on the next line
const INLINE_BULLET = /\s+[•●▪‣◦■]\s+/;
const NUMBERED = /^\s*(\d{1,2})[.)]\s+(?=\S)/;
const SHORT = 60; // longest line that can be a heading

const clean = (s) => s.replace(/\s+/g, " ").trim();

// "Mode: Work from Office" / "Duration: 3 Months": a short label, a colon and a value (B-24). Two or
// more of these together (blank lines between allowed) become a facts block with bold labels.
const FIELD = /^([^:]{2,40}):\s+(\S.{0,159})$/;
function field(text) {
  const m = text.match(FIELD);
  if (!m) return null;
  const label = m[1].trim();
  if (!/^\p{L}/u.test(label) || /[.!?]/.test(label) || label.split(/\s+/).length > 6 || m[2].startsWith("//")) return null;
  return { label, value: m[2].trim() };
}

// A short line with no sentence ending, e.g. "Who we are" or "What we are looking for:". A line of
// " | "-separated items ("Linkedin | X | Instagram") is a list of links, not a heading (B-16).
const isHeadingShaped = (line) => line.length <= SHORT && line.split(" ").length <= 9 && !/[.!?,;]$/.test(line) && !/\s\|\s/.test(line);

// Splits one raw line into [{ bullet: boolean, text, n? }] (n = the number of a numbered item),
// handling "• a • b" on one line.
function pieces(raw) {
  const numbered = raw.match(NUMBERED);
  if (numbered) return [{ bullet: true, n: Number(numbered[1]), text: clean(raw.replace(NUMBERED, "")) }];
  const startsWithBullet = BULLET.test(raw);
  const body = startsWithBullet ? raw.replace(BULLET, "") : raw;
  const parts = body.split(INLINE_BULLET).map(clean).filter(Boolean);
  if (!parts.length) return [];
  if (startsWithBullet) return parts.map((text) => ({ bullet: true, text }));
  // "Intro text • first • second": the text before the first bullet stays a normal line.
  return INLINE_BULLET.test(body)
    ? parts.map((text, i) => ({ bullet: i > 0, text }))
    : [{ bullet: false, text: parts[0] }];
}

export function structureDescription(text) {
  const lines = [];
  let pendingBullet = false; // the previous line was just a bullet mark
  for (const raw of String(text ?? "").replace(/\r\n?/g, "\n").split("\n")) {
    if (!raw.trim()) { lines.push({ blank: true }); pendingBullet = false; continue; }
    if (LONE_MARKER.test(raw)) { pendingBullet = true; continue; }
    const parts = pieces(raw);
    if (pendingBullet && parts.length) parts[0] = { ...parts[0], bullet: true };
    pendingBullet = false;
    for (const p of parts) lines.push(p);
  }

  // Facts: runs of two or more "Label: value" lines, only blank lines between them.
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].blank || lines[i].bullet || !field(lines[i].text)) continue;
    const run = [i];
    let j = i + 1;
    while (j < lines.length) {
      if (lines[j].blank) { j += 1; continue; }
      if (lines[j].bullet || !field(lines[j].text)) break;
      run.push(j); j += 1;
    }
    if (run.length >= 2) for (const k of run) lines[k] = { ...lines[k], fact: field(lines[k].text) };
    i = run[run.length - 1];
  }

  // Short plain lines: a run of one or two (or any line ending in ":") is a heading; a longer run
  // is probably a list of items (locations, names), so it stays as lines.
  const plain = (l) => l && !l.blank && !l.bullet && !l.fact;
  const heading = new Set();
  for (let i = 0; i < lines.length; i += 1) {
    const l = lines[i];
    if (!plain(l) || heading.has(i)) continue;
    const colon = /:$/.test(l.text) && l.text.length <= 100;
    if (colon) { heading.add(i); continue; }
    if (!isHeadingShaped(l.text)) continue;
    let end = i;
    while (plain(lines[end + 1]) && isHeadingShaped(lines[end + 1].text) && !/:$/.test(lines[end + 1].text)) end += 1;
    const next = lines[end + 1];
    const runLength = end - i + 1;
    if (runLength <= 2 && next && !next.blank) for (let k = i; k <= end; k += 1) heading.add(k);
    // A longer run that a list follows directly ("… Full-Time / Requirements / - item"): its last
    // line is the list's heading; the lines before it stay as lines (B-23).
    else if (next?.bullet) heading.add(end);
    i = end;
  }

  const blocks = [];
  let paragraph = null;
  let list = null;
  let facts = null; // stays open across blank lines, closed by any other line
  const flush = () => { paragraph = null; list = null; };
  lines.forEach((l, i) => {
    if (l.blank) { flush(); return; }
    if (l.fact) {
      flush();
      if (!facts) { facts = { type: "facts", items: [] }; blocks.push(facts); }
      facts.items.push(l.fact);
      return;
    }
    facts = null;
    if (l.bullet) {
      paragraph = null;
      if (!list) { list = { type: "list", items: [] }; blocks.push(list); }
      list.items.push({ text: l.text, n: l.n ?? null });
    } else if (heading.has(i)) {
      flush();
      blocks.push({ type: "heading", text: l.text.replace(/:$/, "") });
    } else {
      list = null;
      if (!paragraph) { paragraph = { type: "paragraph", lines: [] }; blocks.push(paragraph); }
      paragraph.lines.push(l.text);
    }
  });

  // A heading needs something under it. Headings in a row ("Who we are", "About Stripe") are one
  // title with a subtitle, so they are merged into a single heading block (text + subs). A heading
  // with nothing after it (e.g. a trailing "Office Location:") is shown as a plain line.
  const merged = [];
  for (const b of blocks) {
    const prev = merged[merged.length - 1];
    if (b.type === "heading" && prev?.type === "heading") prev.subs.push(b.text);
    else merged.push(b.type === "heading" ? { ...b, subs: [] } : b);
  }
  const last = merged[merged.length - 1];
  if (last?.type === "heading") merged[merged.length - 1] = { type: "paragraph", lines: [last.text, ...last.subs] };
  return merged;
}
