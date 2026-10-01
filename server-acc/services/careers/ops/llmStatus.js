// The `llm` block of the operations summary: usage and limits from the database. Whether the
// provider is reachable is filled in by extract/providerStatus.js once the provider layer exists
// (P1-T10); until then reachability is unknown (null) and never raises an alert.
import prisma from '../../../config/db.js';
import { getSetting } from '../settings.js';

const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Start of the current IST day / month, as UTC instants.
export function istDayStart(now = new Date()) {
    const ist = new Date(now.getTime() + IST_OFFSET_MS);
    return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - IST_OFFSET_MS);
}

export function istMonthStart(now = new Date()) {
    const ist = new Date(now.getTime() + IST_OFFSET_MS);
    return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), 1) - IST_OFFSET_MS);
}

export async function llmStatus(now = new Date()) {
    const provider = process.env.LLM_PROVIDER || 'ollama';
    const [enabled, paidTier, budgetUsd, dailyLimit] = await Promise.all([
        getSetting('careers.llmEnabled'), getSetting('careers.llmPaidTier'),
        getSetting('careers.llmMonthlyBudgetUsd'), getSetting('careers.llmDailyRequestLimit'),
    ]);
    const [spend, todayRequests, skippedBudget, queued, failedLast24h, lastFailed] = await Promise.all([
        prisma.llmUsage.aggregate({ _sum: { costUsd: true }, where: { createdAt: { gte: istMonthStart(now) } } }),
        prisma.llmUsage.count({ where: { createdAt: { gte: istDayStart(now) } } }),
        prisma.extraction.count({ where: { state: 'SKIPPED_BUDGET' } }),
        prisma.extraction.count({ where: { state: 'QUEUED' } }),
        prisma.extraction.count({ where: { state: 'FAILED', updatedAt: { gte: new Date(now - DAY_MS) } } }),
        prisma.extraction.findFirst({ where: { error: { not: null } }, orderBy: { updatedAt: 'desc' }, select: { error: true } }),
    ]);
    const monthSpendUsd = Number(spend._sum.costUsd ?? 0);
    const budgetEnforced = provider === 'gemini' && paidTier;

    const status = { reachable: null, modelPresent: null, keyPresent: provider === 'gemini' ? Boolean(process.env.GEMINI_API_KEY) : null, lastError: lastFailed?.error ?? null };
    const usable = status.reachable === null ? null : Boolean(status.reachable && status.modelPresent !== false && status.keyPresent !== false);

    return {
        enabled, provider, ...status, usable, paidTier, budgetEnforced,
        monthSpendUsd, budgetUsd, pctUsed: budgetUsd > 0 ? Math.round((monthSpendUsd / budgetUsd) * 100) : null,
        todayRequests, dailyLimit: provider === 'gemini' ? dailyLimit : null,
        skippedBudget, queued, failedLast24h,
    };
}
