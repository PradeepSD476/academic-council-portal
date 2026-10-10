// Admin: operations summary (Architecture 10): worker, sources, queues, LLM usage, alerts.
import prisma from '../../config/db.js';
import { sendError } from '../../services/careers/errors.js';
import { getSetting, clearSettingsCache } from '../../services/careers/settings.js';
import { reviewWhere } from '../../services/careers/postings/reviewService.js';
import { computeAlerts, workerStatus } from '../../services/careers/ops/alerts.js';
import { llmStatus } from '../../services/careers/ops/llmStatus.js';
import { needsPersonCounts } from '../../services/careers/links/waiting.js';
import { sourceQuality, QUALITY_DAYS } from '../../services/careers/sources/quality.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export const getOps = async (req, res) => {
    try {
        clearSettingsCache(); // the heartbeat is written by the worker process
        const now = new Date();
        const [heartbeat, threshold] = await Promise.all([getSetting('careers.workerHeartbeat'), getSetting('careers.confidenceThreshold')]);
        const worker = workerStatus(heartbeat, now);

        // Archived sources (P6-T11) are not part of the health numbers.
        const list = await prisma.source.findMany({
            where: { archivedAt: null },
            select: { id: true, name: true, kind: true, boardToken: true, isEnabled: true, health: true, lastRunAt: true, lastSuccessAt: true, lastFetchedCount: true, lastKeptCount: true, lastError: true },
            orderBy: { id: 'asc' },
        });
        const ats = list.filter((s) => s.boardToken !== null);
        const countHealth = (h) => ats.filter((s) => s.health === h).length;
        const quality = await sourceQuality(prisma, now);
        const sources = {
            total: ats.length, ok: countHealth('OK'), failing: countHealth('FAILING'), zeroResults: countHealth('ZERO_RESULTS'), disabled: countHealth('DISABLED'),
            list: ats.map((s) => ({ ...s, quality: quality[s.id] ?? null })), qualityDays: QUALITY_DAYS,
        };

        const submissionCount = (status) => prisma.linkSubmission.count({ where: { status } });
        const [pending, flagged, candidates, received, extracting, failed, storedOnly, live, expiredLast7d, newLast24h, llm] = await Promise.all([
            prisma.posting.count({ where: reviewWhere('pending', threshold) }),
            prisma.posting.count({ where: reviewWhere('flagged', threshold) }),
            prisma.company.count({ where: { status: 'CANDIDATE' } }),
            submissionCount('RECEIVED'),
            submissionCount('EXTRACTING'),
            submissionCount('FAILED'),
            submissionCount('STORED_ONLY'),
            prisma.posting.count({ where: { status: 'LIVE' } }),
            prisma.posting.count({ where: { status: 'EXPIRED', updatedAt: { gte: new Date(now - 7 * DAY_MS) } } }),
            prisma.posting.count({ where: { firstSeenAt: { gte: new Date(now - DAY_MS) } } }),
            llmStatus(now),
        ]);
        const waiting = await needsPersonCounts(llm.enabled && llm.usable === true, now);
        // P6-T7: LIVE postings that students reported REPORT_FLAG_AT or more times (still open).
        const reported = await prisma.posting.count({ where: { status: 'LIVE', uncertainFields: { has: 'reported' } } });
        // P7-T1: active job alerts whose last digest could not be sent.
        const alertEmailsFailing = await prisma.savedSearch.count({ where: { unsubscribedAt: null, lastError: { not: null } } });
        const queue = { pending, flagged, candidates, reported, alertEmailsFailing, submissions: { received, extracting, failed, storedOnly, ...waiting } };
        const postings = { live, expiredLast7d, newLast24h };
        const alerts = computeAlerts({ worker, sources, queue, llm });

        return res.json({ success: true, data: { worker, sources, queue, llm, postings, alerts, generatedAt: now.toISOString() } });
    } catch (err) {
        return sendError(res, err, 'getOps');
    }
};
