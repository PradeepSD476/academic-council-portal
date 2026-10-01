// Prevents two workers (or a cron tick and a manual run) from running the same job at once.
//
// Postgres advisory locks belong to a connection, and Prisma uses a connection pool, so a plain
// pg_try_advisory_lock / pg_advisory_unlock pair can land on different connections. Instead we
// hold a transaction-scoped lock (pg_try_advisory_xact_lock) inside an interactive transaction:
// the transaction pins one connection, and the lock is released automatically when it ends,
// even if the job throws or the process dies.
import prisma from '../../config/db.js';
import { heartbeat } from './heartbeat.js';

const MAX_JOB_MS = 60 * 60 * 1000;

export const JOB_LOCKS = {
    ingestAll: 81001,
    recheckLiveness: 81002,
    linksAndExtraction: 81003,
    runRequests: 81004,
};

// Runs fn at most once at a time per lockKey. Never throws: failures are logged and reported in
// the result, because an exception escaping a cron callback would crash the worker.
// options.heartbeat = false for manual CLI runs, so they don't hide a stopped worker.
export async function withJobLock(lockKey, name, fn, { heartbeat: writeHeartbeat = true } = {}) {
    let outcome = { ran: false, ok: false, error: null };
    try {
        await prisma.$transaction(async (tx) => {
            const [{ locked }] = await tx.$queryRaw`SELECT pg_try_advisory_xact_lock(${lockKey}::bigint) AS locked`;
            if (!locked) {
                console.info(`[careers] job ${name} skipped: already running elsewhere`);
                return;
            }
            outcome.ran = true;
            await fn();
            outcome.ok = true;
        }, { maxWait: 10_000, timeout: MAX_JOB_MS });
    } catch (err) {
        outcome.error = err;
        console.error(`[careers] job ${name} failed`, err);
    }

    if (outcome.ran && writeHeartbeat) {
        try {
            await heartbeat(name);
        } catch (err) {
            console.error(`[careers] heartbeat after ${name} failed`, err);
        }
    }
    return outcome;
}
