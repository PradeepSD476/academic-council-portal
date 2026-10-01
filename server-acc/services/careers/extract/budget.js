// May we make another model call? (Architecture 8.3)
//   ollama          -> always (local, free)
//   gemini          -> under the daily request cap (protects the free-tier quota)
//   gemini + paid   -> also under the monthly USD budget (IST calendar month)
import prisma from '../../../config/db.js';
import { getSetting } from '../settings.js';
import { istDayStart, istMonthStart } from '../ops/llmStatus.js';
import { estimateCostUsd } from './pricing.js';

// Pure. Returns { ok: true } or { ok: false, reason: 'DAILY_LIMIT' | 'BUDGET' }.
export function budgetDecision({ provider, todayRequests, dailyLimit, paidTier, monthSpendUsd, budgetUsd, estimateUsd }) {
    if (provider !== 'gemini') return { ok: true };
    if (todayRequests >= dailyLimit) return { ok: false, reason: 'DAILY_LIMIT' };
    if (paidTier && monthSpendUsd + estimateUsd > budgetUsd) return { ok: false, reason: 'BUDGET' };
    return { ok: true };
}

export async function canCall({ provider, model, inputChars, now = new Date() }) {
    if (provider !== 'gemini') return { ok: true };
    const [dailyLimit, paidTier, budgetUsd, todayRequests, spend] = await Promise.all([
        getSetting('careers.llmDailyRequestLimit'), getSetting('careers.llmPaidTier'), getSetting('careers.llmMonthlyBudgetUsd'),
        prisma.llmUsage.count({ where: { createdAt: { gte: istDayStart(now) } } }),
        prisma.llmUsage.aggregate({ _sum: { costUsd: true }, where: { createdAt: { gte: istMonthStart(now) } } }),
    ]);
    return budgetDecision({
        provider, todayRequests, dailyLimit, paidTier, budgetUsd,
        monthSpendUsd: Number(spend._sum.costUsd ?? 0),
        estimateUsd: estimateCostUsd({ provider, model, inputChars, paidTier }),
    });
}
