// Container health check for the worker (docker-compose fetcher-acc): exit 0 if the worker's
// heartbeat is recent, 1 otherwise. Usage: node scripts/careers/workerHealth.js
import 'dotenv/config';
import prisma from '../../config/db.js';
import { getSetting } from '../../services/careers/settings.js';
import { workerHealthy, WORKER_HEALTHCHECK_MINUTES } from '../../services/careers/ops/alerts.js';

let exitCode = 1;
try {
    const heartbeat = await getSetting('careers.workerHeartbeat');
    if (workerHealthy(heartbeat)) exitCode = 0;
    else console.error(`[careers] worker unhealthy: last heartbeat ${heartbeat?.at ?? 'never'} (limit ${WORKER_HEALTHCHECK_MINUTES} min)`);
} catch (err) {
    console.error('[careers] worker health check failed', err.message);
} finally {
    await prisma.$disconnect();
}
process.exit(exitCode);
