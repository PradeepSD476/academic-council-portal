// Checks that an ATS board token is real before it becomes a Source, and prints the response
// shape so adapters are written against real data, not memory.
// Usage: node scripts/careers/verifyBoard.js <greenhouse|lever|ashby> <token> [--save] [--raw]
//   --save  writes a trimmed 3-job fixture to tests/careers/fixtures/<kind>.json (for adapter tests)
//   --raw   prints the first raw job object
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { fetchJson } from '../../services/careers/ingest/http.js';
import { ADAPTERS } from '../../services/careers/ingest/adapters/index.js';

const [kindArg, token, ...flags] = process.argv.slice(2);
const kind = kindArg?.toUpperCase();
const adapter = ADAPTERS[kind];
if (!adapter || !token) {
    console.error('Usage: node scripts/careers/verifyBoard.js <greenhouse|lever|ashby> <token> [--save] [--raw]');
    process.exit(2);
}

const MAX_DESCRIPTION = 4000;

function trimJob(job) {
    const copy = structuredClone(job);
    for (const key of ['content', 'description', 'descriptionHtml', 'descriptionPlain', 'additional', 'additionalPlain', 'openingPlain', 'opening']) {
        if (typeof copy[key] === 'string' && copy[key].length > MAX_DESCRIPTION) copy[key] = `${copy[key].slice(0, MAX_DESCRIPTION)}…`;
    }
    return copy;
}

try {
    const url = adapter.boardUrl(token);
    const body = await fetchJson(url);
    const jobs = adapter.jobsFrom(body);
    console.log(`${kind} ${token}: ${jobs.length} jobs  (${url})`);
    if (jobs.length) {
        console.log('first job keys:', Object.keys(jobs[0]).join(', '));
        if (flags.includes('--raw')) console.log(JSON.stringify(trimJob(jobs[0]), null, 2).slice(0, 3000));
        const mapped = adapter.mapJob(jobs[0], { boardToken: token });
        console.log('mapped:', JSON.stringify({ ...mapped, descriptionText: `${(mapped.descriptionText ?? '').slice(0, 120)}…`, descriptionHtml: undefined }, null, 2));
    }
    if (flags.includes('--save')) {
        const here = path.dirname(fileURLToPath(import.meta.url));
        const dir = path.resolve(here, '../../tests/careers/fixtures');
        mkdirSync(dir, { recursive: true });
        const file = path.join(dir, `${kind.toLowerCase()}.json`);
        writeFileSync(file, `${JSON.stringify(adapter.fixtureFrom(body, jobs.slice(0, 3).map(trimJob)), null, 2)}\n`);
        console.log(`saved ${Math.min(3, jobs.length)} jobs to ${path.relative(process.cwd(), file)}`);
    }
} catch (err) {
    console.error(`${kind} ${token}: FAILED - ${err.message}`);
    process.exitCode = 1;
}
