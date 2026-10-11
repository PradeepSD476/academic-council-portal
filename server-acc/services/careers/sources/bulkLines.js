// Pure. Reads the "Add boards in bulk" paste (P6-T1, F-23): one board per line,
// `kind token company name`, separated by spaces, tabs or commas. Blank lines and # comments are
// ignored; bad lines are reported with their line number and the good ones are kept.
export const MAX_BULK_LINES = 30;
export const BULK_KINDS = ['GREENHOUSE', 'LEVER', 'ASHBY', 'SMARTRECRUITERS', 'WORKABLE'];
// Same rule as Add board: board tokens are path segments on the ATS APIs.
export const BOARD_TOKEN = /^[a-z0-9][a-z0-9_-]{0,99}$/;

export function parseBulkLines(text) {
    const entries = [];
    const errors = [];
    const seen = new Map(); // "KIND token" -> line number
    const lines = String(text ?? '').split(/\r?\n/);
    lines.forEach((raw, i) => {
        const lineNo = i + 1;
        const line = raw.trim();
        if (!line || line.startsWith('#')) return;
        const fail = (reason) => errors.push({ lineNo, line, reason });
        const [kindPart, tokenPart, ...rest] = line.split(/[\s,]+/);
        const kind = kindPart.toUpperCase();
        if (!BULK_KINDS.includes(kind)) return fail('Start the line with greenhouse, lever, ashby, smartrecruiters or workable.');
        const boardToken = (tokenPart ?? '').toLowerCase();
        if (!BOARD_TOKEN.test(boardToken)) return fail('The board token can only have letters, digits, - or _.');
        const companyName = rest.join(' ').trim();
        if (!companyName) return fail('Add the company name after the token.');
        const key = `${kind} ${boardToken}`;
        if (seen.has(key)) return fail(`Same board as line ${seen.get(key)}.`);
        seen.set(key, lineNo);
        entries.push({ lineNo, kind, boardToken, companyName });
    });
    return { entries, errors, tooMany: entries.length > MAX_BULK_LINES };
}
