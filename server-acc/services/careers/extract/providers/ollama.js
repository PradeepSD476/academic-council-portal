// Local model through Ollama (default provider). Nothing leaves the machine. Plain fetch, no SDK.
// Verified on the dev machine (29 Sep 2026): /api/chat honours `format` = JSON schema, including
// nullable types {"type": ["string", "null"]}.
import { LlmError } from '../llmError.js';

export const name = 'ollama';
export const DEFAULT_FAST_MODEL = 'qwen2.5:7b';
export const INPUT_CAP = 12_000; // characters; fits num_ctx 8192 with the prompt and the answer
const TIMEOUT_MS = 180_000;

export const baseUrl = () => (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/+$/, '');

const FINISH = { stop: 'STOP', length: 'LENGTH' };

// Returns CallResult { text, finishReason, usage: { inputTokens, outputTokens }, model }.
export async function call({ model, system, user, schema, signal }) {
    let res;
    try {
        res = await fetch(`${baseUrl()}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: signal ?? AbortSignal.timeout(TIMEOUT_MS),
            body: JSON.stringify({
                model,
                stream: false,
                options: { temperature: 0, num_ctx: 8192, num_predict: 1024 },
                format: schema,
                messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
            }),
        });
    } catch (err) {
        throw new LlmError('UNREACHABLE', `Ollama is not reachable at ${baseUrl()}: ${err.cause?.code ?? err.message}`);
    }

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        if (res.status === 404) throw new LlmError('MODEL_MISSING', `Model ${model} is not installed in Ollama (run: ollama pull ${model})`);
        if (res.status === 400) throw new LlmError('BAD_REQUEST', `Ollama rejected the request: ${body.slice(0, 200)}`);
        if (res.status === 429) throw new LlmError('RATE_LIMIT', 'Ollama is busy (429)');
        throw new LlmError('SERVER', `Ollama returned HTTP ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    return {
        text: data?.message?.content ?? null,
        finishReason: FINISH[data?.done_reason] ?? 'OTHER',
        usage: { inputTokens: data?.prompt_eval_count ?? 0, outputTokens: data?.eval_count ?? 0 },
        model: data?.model ?? model,
    };
}

// For the operations page: is Ollama up, and is the model pulled? 3 s timeout.
export async function status(model) {
    try {
        const res = await fetch(`${baseUrl()}/api/tags`, { signal: AbortSignal.timeout(3000) });
        if (!res.ok) return { reachable: false, modelPresent: null, lastError: `Ollama /api/tags returned HTTP ${res.status}` };
        const tags = await res.json();
        const names = (tags?.models ?? []).flatMap((m) => [m.name, m.model]);
        const modelPresent = names.includes(model) || names.includes(`${model}:latest`);
        return { reachable: true, modelPresent, lastError: modelPresent ? null : `Model ${model} is not pulled (ollama pull ${model})` };
    } catch (err) {
        return { reachable: false, modelPresent: null, lastError: `Ollama is not reachable at ${baseUrl()}: ${err.cause?.code ?? err.message}` };
    }
}
