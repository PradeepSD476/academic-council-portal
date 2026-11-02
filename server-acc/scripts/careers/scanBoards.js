// Finds more job boards (P6-T1, F-23). For every company in boardCandidates.json it tries the
// likely board tokens on Greenhouse, Lever and Ashby, and prints which boards exist and how many
// roles each would keep (India or remote, early career). Dry run: nothing is written to the database.
// The last block is ready to paste into Sources → "Add boards in bulk".
// Usage: node scripts/careers/scanBoards.js [--kind greenhouse|lever|ashby] [--only <name part>] [--all]
//   --all  also lists boards that are already sources (needs the database; without it, all are listed)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { fetchPostings } from '../../services/careers/ingest/adapters/index.js';
import { evaluateRelevance } from '../../services/careers/text/relevance.js';
import { tokensFor, pasteLines } from '../../services/careers/sources/scan.js';

const AT_ONCE = 6;
const args = process.argv.slice(2);
const flag = (name) => {
    const i = args.indexOf(name);
    return i === -1 ? null : (args[i + 1] ?? '');
};
const kinds = flag('--kind') ? [flag('--kind').toUpperCase()] : ['GREENHOUSE', 'LEVER', 'ASHBY'];
const only = flag('--only')?.toLowerCase();

const here = path.dirname(fileURLToPath(import.meta.url));
const candidates = JSON.parse(readFileSync(path.join(here, 'boardCandidates.json'), 'utf8'))
    .filter((c) => !only || c.company.toLowerCase().includes(only));

// Boards that are already sources, so they are not suggested again. The database is optional.
async function existingBoards() {
    if (args.includes('--all')) return new Set();
    try {
        const { default: prisma } = await import('../../config/db.js');
        const rows = await prisma.source.findMany({ where: { boardToken: { not: null } }, select: { kind: true, boardToken: true } });
        await prisma.$disconnect();
        return new Set(rows.map((r) => `${r.kind} ${r.boardToken}`));
    } catch (err) {
        console.warn(`(could not read existing sources, listing every board: ${err.message})`);
        return new Set();
    }
}

async function probe({ company, kind, token }) {
    try {
        const { postings, fetchedCount } = await fetchPostings({ kind, boardToken: token });
        return { company, kind, token, fetched: fetchedCount, relevant: postings.filter((p) => evaluateRelevance(p).keep).length };
    } catch (err) {
        return err.status === 404 ? null : { company, kind, token, error: err.message };
    }
}

const tries = candidates.flatMap((c) => tokensFor(c).flatMap((token) => kinds.map((kind) => ({ company: c.company, kind, token }))));
console.log(`Checking ${candidates.length} companies (${tries.length} board URLs)…`);
const results = [];
let next = 0;
await Promise.all(Array.from({ length: AT_ONCE }, async () => {
    while (next < tries.length) {
        const r = await probe(tries[next++]);
        if (r) results.push(r);
    }
}));

const existing = await existingBoards();
// Ashby and Lever answer an unknown name with an empty board; only boards with jobs count as found.
const found = results.filter((r) => !r.error && r.fetched > 0);
const errors = results.filter((r) => r.error);
found.sort((a, b) => b.relevant - a.relevant || b.fetched - a.fetched);

console.log('\nkind        token                     company                          jobs  relevant');
for (const f of found) {
    const mark = existing.has(`${f.kind} ${f.token}`) ? '  (already a source)' : '';
    console.log(`${f.kind.toLowerCase().padEnd(11)} ${f.token.padEnd(25)} ${f.company.slice(0, 32).padEnd(32)} ${String(f.fetched).padStart(5)} ${String(f.relevant).padStart(9)}${mark}`);
}
const noBoard = candidates.filter((c) => !found.some((f) => f.company === c.company)).map((c) => c.company);
console.log(`\n${found.length} boards found for ${candidates.length - noBoard.length} of ${candidates.length} companies; ${found.filter((f) => f.relevant > 0).length} have relevant roles now.`);
if (errors.length) console.log(`${errors.length} checks failed (not 404): ${errors.slice(0, 5).map((e) => `${e.kind.toLowerCase()}/${e.token}: ${e.error}`).join('; ')}${errors.length > 5 ? ' …' : ''}`);
if (noBoard.length) console.log(`No public board found: ${noBoard.join(', ')}`);

const lines = pasteLines(found, existing);
console.log(`\nPaste into Sources → Add boards in bulk (${lines.length} new boards with relevant roles; at most 30 per paste):`);
console.log(lines.join('\n') || '(none)');
