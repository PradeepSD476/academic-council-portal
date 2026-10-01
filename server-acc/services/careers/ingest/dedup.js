// Posting deduplication (Architecture 6.2 step 7). The same job often appears on several sources,
// or twice on one board; it must become one Posting with several PostingSource rows.
// isSamePosting and findPossibleDuplicates are pure; the DB helpers take the client as a parameter.
import { isNearDuplicate } from '../text/fingerprint.js';
import { similarity } from '../companies/matcher.js';

export const DEDUP_WINDOW_DAYS = 120;
export const TITLE_SIMILARITY_MIN = 0.8;
const MAX_REPORTED_PAIRS = 50;

const INTERN = /\bintern(ship)?\b/;

// a, b: { roleTitleNormalized, locationNormalized, contentFingerprint }
//   same normalised title and (same location or either unknown)
//   OR near-identical description (Hamming <= 3) and similar title (>= 0.8)
// An internship never matches a full-time role, whatever the description says.
export function isSamePosting(a, b) {
    const titleA = a?.roleTitleNormalized;
    const titleB = b?.roleTitleNormalized;
    if (!titleA || !titleB) return false;
    if (INTERN.test(titleA) !== INTERN.test(titleB)) return false;

    if (titleA === titleB) {
        const locA = a.locationNormalized ?? null;
        const locB = b.locationNormalized ?? null;
        if (locA === null || locB === null || locA === locB) return true;
    }
    return isNearDuplicate(a.contentFingerprint, b.contentFingerprint) && similarity(titleA, titleB) >= TITLE_SIMILARITY_MIN;
}

// Pairs of postings (same company) that look like the same job. Used after a company merge, where
// postings are only reported, never merged automatically.
export function findPossibleDuplicates(postings) {
    const pairs = [];
    for (let i = 0; i < postings.length; i++) {
        for (let j = i + 1; j < postings.length; j++) {
            if (!isSamePosting(postings[i], postings[j])) continue;
            pairs.push({
                postingIds: [postings[i].id, postings[j].id],
                roleTitles: [postings[i].roleTitle, postings[j].roleTitle],
            });
            if (pairs.length >= MAX_REPORTED_PAIRS) return pairs;
        }
    }
    return pairs;
}

const DEDUP_SELECT = {
    id: true, roleTitle: true, roleTitleNormalized: true, locationNormalized: true, contentFingerprint: true,
    status: true, publishedAt: true,
};

// Postings of one company that a new observation may belong to: not rejected, touched recently.
export async function findDuplicateCandidates(db, companyId, now = new Date()) {
    const since = new Date(now.getTime() - DEDUP_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    return db.posting.findMany({
        where: { companyId, status: { not: 'REJECTED' }, updatedAt: { gte: since } },
        select: DEDUP_SELECT,
        orderBy: { id: 'asc' },
    });
}

export async function findPossibleDuplicatesForCompany(db, companyId) {
    const postings = await db.posting.findMany({
        where: { companyId, status: { not: 'REJECTED' } },
        select: DEDUP_SELECT,
        orderBy: { id: 'asc' },
    });
    return findPossibleDuplicates(postings);
}
