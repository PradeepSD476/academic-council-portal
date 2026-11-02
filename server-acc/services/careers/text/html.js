// HTML -> readable plain text for job descriptions and fetched pages. Pure: no network.
import * as cheerio from 'cheerio';

const DROP = 'script, style, noscript, template, iframe, svg, canvas, form, button, nav, header, footer, aside';
const BLOCKS = 'p, div, section, article, main, li, ul, ol, br, h1, h2, h3, h4, h5, h6, tr, table, blockquote, pre, hr, dd, dt';

// Some ATS APIs (e.g. Greenhouse `content`) return HTML that is itself entity-escaped
// ("&lt;p&gt;Hello&lt;/p&gt;"). Decoding once turns it back into markup before parsing.
export function decodeEntities(text) {
    if (typeof text !== 'string' || !text) return '';
    return cheerio.load(`<textarea>${text}</textarea>`)('textarea').text();
}

// preferMain: for full web pages, read only <main>/<article> when present, to skip site chrome.
export function htmlToText(html, { escaped = false, preferMain = false } = {}) {
    if (typeof html !== 'string' || !html.trim()) return '';
    const source = escaped ? decodeEntities(html) : html;
    const $ = cheerio.load(source);
    $(DROP).remove();

    let root = $('body').length ? $('body') : $.root();
    if (preferMain) {
        const main = $('main, article, [role="main"]').first();
        if (main.length) root = main;
    }

    // Bullets first, then line breaks around blocks (so each bullet starts its own line and words
    // from adjacent blocks don't run together).
    root.find('li').each((_, el) => {
        $(el).prepend('- ');
    });
    root.find(BLOCKS).each((_, el) => {
        $(el).prepend('\n').append('\n');
    });

    return root
        .text()
        .replace(/ /g, ' ')
        .split('\n')
        .map((line) => line.replace(/[ \t\r\f\v]+/g, ' ').trim())
        .filter(Boolean)
        .join('\n');
}
