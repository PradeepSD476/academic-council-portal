// The `llm` block of the operations summary: usage and limits from the database, plus a live check
// of the provider (extract/providerStatus.js). The live check only runs while extraction is
// enabled, so a machine without a model never shows a red alert for a feature that is off.
import prisma from '../../../config/db.js';
import { getSetting } from '../settings.js';
import { providerStatus, isUsable } from '../extract/providerStatus.js';

import { istDayStart, istMonthStart } from '../istDate.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// Start of the current IST day / month (moved to istDate.js; still exported here for existing imports).
export { istDayStart, istMonthStart };

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

    let status = { reachable: null, modelPresent: null, keyPresent: provider === 'gemini' ? Boolean(process.env.GEMINI_API_KEY) : null, lastError: lastFailed?.error ?? null };
    let usable = null;
    if (enabled) {
        const live = await providerStatus();
        status = { ...status, ...live, lastError: live.lastError ?? status.lastError };
        usable = isUsable(live);
    }

    return {
        enabled, provider, ...status, usable, paidTier, budgetEnforced,
        monthSpendUsd, budgetUsd, pctUsed: budgetUsd > 0 ? Math.round((monthSpendUsd / budgetUsd) * 100) : null,
        todayRequests, dailyLimit: provider === 'gemini' ? dailyLimit : null,
        skippedBudget, queued, failedLast24h,
    };
}
