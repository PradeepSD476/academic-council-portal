import { randomUUID } from 'node:crypto';

const LEASE_MS = 15 * 60_000;
const leaseEnd = (now) => new Date(now.getTime() + LEASE_MS);
const deliveryWhere = (key) => ({ datasetId_roll_examDate: key });

export function prismaExamStore(prisma) {
    return {
        cache: {
            get: (datasetId, sourceKey) => prisma.examWorkbookCache.findUnique({ where: { datasetId_sourceKey: { datasetId, sourceKey } } }),
            put: (datasetId, sourceKey, workbook, fetchedAt) => prisma.examWorkbookCache.upsert({ where: { datasetId_sourceKey: { datasetId, sourceKey } }, create: { datasetId, sourceKey, workbook, fetchedAt }, update: { workbook, fetchedAt } }),
        },
        users: () => prisma.user.findMany({ select: { id: true, rollNo: true, email: true }, orderBy: { id: 'asc' } }),
        dueRuns: (datasetId, examDate, mode, now) => prisma.examReminderRun.findMany({ where: { datasetId, examDate, mode, OR: [{ status: 'WAITING', nextRunAt: { lte: now } }, { status: 'RUNNING', leaseUntil: { lte: now } }] }, orderBy: { startedAt: 'asc' } }),
        async claimRun({ id, datasetId, examDate, mode }, now) {
            // Same transaction-scoped advisory-lock convention as careers/jobLock.js, but only
            // protect the claim. Network work must not hold an open transaction for an hour.
            return prisma.$transaction(async (tx) => {
                const [{ locked }] = await tx.$queryRaw`SELECT pg_try_advisory_xact_lock(81007::bigint) AS locked`;
                if (!locked) return null;
                if (await tx.examReminderRun.findFirst({ where: { status: 'RUNNING', leaseUntil: { gt: now } } })) return null;
                await tx.examReminderRun.updateMany({ where: { status: 'RUNNING', leaseUntil: { lte: now } }, data: { status: 'WAITING', claimToken: null, leaseUntil: null, nextRunAt: now } });
                const row = await tx.examReminderRun.upsert({ where: { id }, create: { id, datasetId, examDate, mode, status: 'PENDING' }, update: {} });
                if (row.status === 'COMPLETE' || (row.nextRunAt && row.nextRunAt > now)) return null;
                return tx.examReminderRun.update({ where: { id }, data: { status: 'RUNNING', claimToken: randomUUID(), leaseUntil: leaseEnd(now), nextRunAt: null, attempts: { increment: 1 } } });
            });
        },
        async renewRun(run, now) {
            // Serialize renewals with global run acquisition: an expired owner cannot revive
            // its lease after another dataset/worker has claimed the sending pipeline.
            const result = await prisma.$transaction(async (tx) => {
                await tx.$queryRaw`SELECT pg_advisory_xact_lock(81007::bigint)::text AS locked`;
                return tx.examReminderRun.updateMany({ where: { id: run.id, claimToken: run.claimToken, status: 'RUNNING', leaseUntil: { gt: now } }, data: { leaseUntil: leaseEnd(now) } });
            });
            if (!result.count) throw new Error('Exam run lease lost');
        },
        async finishRun(run, summary, nextRunAt = null) {
            const result = await prisma.examReminderRun.updateMany({ where: { id: run.id, claimToken: run.claimToken }, data: { status: nextRunAt ? 'WAITING' : 'COMPLETE', summary: JSON.parse(JSON.stringify(summary)), nextRunAt, leaseUntil: null, claimToken: null, finishedAt: new Date() } });
            if (!result.count) throw new Error('Exam run lease lost while recording summary');
        },
        adminResult: (id, error) => prisma.examReminderRun.update({ where: { id }, data: { adminStatus: error ? 'FAILED' : 'SENT', adminError: error ? String(error).slice(0, 1000) : null } }),
        async claimDelivery(key, recipient, maxAttempts, now) {
            // Prisma can emulate an empty-update upsert with SELECT + INSERT, which races
            // on first use across clients. INSERT ... ON CONFLICT DO NOTHING is atomic.
            await prisma.examReminderDelivery.createMany({ data: [{ ...key, recipient }], skipDuplicates: true });
            const row = await prisma.examReminderDelivery.findUnique({ where: deliveryWhere(key) });
            if (['SENT', 'PERMANENT_FAILURE', 'EXHAUSTED'].includes(row.status)) return { skipped: row.status };
            if (row.status === 'SENDING' && row.leaseUntil > now) return { skipped: 'IN_PROGRESS', retryAt: row.leaseUntil };
            if (row.nextRetryAt > now) return { skipped: 'BACKOFF', retryAt: row.nextRetryAt };
            if (row.attempts >= maxAttempts) {
                await prisma.examReminderDelivery.updateMany({ where: { ...key, status: row.status, attempts: row.attempts, claimToken: row.claimToken, OR: [{ status: { not: 'SENDING' } }, { leaseUntil: { lte: now } }] }, data: { status: 'EXHAUSTED', leaseUntil: null, claimToken: null, uncertain: row.status === 'SENDING' || row.uncertain } });
                return { skipped: 'EXHAUSTED' };
            }
            const claimToken = randomUUID();
            const result = await prisma.examReminderDelivery.updateMany({ where: { ...key, status: row.status, attempts: row.attempts, claimToken: row.claimToken, OR: [{ status: { not: 'SENDING' } }, { leaseUntil: { lte: now } }] }, data: { status: 'SENDING', attempts: { increment: 1 }, claimToken, leaseUntil: leaseEnd(now), recipient, nextRetryAt: null, uncertain: row.status === 'SENDING' || row.uncertain } });
            return result.count ? { key, claimToken, attempts: row.attempts + 1 } : { skipped: 'IN_PROGRESS' };
        },
        async renewDelivery(claim, now) {
            const result = await prisma.examReminderDelivery.updateMany({ where: { ...claim.key, claimToken: claim.claimToken, status: 'SENDING', leaseUntil: { gt: now } }, data: { leaseUntil: leaseEnd(now) } });
            if (!result.count) throw new Error('Exam delivery lease lost');
        },
        async completeDelivery(claim, data) {
            const result = await prisma.examReminderDelivery.updateMany({ where: { ...claim.key, claimToken: claim.claimToken, status: 'SENDING' }, data: { ...data, leaseUntil: null, claimToken: null } });
            if (!result.count) throw new Error('Exam delivery lease lost while recording outcome');
        },
        deliveries: (datasetId, examDate) => prisma.examReminderDelivery.findMany({ where: { datasetId, examDate } }),
    };
}
