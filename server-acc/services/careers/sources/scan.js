// Pure helpers for scripts/careers/scanBoards.js (P6-T1, F-23): which board tokens to try for a
// candidate company, and the paste lines for "Add boards in bulk".

// A candidate is { company, tokens? }. Without tokens, the usual board names are tried: the name
// with spaces removed and with spaces as hyphens ("Urban Company" -> urbancompany, urban-company).
export function tokensFor(candidate) {
    const base = String(candidate.company ?? '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
        .replace(/&/g, 'and').replace(/[^a-z0-9\s-]/g, '').trim();
    const guesses = base ? [base.replace(/[\s-]+/g, ''), base.replace(/\s+/g, '-')] : [];
    return [...new Set([...(candidate.tokens ?? []).map((t) => t.toLowerCase()), ...guesses])].filter((t) => /^[a-z0-9][a-z0-9_-]{0,99}$/.test(t));
}

// One paste line per board found with at least one relevant role that is not a source yet,
// best boards first.
export function pasteLines(found, existing = new Set()) {
    return found
        .filter((f) => f.relevant > 0 && !existing.has(`${f.kind} ${f.token}`))
        .sort((a, b) => b.relevant - a.relevant || a.company.localeCompare(b.company))
        .map((f) => `${f.kind.toLowerCase()} ${f.token} ${f.company}`);
}
