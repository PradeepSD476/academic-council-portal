// Source health after a run (Architecture 6.3). Pure: returns the Source fields to write.
//   run threw            -> FAILING, consecutiveFailures + 1, lastError set
//   success, 0 fetched   -> ZERO_RESULTS (a board that suddenly goes empty is suspicious; an admin decides)
//   success, > 0 fetched -> OK, consecutiveFailures reset
//   source disabled      -> DISABLED (it is not run)
const MAX_ERROR_LENGTH = 2000;

// run: { error?: Error|string|null, fetchedCount, keptCount }
export function nextHealth(source, run, now = new Date()) {
    if (!source.isEnabled) return { health: 'DISABLED' };

    if (run.error) {
        const message = run.error instanceof Error ? run.error.message : String(run.error);
        return {
            health: 'FAILING',
            lastRunAt: now,
            consecutiveFailures: (source.consecutiveFailures ?? 0) + 1,
            lastError: message.slice(0, MAX_ERROR_LENGTH),
        };
    }

    return {
        health: run.fetchedCount === 0 ? 'ZERO_RESULTS' : 'OK',
        lastRunAt: now,
        lastSuccessAt: now,
        lastFetchedCount: run.fetchedCount,
        lastKeptCount: run.keptCount,
        consecutiveFailures: 0,
        lastError: null,
    };
}
