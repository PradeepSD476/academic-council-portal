// The only entry point to a language model. Picks the provider from LLM_PROVIDER and the model from
// env, caps the input, and returns a provider-neutral CallResult. Nothing outside providers/ and
// this file names a vendor.
import * as ollama from './providers/ollama.js';
import { LlmError } from './llmError.js';
import { SYSTEM_PROMPT, userMessage } from './prompt.js';
import { EXTRACTION_SCHEMA } from './schema.js';

// Providers that exist. Gemini is added in P1-T10b (required before the final phase).
const PROVIDERS = { ollama };

export const providerName = () => (process.env.LLM_PROVIDER || 'ollama').toLowerCase();

export function provider() {
    const p = PROVIDERS[providerName()];
    if (!p) throw new LlmError('CONFIG', `LLM_PROVIDER=${providerName()} is not available yet (Gemini arrives with P1-T10b); use ollama`);
    return p;
}

// LLM_FAST -> the fast model (env or the provider default); LLM_STRONG -> only if configured, else null.
export function modelFor(tier) {
    if (tier === 'LLM_STRONG') return process.env.CAREERS_LLM_STRONG_MODEL?.trim() || null;
    return process.env.CAREERS_LLM_FAST_MODEL?.trim() || provider().DEFAULT_FAST_MODEL;
}

export function inputCap() {
    return provider().INPUT_CAP;
}

// Returns { ...CallResult, provider, truncated }. Throws LlmError.
export async function callModel(tier, pageText) {
    const p = provider();
    const model = modelFor(tier);
    if (!model) throw new LlmError('CONFIG', `No model configured for ${tier}`);
    const text = String(pageText ?? '');
    const truncated = text.length > p.INPUT_CAP;
    const result = await p.call({
        model,
        system: SYSTEM_PROMPT,
        user: userMessage(truncated ? text.slice(0, p.INPUT_CAP) : text),
        schema: EXTRACTION_SCHEMA,
    });
    return { ...result, provider: p.name, truncated };
}
