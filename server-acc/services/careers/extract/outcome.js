// What happens to an extraction after a model call (Architecture 8.1 "shared error handling" and
// 8.3 step 4). Pure, so every branch is unit-tested without a database or a model.
import { RETRYABLE, STOPS_RUN } from './llmError.js';

export const MAX_ATTEMPTS = 5;
const MINUTE = 60_000;

// 2^attempts x 5 min, at most 6 h: 10 min, 20 min, 40 min, 80 min, ...
export const backoffMs = (attempts) => Math.min(2 ** attempts * 5 * MINUTE, 6 * 60 * MINUTE);

// After the provider threw an LlmError. Returns
//   { extraction: update | null, submission: update | null, stopRun, alert: kind | null }
export function afterCallError(extraction, err, now = new Date()) {
    const kind = err.kind;
    const stopRun = STOPS_RUN.includes(kind);
    const alert = stopRun ? kind : null;
    if (kind === 'CONFIG') return { extraction: null, submission: null, stopRun: true, alert };

    const attempts = extraction.attempts + 1;
    if (RETRYABLE.includes(kind) && attempts < MAX_ATTEMPTS) {
        return {
            extraction: { attempts, nextAttemptAt: new Date(now.getTime() + backoffMs(attempts)), error: `${kind}: ${err.message}` },
            submission: null,
            stopRun,
            alert,
        };
    }
    const reason = RETRYABLE.includes(kind) ? `Gave up after ${attempts} attempts (${kind}): ${err.message}` : `${kind}: ${err.message}`;
    return {
        extraction: { attempts, state: 'FAILED', error: reason },
        submission: { status: 'FAILED', error: `Automatic extraction failed. ${reason}` },
        stopRun,
        alert,
    };
}

// After a call that answered. Returns null (go on) or the failure reason.
export function callResultProblem(result) {
    if (result.finishReason === 'LENGTH') return 'The model ran out of output space (finish reason LENGTH)';
    if (result.finishReason === 'BLOCKED') return 'The provider blocked the answer (finish reason BLOCKED)';
    if (!result.text) return `The model returned no text (finish reason ${result.finishReason})`;
    return null;
}

// After verification: 'NOT_JOB' | 'NO_TITLE' | 'ESCALATE' | 'APPLY'.
// "Not a job" needs both the model's flag and no role title in the page (verify.js keeps and flags
// the rest). Escalation only exists when a strong model is configured (none by default locally).
export function nextStep({ verified, tier, threshold, strongModel }) {
    if (!verified.fields.roleTitle) return verified.isJobPosting ? 'NO_TITLE' : 'NOT_JOB';
    if (verified.confidence < threshold && tier === 'LLM_FAST' && strongModel) return 'ESCALATE';
    return 'APPLY';
}
