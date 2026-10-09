// Saves one relevant ATS posting (Architecture 6.2 step 7), in this order:
//   1. seen before on this source      -> only refresh liveness; admin-approved fields are never overwritten
//   2. same job already known (dedup)   -> attach this source as another observation
//   3. otherwise                        -> new PENDING_REVIEW posting
// Returns { outcome: 'seen' | 'duplicate' | 'new', postingId }.
import { isSamePosting, findDuplicateCandidates } from './dedup.js';
import { statusWhenSeen } from './liveness.js';

const SHOWS_AS_LIVE = ['LIVE', 'PENDING_REVIEW'];

function refreshPosting(posting, observationWasLive, now) {
    const status = statusWhenSeen(posting, observationWasLive, now);
    const data = {};
    if (status !== posting.status) data.status = status;
    if (SHOWS_AS_LIVE.includes(status)) data.lastSeenLiveAt = now;
    return data;
}

// db: the Prisma client; data: output of buildPostingData.
export async function upsertPosting(db, { sourceId, raw, data, now = new Date() }) {
    return db.$transaction(async (tx) => {
        const observation = await tx.postingSource.findUnique({
            where: { sourceId_externalId: { sourceId, externalId: raw.externalId } },
            select: { id: true, isLive: true, posting: { select: { id: true, status: true, publishedAt: true, deadlineStated: true } } },
        });

        if (observation) {
            await tx.postingSource.update({
                where: { id: observation.id },
                data: { lastSeenAt: now, isLive: true, missedRuns: 0 },
            });
            const update = refreshPosting(observation.posting, observation.isLive, now);
            if (Object.keys(update).length) await tx.posting.update({ where: { id: observation.posting.id }, data: update });
            return { outcome: 'seen', postingId: observation.posting.id };
        }

        const newObservation = { sourceId, externalId: raw.externalId, url: raw.url, firstSeenAt: now, lastSeenAt: now };

        const candidates = await findDuplicateCandidates(tx, data.companyId, now);
        const match = candidates.find((candidate) => isSamePosting(candidate, data));
        if (match) {
            await tx.postingSource.create({ data: { ...newObservation, postingId: match.id } });
            const update = refreshPosting(match, false, now);
            if (Object.keys(update).length) await tx.posting.update({ where: { id: match.id }, data: update });
            return { outcome: 'duplicate', postingId: match.id };
        }

        const posting = await tx.posting.create({
            data: {
                ...data,
                status: 'PENDING_REVIEW',
                firstSeenAt: now,
                lastSeenLiveAt: now,
                observations: { create: newObservation },
            },
            select: { id: true },
        });
        return { outcome: 'new', postingId: posting.id };
    });
}
