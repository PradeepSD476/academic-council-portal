// Daily liveness recheck for postings that have no board to watch: MANUAL and STUDENT_LINK
// observations (Architecture 6.3). Each live observation's URL is fetched through safeFetch;
// HTTP 404 / 410 counts a miss, MISSED_RUNS_TO_DROP misses drop the observation, and a posting with
// no live observation left expires. Network errors and other statuses only get logged.
import prisma from '../../../config/db.js';
import { safeFetch } from './safeFetch.js';
import { isBlockedDomain } from './blockedDomains.js';
import { recheckUpdate, recheckResult, shouldExpire } from '../ingest/liveness.js';

export const RECHECK_KINDS = ['MANUAL', 'STUDENT_LINK'];
export const RECHECK_BATCH = 200;

const hostOf = (url) => {
    try {
        return new URL(url).hostname;
    } catch {
        return '';
    }
};

// fetchPage is injectable for tests. Returns { checked, ok, gone, errors, skipped, dropped, expired }.
export async function recheckLiveness({ db = prisma, fetchPage = safeFetch, now = new Date(), limit = RECHECK_BATCH } = {}) {
    const observations = await db.postingSource.findMany({
        where: {
            isLive: true,
            source: { kind: { in: RECHECK_KINDS } },
            posting: { status: { in: ['LIVE', 'PENDING_REVIEW'] } },
        },
        orderBy: { lastSeenAt: 'asc' },
        take: limit,
        select: { id: true, postingId: true, url: true, missedRuns: true },
    });

    const counts = { checked: 0, ok: 0, gone: 0, errors: 0, skipped: 0, dropped: 0, expired: 0 };
    const droppedPostings = new Set();
    for (const obs of observations) {
        // Sites we never fetch (LinkedIn etc.) are left to the admins.
        if (!obs.url || isBlockedDomain(hostOf(obs.url))) {
            counts.skipped++;
            continue;
        }
        counts.checked++;
        let result;
        try {
            await fetchPage(obs.url);
            result = recheckResult(null);
        } catch (err) {
            result = recheckResult(err);
        }
        if (result.ok) counts.ok++;
        else if (result.gone) counts.gone++;
        else {
            counts.errors++;
            console.warn(`[careers] recheck: observation #${obs.id} (${hostOf(obs.url)}) not counted: ${result.error}`);
        }

        const update = recheckUpdate(obs, result, now);
        if (!update) continue;
        await db.postingSource.update({ where: { id: obs.id }, data: update });
        // A page that still loads confirms the posting (the student freshness line reads this).
        if (result.ok) await db.posting.update({ where: { id: obs.postingId }, data: { lastSeenLiveAt: now } });
        if (update.isLive === false) {
            counts.dropped++;
            droppedPostings.add(obs.postingId);
        }
    }

    for (const postingId of droppedPostings) {
        const posting = await db.posting.findUnique({
            where: { id: postingId },
            select: { id: true, status: true, observations: { select: { isLive: true } } },
        });
        if (!posting || !shouldExpire(posting, posting.observations)) continue;
        await db.posting.update({ where: { id: postingId }, data: { status: 'EXPIRED', expiredReason: 'BOARD' } });
        counts.expired++;
    }
    if (counts.expired) console.info(`[careers] recheck: expired ${counts.expired} posting(s) (${now.toISOString()})`);
    return counts;
}
