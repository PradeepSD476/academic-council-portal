// Liveness for ATS postings (Architecture 6.3). A job that disappears from its board is not
// expired at once (boards glitch); it must be missing from MISSED_RUNS_TO_DROP successful runs.
// The manual / student-link URL recheck (recheckLiveness) is added in P1-T11.
export const MISSED_RUNS_TO_DROP = 2;

// Statuses that expire when every observation of the posting has gone.
const EXPIRABLE = ['LIVE', 'PENDING_REVIEW'];

// Pure. Status of a posting whose observation was just seen on a board.
//   observationWasLive: the observation was live before this sighting (always false for a new observation)
// Only a posting that expired because it left its board comes back; one an admin expired while it
// was still listed stays expired, and REJECTED never changes. It returns to LIVE only if it had
// been approved before (publishedAt), otherwise to the review queue.
export function statusWhenSeen(posting, observationWasLive) {
    if (posting.status !== 'EXPIRED' || observationWasLive) return posting.status;
    return posting.publishedAt ? 'LIVE' : 'PENDING_REVIEW';
}

// Pure. A LIVE or pending posting expires when none of its observations is live any more.
export function shouldExpire(posting, observations) {
    return EXPIRABLE.includes(posting.status) && observations.length > 0 && observations.every((o) => !o.isLive);
}

// After a successful run of an ATS source: every live observation of that source not in
// seenExternalIds counts a miss; at MISSED_RUNS_TO_DROP it stops being live, and postings with no
// live observation left expire. Returns { missed, dropped, expired }.
export async function applyMissedRuns(db, sourceId, seenExternalIds, now = new Date()) {
    const notSeen = { sourceId, isLive: true, externalId: { notIn: seenExternalIds } };
    const missed = await db.postingSource.updateMany({ where: notSeen, data: { missedRuns: { increment: 1 } } });
    if (missed.count === 0) return { missed: 0, dropped: 0, expired: 0 };

    const toDrop = await db.postingSource.findMany({
        where: { ...notSeen, missedRuns: { gte: MISSED_RUNS_TO_DROP } },
        select: { id: true, postingId: true },
    });
    if (!toDrop.length) return { missed: missed.count, dropped: 0, expired: 0 };
    await db.postingSource.updateMany({ where: { id: { in: toDrop.map((o) => o.id) } }, data: { isLive: false } });

    let expired = 0;
    const postings = await db.posting.findMany({
        where: { id: { in: [...new Set(toDrop.map((o) => o.postingId))] } },
        select: { id: true, status: true, observations: { select: { isLive: true } } },
    });
    for (const posting of postings) {
        if (!shouldExpire(posting, posting.observations)) continue;
        await db.posting.update({ where: { id: posting.id }, data: { status: 'EXPIRED' } });
        expired++;
    }
    if (expired) console.info(`[careers] liveness: source #${sourceId} expired ${expired} posting(s) (${now.toISOString()})`);
    return { missed: missed.count, dropped: toDrop.length, expired };
}
