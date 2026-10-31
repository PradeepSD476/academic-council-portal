// P4-lite: a student's saved postings and application status. Both are private to the student and
// cascade away with the posting or the user.
import { z } from 'zod';
import prisma from '../../../config/db.js';

export const APPLICATION_STATUSES = ['INTERESTED', 'APPLIED', 'IN_PROGRESS', 'REJECTED', 'OFFER'];

// null removes the status.
export const applicationBody = z.object({ status: z.enum(APPLICATION_STATUSES).nullable() }).strict();

// P6-T10 (F-13): the student's own note on an application (plain text; rendered as text).
export const noteBody = z.object({ note: z.string().trim().max(500).nullable().transform((v) => v || null) }).strict();

// Statuses that mean the student has applied (Rejected = not selected after applying).
const APPLIED_STAGES = new Set(['APPLIED', 'IN_PROGRESS', 'OFFER', 'REJECTED']);

// Pure. The appliedAt to store: set once, when the status first reaches an applied stage.
export function appliedAtFor(current, status, now = new Date()) {
    if (current) return current;
    return APPLIED_STAGES.has(status) ? now : null;
}

// Postings the student saved or tracks an application for.
export const trackedBy = (userId) => ({
    OR: [{ saves: { some: { userId } } }, { applications: { some: { userId } } }],
});

// Statuses a student can still see once they saved or tracked a posting: an expired role stays in
// their list (labelled), a rejected or unpublished one does not.
export const TRACKABLE_STATUSES = ['LIVE', 'EXPIRED'];

// Adds `saved` and `applicationStatus` for this user to a page of cards: two queries for the whole page.
export async function withTracking(cards, userId, db = prisma) {
    if (!cards.length) return cards;
    const where = { userId, postingId: { in: cards.map((c) => c.id) } };
    const [saves, applications] = await Promise.all([
        db.savedPosting.findMany({ where, select: { postingId: true, createdAt: true } }),
        db.postingApplication.findMany({ where, select: { postingId: true, status: true, updatedAt: true, note: true, appliedAt: true } }),
    ]);
    const savedAt = new Map(saves.map((s) => [s.postingId, s.createdAt]));
    const apps = new Map(applications.map((a) => [a.postingId, a]));
    return cards.map((c) => ({
        ...c,
        saved: savedAt.has(c.id),
        applicationStatus: apps.get(c.id)?.status ?? null,
        applicationNote: apps.get(c.id)?.note ?? null, // P6-T10: only ever the caller's own
        appliedAt: apps.get(c.id)?.appliedAt ?? null,
        // When the student last touched it (saved or changed the status), for ordering the Saved page.
        trackedAt: latest(savedAt.get(c.id), apps.get(c.id)?.updatedAt),
    }));
}

function latest(a, b) {
    if (!a) return b ?? null;
    if (!b) return a;
    return a > b ? a : b;
}

// Saved page order: most recently touched first.
export const byTrackedAt = (a, b) => new Date(b.trackedAt ?? 0) - new Date(a.trackedAt ?? 0) || b.id - a.id;

