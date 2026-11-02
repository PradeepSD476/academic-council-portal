import { describe, it, expect } from 'vitest';
import { requestBody, errorFor, DEFAULT_FAST_MODEL } from '../../services/careers/extract/providers/groq.js';
import { budgetDecision } from '../../services/careers/extract/budget.js';
import { isCloud } from '../../services/careers/extract/callModel.js';
import { EXTRACTION_SCHEMA } from '../../services/careers/extract/schema.js';

describe('Groq provider (testing stand-in for Gemini)', () => {
    it('defaults to the strongest free-tier text model', () => {
        expect(DEFAULT_FAST_MODEL).toBe('openai/gpt-oss-120b');
    });
    it('asks for strict JSON-schema output, temperature 0, low reasoning kept out of the reply', () => {
        const b = requestBody({ model: 'openai/gpt-oss-120b', system: 'S', user: 'U', schema: EXTRACTION_SCHEMA });
        expect(b.response_format).toEqual({ type: 'json_schema', json_schema: { name: 'posting_extraction', strict: true, schema: EXTRACTION_SCHEMA } });
        expect(b).toMatchObject({ temperature: 0, reasoning_effort: 'low', include_reasoning: false });
        expect(b.messages).toEqual([{ role: 'system', content: 'S' }, { role: 'user', content: 'U' }]);
        expect(requestBody({ model: 'qwen/qwen3.8-27b', system: 'S', user: 'U', schema: {} })).not.toHaveProperty('reasoning_effort');
    });
    it('maps HTTP errors to the shared kinds (never echoing the key)', () => {
        expect(errorFor(401, '', 'm').kind).toBe('AUTH');
        expect(errorFor(404, '', 'm').kind).toBe('MODEL_MISSING');
        expect(errorFor(429, '', 'm').kind).toBe('RATE_LIMIT');
        expect(errorFor(400, 'json_validate_failed', 'm').kind).toBe('BAD_REQUEST');
        expect(errorFor(413, '', 'm').kind).toBe('BAD_REQUEST');
        expect(errorFor(503, '', 'm').kind).toBe('SERVER');
    });
    it('is a cloud provider: the daily request cap applies, the paid budget does not', () => {
        expect(isCloud('groq')).toBe(true);
        expect(isCloud('ollama')).toBe(false);
        const base = { provider: 'groq', dailyLimit: 200, paidTier: false, monthSpendUsd: 0, budgetUsd: 0, estimateUsd: 0 };
        expect(budgetDecision({ ...base, todayRequests: 199 })).toEqual({ ok: true });
        expect(budgetDecision({ ...base, todayRequests: 200 })).toEqual({ ok: false, reason: 'DAILY_LIMIT' });
        expect(budgetDecision({ ...base, provider: 'ollama', todayRequests: 10_000 })).toEqual({ ok: true });
    });
});
