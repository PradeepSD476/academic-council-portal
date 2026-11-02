// The job description cut out of a fetched page (B-22). A page on a job aggregator also carries
// menus, "similar jobs" lists and widgets, which <main> does not exclude. The model returns only the
// first and last few words of the description, copied from the page; the text between them is taken
// from the page itself, so nothing is paraphrased or invented. Pure.
//
// Matching ignores case, spaces and punctuation ("B.E/ B.Tech" finds "B.E/B.Tech"), and the cut is
// widened to whole lines, so a sentence that shares a line with an anchor is never lost.

export const MIN_SPAN_CHARS = 150; // shorter than this is not a description; keep the whole page
const MIN_ANCHOR_CHARS = 10; // letters and digits; one or two common words could match anywhere
const MAX_ANCHOR_WORDS = 12;

const isKept = (ch) => /[\p{L}\p{N}]/u.test(ch);
const flatten = (s) => [...String(s ?? '')].filter(isKept).join('').toLowerCase();

// The page as a string of lower-case letters and digits, with each character's index in the page.
function flatPage(text) {
    let flat = '';
    const pos = [];
    for (let i = 0; i < text.length; i++) {
        if (!isKept(text[i])) continue;
        const lower = text[i].toLowerCase();
        for (const c of lower) { flat += c; pos.push(i); } // a few letters lower-case to two code units
    }
    return { flat, pos };
}

// A model sometimes slips a word inside a long anchor ("M.A equivalent" for "M.A or equivalent"), so
// shorter anchors are tried too: the first 12 / 8 / 5 words of the start, the last 12 / 8 / 5 of the end.
const LENGTHS = [MAX_ANCHOR_WORDS, 8, 5];
const variants = (s, fromEnd) => {
    const words = String(s ?? '').split(/\s+/).filter(Boolean);
    return [...new Set(LENGTHS.map((n) => flatten((fromEnd ? words.slice(-n) : words.slice(0, n)).join(' '))))].filter((a) => a.length >= MIN_ANCHOR_CHARS);
};

// Returns the page lines from the first anchor's line to the last anchor's line, or null.
export function descriptionSpan(page, firstWords, lastWords) {
    const text = String(page ?? '');
    const firsts = variants(firstWords, false);
    const lasts = variants(lastWords, true); // the end of the description is what matters
    if (!firsts.length || !lasts.length) return null;

    const { flat, pos } = flatPage(text);
    for (const first of firsts) {
        const at = flat.indexOf(first);
        if (at < 0) continue;
        for (const last of lasts) {
            const endAt = flat.indexOf(last, at + first.length);
            if (endAt < 0) continue;
            const lineStart = text.lastIndexOf('\n', pos[at]) + 1;
            const nextBreak = text.indexOf('\n', pos[endAt + last.length - 1]);
            const span = text.slice(lineStart, nextBreak < 0 ? text.length : nextBreak).trim();
            return span.length >= MIN_SPAN_CHARS ? span : null;
        }
    }
    return null;
}
