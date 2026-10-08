/* ---------------------------------------------------------------------------
   Small, dependency-free Markdown renderer (the editor lives in
   components/Markdown.jsx).

   Safety: the text is HTML-escaped FIRST and only then turned into a fixed set
   of tags, so nothing a user types can become a script or an event handler.
   Links are limited to http(s)/mailto, images to http(s) (and local previews).

   Supported: # headings, **bold**, *italic*, ~~strike~~, `code`, ``` blocks,
   [links](url), bare URLs, ![images](url), - / 1. lists, > quotes, ---.

   Uploaded images are written as  ![alt](media:<path>)  — the server swaps
   that for a signed URL when the post is read.
--------------------------------------------------------------------------- */

const escapeHtml = (text) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const SAFE_LINK = /^(https?:\/\/|mailto:)[^\s<>"]+$/i;
const SAFE_IMAGE = /^(https?:\/\/|blob:)[^\s<>"]+$/i;

// Inline formatting on ONE already-escaped line.
const renderInline = (escaped, imageMap) => {
  const stash = [];
  const keep = (html) => {
    stash.push(html);
    return `\u0000${stash.length - 1}\u0000`;
  };

  let out = escaped;

  // `code`
  out = out.replace(/`([^`]+)`/g, (_, code) => keep(`<code>${code}</code>`));

  // ![alt](src)
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, rawSrc) => {
    let src = rawSrc.replace(/&amp;/g, "&");
    if (src.startsWith("media:")) src = imageMap?.[src.slice(6)] || "";
    if (!SAFE_IMAGE.test(src)) return keep(`<span class="md-missing">[image: ${alt || "unavailable"}]</span>`);
    return keep(`<img src="${escapeHtml(src)}" alt="${alt}" loading="lazy" />`);
  });

  // [text](url)
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (whole, text, rawHref) => {
    const href = rawHref.replace(/&amp;/g, "&");
    if (!SAFE_LINK.test(href)) return whole;
    return keep(`<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer nofollow">${text}</a>`);
  });

  // bare URLs
  out = out.replace(/(^|[\s(])(https?:\/\/[^\s<>"]+[^\s<>".,;:!?)])/g, (_, lead, rawUrl) => {
    const url = rawUrl.replace(/&amp;/g, "&");
    return `${lead}${keep(`<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer nofollow">${rawUrl}</a>`)}`;
  });

  out = out
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/~~([^~\n]+)~~/g, "<del>$1</del>");

  // eslint-disable-next-line no-control-regex
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => stash[Number(i)]);
};

export const renderMarkdown = (source = "", imageMap = {}) => {
  // eslint-disable-next-line no-control-regex
  const clean = String(source).replace(/\u0000/g, "").replace(/\r\n?/g, "\n");
  const lines = escapeHtml(clean).split("\n");
  const html = [];
  let paragraph = [];
  let list = null; // { tag: "ul" | "ol", items: [] }
  let quote = [];

  const flushParagraph = () => {
    if (paragraph.length) html.push(`<p>${paragraph.map((l) => renderInline(l, imageMap)).join("<br />")}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (list) html.push(`<${list.tag}>${list.items.map((i) => `<li>${renderInline(i, imageMap)}</li>`).join("")}</${list.tag}>`);
    list = null;
  };
  const flushQuote = () => {
    if (quote.length) html.push(`<blockquote>${quote.map((l) => renderInline(l, imageMap)).join("<br />")}</blockquote>`);
    quote = [];
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ``` fenced code block
    if (/^\s*```/.test(line)) {
      flushAll();
      const code = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) code.push(lines[i++]);
      html.push(`<pre><code>${code.join("\n")}</code></pre>`);
      continue;
    }

    if (!line.trim()) {
      flushAll();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flushAll();
      const level = heading[1].length + 1; // "#" -> h2, so posts never outrank the page title
      html.push(`<h${level}>${renderInline(heading[2], imageMap)}</h${level}>`);
      continue;
    }

    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      flushAll();
      html.push("<hr />");
      continue;
    }

    const quoted = line.match(/^\s*&gt;\s?(.*)$/);
    if (quoted) {
      flushParagraph();
      flushList();
      quote.push(quoted[1]);
      continue;
    }

    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      flushParagraph();
      flushQuote();
      const tag = bullet ? "ul" : "ol";
      if (list && list.tag !== tag) flushList();
      if (!list) list = { tag, items: [] };
      list.items.push((bullet || numbered)[1]);
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(line);
  }
  flushAll();

  return html.join("\n");
};

// Pair every  media:<path>  in the stored text with the signed URL the server
// put in its place, so an edit form can preview images that are already saved.
export const buildImageMap = (rawBody = "", resolvedBody = "") => {
  const map = {};
  for (const [, path] of rawBody.matchAll(/\]\(media:([^)\s]+)\)/g)) {
    const urls = [...resolvedBody.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]);
    const hit = urls.find((u) => u.includes(path));
    if (hit) map[path] = hit;
  }
  return map;
};
