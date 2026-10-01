// Careers background worker (Architecture 12). Runs in its own container (fetcher-acc) from the same
// image as the API: `node worker.js`. It never serves HTTP.
import 'dotenv/config';
import cron from 'node-cron';
import prisma from './config/db.js';
import { JOBS } from './services/careers/jobs.js';
import { heartbeat } from './services/careers/heartbeat.js';

const timezone = process.env.CAREERS_TZ || 'Asia/Kolkata';

const tasks = Object.entries(JOBS).map(([name, job]) => cron.schedule(job.cron, async () => {
    // Jobs already catch their own errors (withJobLock); this is the last line of defence, because
    // an exception escaping a cron callback must never take the worker down.
    try {
        await job.run();
    } catch (err) {
        console.error(`[careers] job ${name} crashed`, err);
    }
}, { name, timezone, noOverlap: true }));

try {
    await heartbeat('workerStarted');
} catch (err) {
    console.error('[careers] could not write the start heartbeat (database down?)', err);
}
console.info(`[careers] worker started (pid ${process.pid}, tz ${timezone}): ${Object.entries(JOBS).map(([n, j]) => `${n} "${j.cron}"`).join(', ')}`);

let stopping = false;
async function shutdown(signal) {
    if (stopping) return;
    stopping = true;
    console.info(`[careers] worker stopping (${signal})`);
    await Promise.all(tasks.map((t) => t.stop()));
    await prisma.$disconnect();
    process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
