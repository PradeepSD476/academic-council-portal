// Groq (cloud, OpenAI-compatible API): the testing stand-in for Gemini (user's choice, 11 Oct 2026).
// Plain fetch, no SDK. Job-page text leaves the machine, so never send personal data through it.
// Default model openai/gpt-oss-120b: the strongest text model on the free tier, with strict JSON
// schema output (constrained decoding). Free tier (checked 11 Oct 2026): 30 requests / min, 1,000 /
// day, 8K tokens / min, 200K / day, so calls are paced (PAUSE_MS) and the daily request cap applies.
import { LlmError } from '../llmError.js';

export const name = 'groq';
export const cloud = true;
export const keyEnv = 'GROQ_API_KEY';
export const DEFAULT_FAST_MODEL = 'openai/gpt-oss-120b';
export const INPUT_CAP = 12_000; // characters (~3K tokens), so one call stays well under 8K tokens / min
export const PAUSE_MS = 20_000; // between calls in one run: about 3 calls a minute
const TIMEOUT_MS = 60_000;
const BASE_URL = 'https://api.groq.com/openai/v1';

const FINISH = { stop: 'STOP', length: 'LENGTH' };
const key = () => process.env.GROQ_API_KEY?.trim() || '';

// Pure: the request body (exported for tests).
export function requestBody({ model, system, user, schema }) {
    return {
        model,
        temperature: 0,
        max_completion_tokens: 2048,
        // gpt-oss models think before answering; keep it short and out of the reply.
        ...(model.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low', include_reasoning: false } : {}),
        response_format: { type: 'json_schema', json_schema: { name: 'posting_extraction', strict: true, schema } },
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    };
}

// Pure: HTTP status → LlmError kind (exported for tests). Never includes the key.
export function errorFor(status, body, model) {
    const detail = String(body ?? '').slice(0, 200);
    if (status === 401 || status === 403) return new LlmError('AUTH', `Groq refused the API key (HTTP ${status}). Check GROQ_API_KEY.`);
    if (status === 404) return new LlmError('MODEL_MISSING', `Groq has no model ${model} for this key.`);
    if (status === 429) return new LlmError('RATE_LIMIT', 'Groq free-tier limit reached (429); retrying later.');
    if (status === 400 || status === 413 || status === 422) return new LlmError('BAD_REQUEST', `Groq rejected the request (HTTP ${status}): ${detail}`);
    return new LlmError('SERVER', `Groq returned HTTP ${status}: ${detail}`);
}

// Returns CallResult { text, finishReason, usage: { inputTokens, outputTokens }, model }.
export async function call({ model, system, user, schema, signal }) {
    if (!key()) throw new LlmError('CONFIG', 'GROQ_API_KEY is not set.');
    let res;
    try {
        res = await fetch(`${BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key()}` },
            signal: signal ?? AbortSignal.timeout(TIMEOUT_MS),
            body: JSON.stringify(requestBody({ model, system, user, schema })),
        });
    } catch (err) {
        throw new LlmError('UNREACHABLE', `Groq is not reachable: ${err.cause?.code ?? err.name ?? err.message}`);
    }
    if (!res.ok) throw errorFor(res.status, await res.text().catch(() => ''), model);

    const data = await res.json();
    const choice = data?.choices?.[0];
    return {
        text: choice?.message?.content ?? null,
        finishReason: FINISH[choice?.finish_reason] ?? 'OTHER',
        usage: { inputTokens: data?.usage?.prompt_tokens ?? 0, outputTokens: data?.usage?.completion_tokens ?? 0 },
        model: data?.model ?? model,
    };
}

// For the operations page: key set, Groq reachable, model available to this key. 3 s timeout.
export async function status(model) {
    if (!key()) return { reachable: null, modelPresent: null, keyPresent: false, lastError: 'GROQ_API_KEY is not set.' };
    try {
        // The model list, not /models/{id}: ids such as openai/gpt-oss-120b contain a slash.
        const res = await fetch(`${BASE_URL}/models`, { headers: { Authorization: `Bearer ${key()}` }, signal: AbortSignal.timeout(3000) });
        if (res.status === 401 || res.status === 403) return { reachable: true, modelPresent: null, keyPresent: false, lastError: `Groq refused the API key (HTTP ${res.status}).` };
        if (!res.ok) return { reachable: false, modelPresent: null, keyPresent: true, lastError: `Groq /models returned HTTP ${res.status}` };
        const ids = ((await res.json())?.data ?? []).filter((m) => m.active !== false).map((m) => m.id);
        if (!ids.includes(model)) return { reachable: true, modelPresent: false, keyPresent: true, lastError: `Groq has no model ${model} for this key.` };
        return { reachable: true, modelPresent: true, keyPresent: true, lastError: null };
    } catch (err) {
        return { reachable: false, modelPresent: null, keyPresent: true, lastError: `Groq is not reachable: ${err.cause?.code ?? err.name ?? err.message}` };
    }
}
