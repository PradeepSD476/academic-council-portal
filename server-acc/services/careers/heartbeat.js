// The worker records a heartbeat after every job so the operations page can flag a dead worker
// ("loud failure": silence from the worker must itself be visible).
import { setSetting } from './settings.js';

export async function heartbeat(job) {
    await setSetting('careers.workerHeartbeat', { at: new Date().toISOString(), job });
}
