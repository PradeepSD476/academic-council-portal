// Worker step after processSubmissions (Architecture 8.3): QUEUED extractions -> model -> verify ->
// posting. Calls are sequential. A provider problem (down, model missing, no key) stops the run and
// shows as a red alert on the operations page; the rows wait in the queue.
import prisma from '../../../config/db.js';
import { getSetting } from '../settings.js';
import { callModel, providerName, modelFor } from './callModel.js';
import { providerStatus, isUsable } from './providerStatus.js';
import { LlmError } from './llmError.js';
import { parseExtraction } from './schema.js';
import { verifyExtraction } from './verify.js';
import { costUsd } from './pricing.js';
import { canCall } from './budget.js';
import { afterCallError, callResultProblem, nextStep } from './outcome.js';
import { applyExtraction } from './applyExtraction.js';

const BATCH = { ollama: 5, default: 20 };
const GEMINI_PAUSE_MS = 4000;

async function fail(extraction, attempts, error, output = undefined) {
    await prisma.extraction.update({ where: { id: extraction.id }, data: { state: 'FAILED', attempts, error, ...(output ? { output } : {}) } });
    if (extraction.submissionId) {
        await prisma.linkSubmission.update({ where: { id: extraction.submissionId }, data: { status: 'FAILED', error: `Automatic extraction failed. ${error}` } });
    }
}

// Returns a summary { skipped?, called, applied, duplicates, failed, retried, escalated, stopped, alert }.
export async function runExtractions({ now = new Date() } = {}) {
    const summary = { called: 0, applied: 0, duplicates: 0, failed: 0, retried: 0, escalated: 0, stopped: null, alert: null };
    if (!(await getSetting('careers.llmEnabled'))) return { ...summary, skipped: 'careers.llmEnabled is off' };

    const status = await providerStatus();
    if (!isUsable(status)) {
        console.warn(`[careers] extraction paused: ${status.lastError}`);
        return { ...summary, skipped: status.lastError, alert: 'PROVIDER_UNUSABLE' };
    }

    const provider = providerName();
    const [threshold, paidTier] = await Promise.all([getSetting('careers.confidenceThreshold'), getSetting('careers.llmPaidTier')]);
    const rows = await prisma.extraction.findMany({
        where: { state: 'QUEUED', nextAttemptAt: { lte: now } },
        orderBy: { createdAt: 'asc' },
        take: BATCH[provider] ?? BATCH.default,
    });

    for (const [i, extraction] of rows.entries()) {
        const model = modelFor(extraction.tier);
        const budget = await canCall({ provider, model, inputChars: extraction.inputText.length, now });
        if (!budget.ok) {
            summary.stopped = budget.reason;
            if (budget.reason === 'BUDGET') {
                await prisma.extraction.updateMany({ where: { id: { in: rows.slice(i).map((r) => r.id) } }, data: { state: 'SKIPPED_BUDGET' } });
            }
            break;
        }

        const started = Date.now();
        let result;
        try {
            result = await callModel(extraction.tier, extraction.inputText);
        } catch (err) {
            if (!(err instanceof LlmError)) throw err;
            const plan = afterCallError(extraction, err, now);
            if (plan.extraction) await prisma.extraction.update({ where: { id: extraction.id }, data: plan.extraction });
            if (plan.submission && extraction.submissionId) await prisma.linkSubmission.update({ where: { id: extraction.submissionId }, data: plan.submission });
            if (plan.extraction?.state === 'FAILED') summary.failed++;
            else if (plan.extraction) summary.retried++;
            console.warn(`[careers] extraction #${extraction.id}: ${err.kind} ${err.message}`);
            if (plan.stopRun) {
                summary.stopped = err.kind;
                summary.alert = plan.alert;
                break;
            }
            continue;
        }

        summary.called++;
        const attempts = extraction.attempts + 1;
        const cost = costUsd({ provider, model: result.model, usage: result.usage, paidTier });
        if (cost === null) console.error(`[careers] no price known for paid model ${result.model}; cost recorded as 0`);
        await prisma.llmUsage.create({
            data: {
                model: result.model, provider, purpose: extraction.tier === 'LLM_STRONG' ? 'escalate' : 'extract',
                inputTokens: result.usage.inputTokens, outputTokens: result.usage.outputTokens, costUsd: cost ?? 0, extractionId: extraction.id,
            },
        });
        console.info(`[careers] extraction #${extraction.id}: ${result.model} answered in ${((Date.now() - started) / 1000).toFixed(1)} s (${result.usage.inputTokens} in / ${result.usage.outputTokens} out tokens)`);

        const problem = callResultProblem(result);
        if (problem) {
            await fail(extraction, attempts, problem);
            summary.failed++;
            continue;
        }
        let output;
        try {
            output = parseExtraction(result.text);
        } catch (err) {
            await fail(extraction, attempts, err.message);
            summary.failed++;
            continue;
        }

        const verified = verifyExtraction(output, extraction.inputText, { provider });
        const step = nextStep({ verified, tier: extraction.tier, threshold, strongModel: modelFor('LLM_STRONG') });
        const done = { state: 'DONE', attempts, model: result.model, output: { model: output, verified }, confidence: verified.confidence, error: null };

        if (step === 'NOT_JOB' || step === 'NO_TITLE') {
            const reason = step === 'NOT_JOB' ? 'The page does not look like a single job or internship posting.' : 'No role title could be found in the page.';
            await fail(extraction, attempts, reason, done.output);
            summary.failed++;
        } else if (step === 'ESCALATE') {
            await prisma.extraction.update({ where: { id: extraction.id }, data: done });
            await prisma.extraction.create({
                data: { submissionId: extraction.submissionId, tier: 'LLM_STRONG', inputText: extraction.inputText, inputTruncated: extraction.inputTruncated, sourceUrl: extraction.sourceUrl },
            });
            summary.escalated++;
        } else {
            const submission = await prisma.linkSubmission.findUnique({ where: { id: extraction.submissionId } });
            const saved = await applyExtraction({ submission, extraction, verified, provider });
            await prisma.extraction.update({ where: { id: extraction.id }, data: { ...done, postingId: saved.postingId } });
            await prisma.linkSubmission.update({ where: { id: submission.id }, data: { status: saved.status, postingId: saved.postingId, error: null } });
            if (saved.status === 'DUPLICATE') summary.duplicates++;
            else summary.applied++;
        }

        if (provider === 'gemini' && i < rows.length - 1) await new Promise((r) => setTimeout(r, GEMINI_PAUSE_MS));
    }
    if (rows.length) console.info(`[careers] extractions: ${JSON.stringify(summary)}`);
    return summary;
}
