// Runs a careers job once from the command line, under the same lock the worker uses, so a manual
// run and a scheduled run never overlap.
// Usage: node scripts/careers/runJob.js ingest [sourceId] | links | liveness | alerts | reminder | cleanup [--yes]
import prisma from '../../config/db.js';
import { ingestJob, linksJob, livenessJob, alertsJob, reviewReminderJob } from '../../services/careers/jobs.js';
import { assertNotProduction, findTestData, runCleanup } from '../../services/careers/ops/cleanup.js';

const USAGE = 'Usage: node scripts/careers/runJob.js ingest [sourceId] | links | liveness | alerts | reminder | cleanup [--yes]';

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

// P8-T3 (F-17): lists the test data; deletes it only with --yes. Never with NODE_ENV=production.
function printCleanup(plan) {
    const section = (title, rows, line) => {
        console.log(`${title}: ${rows.length}`);
        for (const r of rows) console.log(`  ${line(r)}`);
    };
    section('Postings', plan.postings, (p) => `#${p.id} ${p.roleTitle} (${p.status}) ${p.applyUrl}`);
    section('Companies', plan.companies, (c) => `#${c.id} ${c.name}`);
    section('Sources', plan.sources, (s) => `#${s.id} ${s.name}`);
    section('Student links', plan.links, (l) => `#${l.id} ${l.url}`);
    section('Kept (looks like test data, but in use)', plan.skipped, (s) => `${s.kind} #${s.id} ${s.name}: ${s.why}`);
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
    } else if (job === 'liveness') {
        const outcome = await livenessJob({ heartbeat: false });
        if (!outcome.ran) console.log('Another recheck is in progress (lock held). Nothing done.');
        else if (!outcome.ok) exitCode = 1;
        else console.log(JSON.stringify(outcome.result));
    } else if (job === 'reminder') {
        const outcome = await reviewReminderJob({ heartbeat: false });
        if (!outcome.ran) console.log('Another reminder run is in progress (lock held). Nothing done.');
        else if (!outcome.ok) exitCode = 1;
        else console.log(JSON.stringify(outcome.result));
    } else if (job === 'alerts') {
        const outcome = await alertsJob({ heartbeat: false });
        if (!outcome.ran) console.log('Another alerts run is in progress (lock held). Nothing done.');
        else if (!outcome.ok) exitCode = 1;
        else console.log(JSON.stringify(outcome.result));
    } else if (job === 'cleanup') {
        if (arg && arg !== '--yes') throw new Error(`Unknown option "${arg}". Use: cleanup [--yes]`);
        assertNotProduction();
        const plan = await findTestData(prisma);
        printCleanup(plan);
        const total = plan.postings.length + plan.companies.length + plan.sources.length + plan.links.length;
        if (arg !== '--yes') console.log(total ? 'Dry run: nothing deleted. Run again with --yes to delete the rows listed above.' : 'Nothing to delete.');
        else if (!total) console.log('Nothing to delete.');
        else console.log('Deleted:', JSON.stringify(await runCleanup(prisma, plan)));
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
