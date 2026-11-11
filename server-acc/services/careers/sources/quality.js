// Per-source quality (P6-T1, F-23): of the postings a board brought in over the last 30 days, how
// many an admin approved, rejected or has not reviewed yet. Noisy boards stand out and can be
// disabled. A posting seen on two boards counts for both.
export const QUALITY_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

// Pure. rows: [{ sourceId, posting: { status, publishedAt } }] -> { [sourceId]: { kept, approved, rejected, pending } }
// approved = went live at some point and was not rejected later; the rest of `kept` expired before review.
export function qualityFrom(rows) {
    const out = {};
    for (const { sourceId, posting } of rows) {
        const q = (out[sourceId] ??= { kept: 0, approved: 0, rejected: 0, pending: 0 });
        q.kept++;
        if (posting.status === 'REJECTED') q.rejected++;
        else if (posting.status === 'PENDING_REVIEW') q.pending++;
        else if (posting.publishedAt) q.approved++;
    }
    return out;
}

export async function sourceQuality(prisma, now = new Date()) {
    const rows = await prisma.postingSource.findMany({
        where: { firstSeenAt: { gte: new Date(now.getTime() - QUALITY_DAYS * DAY_MS) }, source: { boardToken: { not: null } } },
        select: { sourceId: true, posting: { select: { status: true, publishedAt: true } } },
    });
    return qualityFrom(rows);
}
