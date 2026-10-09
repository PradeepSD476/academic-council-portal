// The careers background jobs (Architecture 12). worker.js schedules them; scripts/careers/runJob.js
// runs one by hand. Every job goes through withJobLock, so two workers (or a cron tick and a manual
// run) never run the same job at once.
import { withJobLock, JOB_LOCKS } from './jobLock.js';
import { getSetting, setSetting, clearSettingsCache } from './settings.js';
import { ingestAll } from './ingest/ingestAll.js';
import { processSubmissions } from './links/processSubmission.js';
import { runExtractions } from './extract/runExtractions.js';
import { recheckLiveness } from './links/recheckLiveness.js';
import { expirePastDeadlines } from './postings/deadlines.js';
import { heartbeat } from './heartbeat.js';

// Ingest of every enabled ATS source (every 6 hours, and on admin "Run now" requests).
export async function ingestJob(options = {}) {
    let result = null;
    const outcome = await withJobLock(JOB_LOCKS.ingestAll, 'ingestAll', async () => {
        result = await ingestAll(options.sourceId ? { sourceId: options.sourceId } : {});
    }, { heartbeat: options.heartbeat ?? true });
    return { ...outcome, result };
}

// Consumes careers.runRequest ({ sourceId: id | 'ALL', requestedAt, byUserId }), written by the
// admin "Fetch now" buttons. The request is cleared only after the ingest actually ran, and only if
// no newer request arrived meanwhile; while the scheduled ingest holds its lock the request waits.
// Only the worker runs it: fetching stays out of the API process, which serves the website.
export async function checkRunRequests() {
    clearSettingsCache(); // the API process writes this key; don't read a stale cached copy
    const request = await getSetting('careers.runRequest');
    if (!request) return { requested: false };

    console.info(`[careers] run request: source ${request.sourceId} (by user #${request.byUserId} at ${request.requestedAt})`);
    const run = await ingestJob({ sourceId: request.sourceId === 'ALL' ? null : request.sourceId });
    if (!run.ran) return { requested: true, ran: false };

    clearSettingsCache();
    const current = await getSetting('careers.runRequest');
    if (current?.requestedAt === request.requestedAt) await setSetting('careers.runRequest', null);
    return { requested: true, ran: true, ok: run.ok };
}

// One runRequests tick. Most ticks find nothing, so the request is read first (one small query)
// and the lock transaction is only opened when there is something to run.
export async function runRequestsTick({ readRequest = readRunRequest, runLocked = runRequestsLocked } = {}) {
    if (!(await readRequest())) return { requested: false };
    return runLocked();
}

async function readRunRequest() {
    clearSettingsCache();
    return getSetting('careers.runRequest');
}

// The lock stops two workers from both picking up the same request. No heartbeat here: the
// heartbeat job reports every minute on its own.
function runRequestsLocked() {
    return withJobLock(JOB_LOCKS.runRequests, 'runRequests', checkRunRequests, { heartbeat: false });
}

// Student links, then model extraction of the pages that need it (in that order, one lock).
export async function linksJob(options = {}) {
    let result = null;
    const outcome = await withJobLock(JOB_LOCKS.linksAndExtraction, 'linksAndExtraction', async () => {
        result = { submissions: await processSubmissions(), extractions: await runExtractions() };
    }, { heartbeat: options.heartbeat ?? true });
    return { ...outcome, result };
}

// Daily URL recheck of manual and student-link postings (ATS postings are covered by the ingest),
// then expiry of postings whose stated deadline has passed.
export async function livenessJob(options = {}) {
    let result = null;
    const outcome = await withJobLock(JOB_LOCKS.recheckLiveness, 'recheckLiveness', async () => {
        result = { ...(await recheckLiveness()), deadlines: await expirePastDeadlines() };
    }, { heartbeat: options.heartbeat ?? true });
    return { ...outcome, result };
}

// name -> { cron, run }
export const JOBS = {
    // Every 6 hours (02:00, 08:00, 14:00, 20:00 IST): one run is ~12 sequential board requests, so this
    // is cheap, and new openings reach the review queue within hours. Liveness counts missed runs, so a
    // job that leaves its board expires after ~12 hours (MISSED_RUNS_TO_DROP = 2).
    ingestAll: { cron: '0 2,8,14,20 * * *', run: () => ingestJob() },
    recheckLiveness: { cron: '30 5 * * *', run: () => livenessJob() },
    linksAndExtraction: { cron: '*/10 * * * *', run: () => linksJob() },
    // Every 10 s (6-field cron with seconds), so "Fetch now" starts within seconds.
    runRequests: { cron: '*/10 * * * * *', run: () => runRequestsTick() },
    // Proof of life for the operations page (WORKER_STALE after 20 min of silence).
    heartbeat: { cron: '* * * * *', run: () => heartbeat('alive') },
};
