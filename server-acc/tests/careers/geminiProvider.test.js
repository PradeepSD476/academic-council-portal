import { describe, it, expect, vi, afterEach } from 'vitest';
import * as gemini from '../../services/careers/extract/providers/gemini.js';
import { provider, modelFor, inputCap, isCloud, callModel } from '../../services/careers/extract/callModel.js';
import { EXTRACTION_SCHEMA } from '../../services/careers/extract/schema.js';

const ENV = ['LLM_PROVIDER', 'CAREERS_LLM_FAST_MODEL', 'GEMINI_API_KEY'];
const saved = Object.fromEntries(ENV.map((k) => [k, process.env[k]]));
afterEach(() => {
    for (const k of ENV) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
    vi.unstubAllGlobals();
});
const reply = (status, body) => ({ ok: status < 300, status, json: async () => body, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)) });

describe('Gemini provider (P1-T10b, plain fetch, mocked)', () => {
    it('request body: system instruction, user text, JSON mime type, the JSON schema as-is, temperature 0', () => {
        const b = gemini.requestBody({ system: 'S', user: 'U', schema: EXTRACTION_SCHEMA });
        expect(b.systemInstruction).toEqual({ parts: [{ text: 'S' }] });
        expect(b.contents).toEqual([{ role: 'user', parts: [{ text: 'U' }] }]);
        expect(b.generationConfig).toEqual({ responseMimeType: 'application/json', responseJsonSchema: EXTRACTION_SCHEMA, temperature: 0, maxOutputTokens: 2048 });
    });
    it('maps finish reasons, joins text parts (skipping thoughts), counts thinking as output', () => {
        const r = gemini.toCallResult({
            candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'hidden', thought: true }, { text: '{"a":' }, { text: '1}' }] } }],
            usageMetadata: { promptTokenCount: 900, candidatesTokenCount: 300, thoughtsTokenCount: 120 },
            modelVersion: 'gemini-3.1-flash-lite',
        }, 'x');
        expect(r).toEqual({ text: '{"a":1}', finishReason: 'STOP', usage: { inputTokens: 900, outputTokens: 420 }, model: 'gemini-3.1-flash-lite' });
        expect(gemini.toCallResult({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{' }] } }] }, 'm').finishReason).toBe('LENGTH');
        for (const f of ['SAFETY', 'RECITATION', 'PROHIBITED_CONTENT']) expect(gemini.toCallResult({ candidates: [{ finishReason: f }] }, 'm').finishReason).toBe('BLOCKED');
        expect(gemini.toCallResult({ promptFeedback: { blockReason: 'SAFETY' } }, 'm')).toMatchObject({ text: null, finishReason: 'BLOCKED' });
        expect(gemini.toCallResult({ candidates: [{ finishReason: 'WEIRD' }] }, 'm')).toMatchObject({ text: null, finishReason: 'OTHER', model: 'm' });
    });
    it('maps HTTP errors; a bad key (HTTP 400 API_KEY_INVALID) is AUTH, not BAD_REQUEST', () => {
        expect(gemini.errorFor(400, '{"error":{"status":"INVALID_ARGUMENT","details":[{"reason":"API_KEY_INVALID"}]}}', 'm').kind).toBe('AUTH');
        expect(gemini.errorFor(403, '', 'm').kind).toBe('AUTH');
        expect(gemini.errorFor(404, '', 'm').kind).toBe('MODEL_MISSING');
        expect(gemini.errorFor(429, '', 'm').kind).toBe('RATE_LIMIT');
        expect(gemini.errorFor(400, 'schema too deep', 'm').kind).toBe('BAD_REQUEST');
        expect(gemini.errorFor(503, '', 'm').kind).toBe('SERVER');
    });
    it('call(): POSTs generateContent with the key in a header (never the URL); no key → CONFIG', async () => {
        delete process.env.GEMINI_API_KEY;
        await expect(gemini.call({ model: 'gemini-3.1-flash-lite', system: 'S', user: 'U', schema: {} })).rejects.toMatchObject({ kind: 'CONFIG' });
        process.env.GEMINI_API_KEY = 'test-key';
        const fetchMock = vi.fn(async () => reply(200, { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{}' }] } }], usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 2 } }));
        vi.stubGlobal('fetch', fetchMock);
        const r = await gemini.call({ model: 'gemini-3.1-flash-lite', system: 'S', user: 'U', schema: {} });
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent');
        expect(url).not.toContain('test-key');
        expect(init.headers['x-goog-api-key']).toBe('test-key');
        expect(r).toMatchObject({ text: '{}', finishReason: 'STOP', usage: { inputTokens: 5, outputTokens: 2 } });
        vi.stubGlobal('fetch', vi.fn(async () => { throw Object.assign(new Error('fetch failed'), { cause: { code: 'ENOTFOUND' } }); }));
        await expect(gemini.call({ model: 'm', system: 'S', user: 'U', schema: {} })).rejects.toMatchObject({ kind: 'UNREACHABLE' });
    });
    it('status(): key missing / bad key / unknown model / ok', async () => {
        delete process.env.GEMINI_API_KEY;
        expect(await gemini.status('m')).toMatchObject({ keyPresent: false });
        process.env.GEMINI_API_KEY = 'test-key';
        vi.stubGlobal('fetch', vi.fn(async () => reply(400, 'API key not valid. Please pass a valid API key.')));
        expect(await gemini.status('m')).toMatchObject({ reachable: true, keyPresent: false });
        vi.stubGlobal('fetch', vi.fn(async () => reply(404, 'not found')));
        expect(await gemini.status('m')).toMatchObject({ reachable: true, modelPresent: false });
        vi.stubGlobal('fetch', vi.fn(async () => reply(200, { name: 'models/gemini-3.1-flash-lite' })));
        expect(await gemini.status('gemini-3.1-flash-lite')).toMatchObject({ reachable: true, modelPresent: true, keyPresent: true, lastError: null });
    });
});

describe('switching provider by env only', () => {
    it('gemini, groq and ollama are picked from LLM_PROVIDER with their own defaults and caps', async () => {
        delete process.env.CAREERS_LLM_FAST_MODEL;
        process.env.LLM_PROVIDER = 'gemini';
        expect([provider().name, modelFor('LLM_FAST'), inputCap(), isCloud('gemini')]).toEqual(['gemini', 'gemini-3.1-flash-lite', 40_000, true]);
        process.env.LLM_PROVIDER = 'groq';
        expect([provider().name, modelFor('LLM_FAST'), inputCap()]).toEqual(['groq', 'openai/gpt-oss-120b', 12_000]);
        process.env.LLM_PROVIDER = 'ollama';
        expect([provider().name, modelFor('LLM_FAST'), inputCap()]).toEqual(['ollama', 'qwen2.5:7b', 12_000]);
        process.env.LLM_PROVIDER = 'nope';
        expect(() => provider()).toThrow(/not available/);
    });
    it('callModel through Gemini truncates to 40,000 characters and tags the provider', async () => {
        process.env.LLM_PROVIDER = 'gemini';
        process.env.GEMINI_API_KEY = 'test-key';
        delete process.env.CAREERS_LLM_FAST_MODEL;
        const fetchMock = vi.fn(async () => reply(200, { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{}' }] } }] }));
        vi.stubGlobal('fetch', fetchMock);
        const r = await callModel('LLM_FAST', 'x'.repeat(50_000));
        expect(r).toMatchObject({ provider: 'gemini', truncated: true });
        const sent = JSON.parse(fetchMock.mock.calls[0][1].body).contents[0].parts[0].text;
        expect(sent.length).toBeLessThan(41_000);
    });
});
