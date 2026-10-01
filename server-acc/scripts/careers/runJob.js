// Runs a careers job once from the command line, under the same lock the worker uses, so a manual
// run and a scheduled run never overlap.
// Usage: node scripts/careers/runJob.js ingest [sourceId] | links
//   (the liveness recheck is added in P1-T11)
import prisma from '../../config/db.js';
import { ingestJob, linksJob } from '../../services/careers/jobs.js';

const USAGE = 'Usage: node scripts/careers/runJob.js ingest [sourceId] | links';

function printIngest({ skipped, results }) {
    if (skipped) {
        console.log(`Skipped: ${skipped}`);
        return;
    }
    console.log('source  status   health        fetched  kept  new  dup  seen  missed/dropped/expired  dropped-by-filter');
    for (const r of results) {
        const l = r.liveness ? `${r.liveness.missed}/${r.liveness.dropped}/${r.liveness.expired}` : '-';
        console.log([
            `#${r.sourceId}`.padEnd(7), (r.status ?? '').padEnd(8), (r.health ?? '').padEnd(13),
            String(r.fetchedCount ?? 0).padStart(7), String(r.keptCount ?? 0).padStart(5), String(r.newCount ?? 0).padStart(4),
            String(r.duplicateCount ?? 0).padStart(4), String(r.seenCount ?? 0).padStart(5), l.padStart(22), ` ${JSON.stringify(r.dropped ?? {})}`,
        ].join(' '));
        if (r.error) console.log(`        error: ${r.error}`);
    }
    const sum = (key) => results.reduce((n, r) => n + (r[key] ?? 0), 0);
    const failed = results.filter((r) => r.status === 'FAILED').length;
    console.log(`TOTAL   sources=${results.length} failed=${failed} fetched=${sum('fetchedCount')} kept=${sum('keptCount')} new=${sum('newCount')} dup=${sum('duplicateCount')} seen=${sum('seenCount')}`);
}

const [job, arg] = process.argv.slice(2);
let exitCode = 0;
try {
    if (job === 'ingest') {
        const sourceId = arg ? Number(arg) : null;
        if (arg && !Number.isInteger(sourceId)) throw new Error(`sourceId must be a number, got "${arg}"`);
        const outcome = await ingestJob({ sourceId, heartbeat: false });
        if (!outcome.ran) {
            console.log('Another ingest is running (lock held). Nothing done.');
        } else if (!outcome.ok) {
            exitCode = 1;
        } else {
            printIngest(outcome.result);
        }
    } else if (job === 'links') {
        const outcome = await linksJob({ heartbeat: false });
        if (!outcome.ran) console.log('Another links run is in progress (lock held). Nothing done.');
        else if (!outcome.ok) exitCode = 1;
        else console.log(JSON.stringify(outcome.result));
    } else {
        console.error(USAGE);
        exitCode = 2;
    }
} catch (err) {
    console.error(err.message);
    exitCode = 1;
} finally {
    await prisma.$disconnect();
}
process.exit(exitCode);
