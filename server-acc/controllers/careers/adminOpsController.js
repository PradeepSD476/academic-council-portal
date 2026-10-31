// Admin: operations summary (Architecture 10): worker, sources, queues, LLM usage, alerts.
import prisma from '../../config/db.js';
import { sendError } from '../../services/careers/errors.js';
import { getSetting, clearSettingsCache } from '../../services/careers/settings.js';
import { reviewWhere } from '../../services/careers/postings/reviewService.js';
import { computeAlerts, workerStatus } from '../../services/careers/ops/alerts.js';
import { llmStatus } from '../../services/careers/ops/llmStatus.js';
import { needsPersonCounts } from '../../services/careers/links/waiting.js';
import { sourceQuality, QUALITY_DAYS } from '../../services/careers/sources/quality.js';
import { usageQuery, usageSummary } from '../../services/careers/usage/usage.js';
import { ALERT_AFTER_HOURS } from '../../services/careers/ops/reviewReminder.js';
import { activityQuery, activityLog } from '../../services/careers/ops/activityLog.js';

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

        // B-44: dismissed / withdrawn links are dealt with, so they never keep an alert on.
        const submissionCount = (status) => prisma.linkSubmission.count({ where: { status, dismissedAt: null } });
        const [pending, flagged, candidates, received, extracting, failed, storedOnly, live, expiredLast7d, newLast24h, llm] = await Promise.all([
            prisma.posting.count({ where: reviewWhere('pending', threshold) }),
            prisma.posting.count({ where: reviewWhere('flagged', threshold) }),
            prisma.company.count({ where: { status: 'CANDIDATE', rejectedAt: null } }),
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
        // P7-T5: postings waiting for review longer than ALERT_AFTER_HOURS, and the last reminder email.
        const reviewOverdue = await prisma.posting.count({ where: { status: 'PENDING_REVIEW', firstSeenAt: { lt: new Date(now - ALERT_AFTER_HOURS * 3600 * 1000) } } });
        const reminder = await getSetting('careers.reviewReminderStatus');
        const queue = { pending, flagged, candidates, reported, alertEmailsFailing, reviewOverdue, reminder, submissions: { received, extracting, failed, storedOnly, ...waiting } };
        const postings = { live, expiredLast7d, newLast24h };
        const alerts = computeAlerts({ worker, sources, queue, llm });

        return res.json({ success: true, data: { worker, sources, queue, llm, postings, alerts, generatedAt: now.toISOString() } });
    } catch (err) {
        return sendError(res, err, 'getOps');
    }
};

// GET /careers/admin/usage?weeks=8 (P7-T4, F-30): weekly aggregate counts, newest week first.
export const getUsage = async (req, res) => {
    try {
        const { weeks } = usageQuery.parse(req.query);
        const data = await usageSummary(prisma, { weeks });
        return res.json({ success: true, data });
    } catch (err) {
        return sendError(res, err, 'getUsage');
    }
};

// GET /careers/admin/activity (P7-T12, F-15): read-only log of posting reviews and company merges.
export const getActivity = async (req, res) => {
    try {
        const result = await activityLog(prisma, activityQuery.parse(req.query));
        return res.json({ success: true, ...result });
    } catch (err) {
        return sendError(res, err, 'getActivity');
    }
};
