// Turns a posting's plain-text description into blocks the page can lay out: headings, bullet lists
// and paragraphs. The text is only re-arranged, never changed or shortened (a test script checks
// that on the real postings), and it is rendered as React text, never as HTML.

const BULLET = /^\s*(?:[•●▪‣◦·■□○▶►➤✓✔*]|[-–—](?=\s))\s*/;
const INLINE_BULLET = /\s+[•●▪‣◦■]\s+/;
const NUMBERED = /^\s*(\d{1,2})[.)]\s+(?=\S)/;
const SHORT = 60; // longest line that can be a heading

const clean = (s) => s.replace(/\s+/g, " ").trim();

// A short line with no sentence ending, e.g. "Who we are" or "What we are looking for:".
const isHeadingShaped = (line) => line.length <= SHORT && line.split(" ").length <= 9 && !/[.!?,;]$/.test(line);

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
  for (const raw of String(text ?? "").replace(/\r\n?/g, "\n").split("\n")) {
    if (!raw.trim()) { lines.push({ blank: true }); continue; }
    for (const p of pieces(raw)) lines.push(p);
  }

  // Short plain lines: a run of one or two (or any line ending in ":") is a heading; a longer run
  // is probably a list of items (locations, names), so it stays as lines.
  const plain = (l) => l && !l.blank && !l.bullet;
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
    i = end;
  }

  const blocks = [];
  let paragraph = null;
  let list = null;
  const flush = () => { paragraph = null; list = null; };
  lines.forEach((l, i) => {
    if (l.blank) { flush(); return; }
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
  return blocks;
}
