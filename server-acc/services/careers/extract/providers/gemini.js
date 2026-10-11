// Gemini (Google AI, cloud): the provider for the final phase (P1-T10b). Plain fetch against the
// generateContent REST endpoint, no SDK (no new dependency; same shape as groq.js). Job-page text
// leaves the machine, so never send personal data through it. Built and unit-tested without a key
// (11 Oct 2026); the live check (nullable schema form, the three smoke pages) waits for GEMINI_API_KEY.
// Never use gemini-2.0-* (shut down), gemini-2.5-* (restricted) or the moving *-latest aliases.
import { LlmError } from '../llmError.js';

export const name = 'gemini';
export const cloud = true;
export const keyEnv = 'GEMINI_API_KEY';
export const DEFAULT_FAST_MODEL = 'gemini-3.1-flash-lite';
export const INPUT_CAP = 40_000; // characters
export const PAUSE_MS = 4000; // between calls in one run (free-tier requests per minute)
const TIMEOUT_MS = 60_000;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

const key = () => process.env.GEMINI_API_KEY?.trim() || '';
const FINISH = { STOP: 'STOP', MAX_TOKENS: 'LENGTH', SAFETY: 'BLOCKED', RECITATION: 'BLOCKED', BLOCKLIST: 'BLOCKED', PROHIBITED_CONTENT: 'BLOCKED', SPII: 'BLOCKED' };

// Pure: the request body (exported for tests). The schema goes in as plain JSON Schema
// (responseJsonSchema), which accepts nullable fields as {"type": ["string", "null"]}.
export function requestBody({ system, user, schema }) {
    return {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { responseMimeType: 'application/json', responseJsonSchema: schema, temperature: 0, maxOutputTokens: 2048 },
    };
}

// Pure: response JSON → CallResult (exported for tests). Thinking tokens are billed as output.
export function toCallResult(data, model) {
    const blocked = data?.promptFeedback?.blockReason;
    const candidate = data?.candidates?.[0];
    const text = (candidate?.content?.parts ?? []).filter((p) => !p.thought && typeof p.text === 'string').map((p) => p.text).join('') || null;
    const usage = data?.usageMetadata ?? {};
    return {
        text: blocked ? null : text,
        finishReason: blocked ? 'BLOCKED' : (FINISH[candidate?.finishReason] ?? 'OTHER'),
        usage: { inputTokens: usage.promptTokenCount ?? 0, outputTokens: (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0) },
        model: data?.modelVersion ?? model,
    };
}

// Pure: HTTP status → LlmError kind (exported for tests). Gemini answers a bad key with HTTP 400
// (API_KEY_INVALID), so that case is AUTH, not BAD_REQUEST. Never includes the key.
export function errorFor(status, body, model) {
    const detail = String(body ?? '').slice(0, 200);
    if (status === 401 || status === 403 || /API_KEY_INVALID|API key not valid/i.test(detail)) return new LlmError('AUTH', `Gemini refused the API key (HTTP ${status}). Check GEMINI_API_KEY.`);
    if (status === 404) return new LlmError('MODEL_MISSING', `Gemini has no model ${model} for this key.`);
    if (status === 429) return new LlmError('RATE_LIMIT', 'Gemini rate limit or quota reached (429); retrying later.');
    if (status === 400) return new LlmError('BAD_REQUEST', `Gemini rejected the request (HTTP 400): ${detail}`);
    return new LlmError('SERVER', `Gemini returned HTTP ${status}: ${detail}`);
}

export async function call({ model, system, user, schema, signal }) {
    if (!key()) throw new LlmError('CONFIG', 'GEMINI_API_KEY is not set.');
    let res;
    try {
        res = await fetch(`${BASE_URL}/models/${model}:generateContent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key() },
            signal: signal ?? AbortSignal.timeout(TIMEOUT_MS),
            body: JSON.stringify(requestBody({ system, user, schema })),
        });
    } catch (err) {
        throw new LlmError('UNREACHABLE', `Gemini is not reachable: ${err.cause?.code ?? err.name ?? err.message}`);
    }
    if (!res.ok) throw errorFor(res.status, await res.text().catch(() => ''), model);
    return toCallResult(await res.json(), model);
}

// For the operations page: key set, Gemini reachable, model available. 3 s timeout.
export async function status(model) {
    if (!key()) return { reachable: null, modelPresent: null, keyPresent: false, lastError: 'GEMINI_API_KEY is not set.' };
    try {
        const res = await fetch(`${BASE_URL}/models/${model}`, { headers: { 'x-goog-api-key': key() }, signal: AbortSignal.timeout(3000) });
        if (res.ok) return { reachable: true, modelPresent: true, keyPresent: true, lastError: null };
        const err = errorFor(res.status, await res.text().catch(() => ''), model);
        if (err.kind === 'AUTH') return { reachable: true, modelPresent: null, keyPresent: false, lastError: err.message };
        if (err.kind === 'MODEL_MISSING') return { reachable: true, modelPresent: false, keyPresent: true, lastError: err.message };
        return { reachable: false, modelPresent: null, keyPresent: true, lastError: err.message };
    } catch (err) {
        return { reachable: false, modelPresent: null, keyPresent: true, lastError: `Gemini is not reachable: ${err.cause?.code ?? err.name ?? err.message}` };
    }
}
