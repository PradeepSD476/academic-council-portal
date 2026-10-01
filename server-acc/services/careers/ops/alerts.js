// Operations alerts (Architecture 10). Pure: computed from the ops summary on every request, never
// stored. "Loud failure": anything that silently stops postings arriving must show up here.
export const WORKER_STALE_MINUTES = 20;
export const FLAGGED_AMBER = 50;

export function minutesSince(iso, now = new Date()) {
    if (!iso) return null;
    return Math.floor((now.getTime() - new Date(iso).getTime()) / 60000);
}

// summary: { worker, sources, queue, llm } as built by the ops controller.
export function computeAlerts({ worker, sources, queue, llm }) {
    const alerts = [];
    const red = (code, message) => alerts.push({ level: 'red', code, message });
    const amber = (code, message) => alerts.push({ level: 'amber', code, message });

    if (worker.stale) {
        red('WORKER_STALE', worker.lastHeartbeatAt
            ? `The worker has not reported for ${worker.minutesSince} minutes. No sources are being fetched.`
            : 'The worker has never reported. Start it (npm run worker / the fetcher-acc container).');
    }
    for (const s of sources.list.filter((x) => x.health === 'FAILING')) {
        red('SOURCE_FAILING', `${s.name} is failing: ${s.lastError ?? 'unknown error'}`);
    }
    if (llm.enabled && llm.usable === false) {
        red('LLM_UNAVAILABLE', `LLM extraction is on but ${llm.provider} is not usable: ${llm.lastError ?? 'unknown reason'}. Links wait as QUEUED.`);
    }
    if (llm.budgetEnforced && llm.pctUsed !== null && llm.pctUsed >= 100) {
        red('LLM_BUDGET_REACHED', `The monthly LLM budget ($${llm.budgetUsd}) is used up. Extraction is paused until next month.`);
    } else if (llm.budgetEnforced && llm.pctUsed !== null && llm.pctUsed >= 80) {
        amber('LLM_BUDGET_80', `${llm.pctUsed}% of the monthly LLM budget is used.`);
    }

    for (const s of sources.list.filter((x) => x.health === 'ZERO_RESULTS')) {
        amber('SOURCE_ZERO_RESULTS', `${s.name} returned 0 jobs on its last run. Check that the board still exists.`);
    }
    if (queue.flagged > FLAGGED_AMBER) amber('FLAGGED_BACKLOG', `${queue.flagged} postings are waiting in Flagged.`);
    if (queue.submissions.failed > 0) amber('SUBMISSIONS_FAILED', `${queue.submissions.failed} student link(s) failed to process.`);
    return alerts;
}
