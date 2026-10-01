// The careers background jobs (Architecture 12). worker.js schedules them; scripts/careers/runJob.js
// runs one by hand. Every job goes through withJobLock, so two workers (or a cron tick and a manual
// run) never run the same job at once.
import { withJobLock, JOB_LOCKS } from './jobLock.js';
import { getSetting, setSetting, clearSettingsCache } from './settings.js';
import { ingestAll } from './ingest/ingestAll.js';
import { processSubmissions } from './links/processSubmission.js';
import { runExtractions } from './extract/runExtractions.js';

// Daily ingest of every enabled ATS source.
export async function ingestJob(options = {}) {
    let result = null;
    const outcome = await withJobLock(JOB_LOCKS.ingestAll, 'ingestAll', async () => {
        result = await ingestAll(options.sourceId ? { sourceId: options.sourceId } : {});
    }, { heartbeat: options.heartbeat ?? true });
    return { ...outcome, result };
}

// Consumes careers.runRequest ({ sourceId: id | 'ALL', requestedAt, byUserId }), written by the
// admin "Run now" buttons. The request is cleared only after the ingest actually ran, and only if
// no newer request arrived meanwhile; while the daily ingest holds its lock the request waits.
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

// Student links, then model extraction of the pages that need it (in that order, one lock).
export async function linksJob(options = {}) {
    let result = null;
    const outcome = await withJobLock(JOB_LOCKS.linksAndExtraction, 'linksAndExtraction', async () => {
        result = { submissions: await processSubmissions(), extractions: await runExtractions() };
    }, { heartbeat: options.heartbeat ?? true });
    return { ...outcome, result };
}

// name -> { cron, run }. The liveness recheck for manual / link postings is added in P1-T11.
export const JOBS = {
    ingestAll: { cron: '0 2 * * *', run: () => ingestJob() },
    linksAndExtraction: { cron: '*/10 * * * *', run: () => linksJob() },
    runRequests: {
        cron: '* * * * *',
        // The outer lock stops two workers from both picking up the same request.
        run: () => withJobLock(JOB_LOCKS.runRequests, 'runRequests', checkRunRequests),
    },
};
