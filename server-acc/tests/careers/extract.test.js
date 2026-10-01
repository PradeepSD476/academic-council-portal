import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { EXTRACTION_SCHEMA, parseExtraction } from '../../services/careers/extract/schema.js';
import { verifyExtraction, normalizeForMatch, deadlineGrounded } from '../../services/careers/extract/verify.js';
import { callModel, modelFor } from '../../services/careers/extract/callModel.js';
import { providerStatus } from '../../services/careers/extract/providerStatus.js';
import { afterCallError, callResultProblem, nextStep, backoffMs, MAX_ATTEMPTS } from '../../services/careers/extract/outcome.js';
import { LlmError } from '../../services/careers/extract/llmError.js';
import { budgetDecision } from '../../services/careers/extract/budget.js';
import { costUsd } from '../../services/careers/extract/pricing.js';
import { extractionPostingData } from '../../services/careers/extract/applyExtraction.js';
import { SYSTEM_PROMPT, userMessage } from '../../services/careers/extract/prompt.js';
import { branchCodes } from '../../services/careers/postings/branchCodes.js';

const base = (over = {}) => ({
    is_job_posting: true, company_name: null, role_title: null, type: 'UNKNOWN', ppo_mentioned: null, location: null,
    work_mode: 'UNKNOWN', skills: [], compensation_text: null, eligibility: { branches: [], years: [], min_cpi: null },
    deadline_stated: null, apply_url: null, overall_confidence: 0.9, ...over,
});

describe('extraction schema', () => {
    it('every object is closed and every field required (provider rules)', () => {
        expect(EXTRACTION_SCHEMA.additionalProperties).toBe(false);
        expect(EXTRACTION_SCHEMA.required.sort()).toEqual(Object.keys(EXTRACTION_SCHEMA.properties).sort());
        const elig = EXTRACTION_SCHEMA.properties.eligibility;
        expect(elig.additionalProperties).toBe(false);
        expect(elig.required.sort()).toEqual(Object.keys(elig.properties).sort());
        expect(JSON.stringify(EXTRACTION_SCHEMA)).not.toMatch(/minimum|maximum/);
    });
    it('accepts a valid answer; empty strings become null', () => {
        expect(parseExtraction(JSON.stringify(base({ company_name: '', role_title: 'SWE Intern' })))).toMatchObject({ company_name: null, role_title: 'SWE Intern' });
    });
    it('keeps an out-of-range confidence for verify.js to correct', () => {
        expect(parseExtraction(JSON.stringify(base({ overall_confidence: 100 }))).overall_confidence).toBe(100);
    });
    it.each([
        ['not JSON', 'Sure! Here is the JSON:', /not JSON/],
        ['unknown field', JSON.stringify({ ...base(), salary: 5 }), /validation/],
        ['bad enum', JSON.stringify(base({ type: 'PART_TIME' })), /type/],
        ['missing field', JSON.stringify({ is_job_posting: true }), /validation/],
        ['wrong type', JSON.stringify(base({ skills: 'python' })), /skills/],
    ])('rejects %s', (_, text, message) => {
        expect(() => parseExtraction(text)).toThrow(message);
    });
    it('the system prompt embeds the schema and the user message only carries page text', () => {
        expect(SYSTEM_PROMPT).toContain('"additionalProperties":false');
        expect(userMessage('PAGE')).toBe('Page text:\n"""\nPAGE\n"""');
    });
});

describe('verify.js', () => {
    // The real failure seen with qwen2.5:7b on 29 Sep 2026.
    const ACME = 'Acme Robotics Pvt Ltd is hiring a Software Engineering Intern for our Pune office. You will work on ROS and Python. Stipend: competitive. Apply by 15 October 2026.';
    it('29 Sep case: type corrected, paraphrased pay dropped, invalid confidence -> 0.5, penalised, capped', () => {
        const v = verifyExtraction(base({
            company_name: 'Acme Robotics Pvt Ltd', role_title: 'Software Engineering Intern', type: 'FULL_TIME',
            compensation_text: 'competitive stipend', overall_confidence: 100,
        }), ACME, { provider: 'ollama' });
        expect(v.fields.type).toBe('INTERNSHIP');
        expect(v.fields.compensationText).toBeNull();
        expect(v.uncertainFields).toContain('compensation');
        // 0.5 (invalid 100) - 0.15 (pay dropped) - 0.10 (type overridden) = 0.25, already under the 0.7 cap
        expect(v.confidence).toBe(0.25);
        expect(v.corrections.join(' ')).toMatch(/not between 0 and 1/);
    });
    it('the pay text, copied verbatim, survives (and differs only in dash style)', () => {
        const text = 'Stipend: ₹40,000 – 60,000 per month. Role: Data Analyst Intern.';
        const v = verifyExtraction(base({ role_title: 'Data Analyst Intern', compensation_text: 'Stipend: ₹40,000 - 60,000 per month' }), text);
        expect(v.fields.compensationText).toBe('Stipend: ₹40,000 - 60,000 per month');
    });
    it('an invented company name is dropped', () => {
        const v = verifyExtraction(base({ company_name: 'Google', role_title: 'Software Engineering Intern' }), ACME);
        expect(v.fields.companyName).toBeNull();
        expect(v.uncertainFields).toContain('company');
    });
    it('a skill not in the text is dropped; dictionary skills are added', () => {
        const v = verifyExtraction(base({ role_title: 'Software Engineering Intern', skills: ['Python', 'Kubernetes'] }), ACME);
        expect(v.fields.skills).toContain('Python');
        expect(v.fields.skills).not.toContain('Kubernetes');
        expect(v.fields.skills).toContain('Robotics'); // from the dictionary, not the model
        expect(v.uncertainFields).toContain('skills');
    });
    it('a made-up deadline is dropped; a written one is kept', () => {
        expect(verifyExtraction(base({ role_title: 'Software Engineering Intern', deadline_stated: '2026-11-30' }), ACME).fields.deadline).toBeNull();
        expect(verifyExtraction(base({ role_title: 'Software Engineering Intern', deadline_stated: '2026-10-15' }), ACME).fields.deadline).toBe('2026-10-15');
        expect(verifyExtraction(base({ role_title: 'x', deadline_stated: 'soon' }), 'x soon').fields.deadline).toBeNull();
    });
    it('a local model is capped at 0.7 even when everything checks out; Gemini is not', () => {
        const out = base({ company_name: 'Acme Robotics Pvt Ltd', role_title: 'Software Engineering Intern', location: 'Pune', type: 'INTERNSHIP', overall_confidence: 0.95 });
        expect(verifyExtraction(out, ACME, { provider: 'ollama' }).confidence).toBe(0.7);
        expect(verifyExtraction(out, ACME, { provider: 'gemini' }).confidence).toBe(0.95);
    });
    it('work mode comes from keywords when the page has them', () => {
        expect(verifyExtraction(base({ role_title: 'Intern', work_mode: 'ONSITE' }), 'Intern. This role is fully remote within India.').fields.workMode).toBe('REMOTE');
    });
    it('PPO only when the page mentions it', () => {
        expect(verifyExtraction(base({ role_title: 'Intern', ppo_mentioned: true }), 'Intern role').fields.ppoMentioned).toBeNull();
        expect(verifyExtraction(base({ role_title: 'Intern', ppo_mentioned: true }), 'Intern role with a PPO for top performers').fields.ppoMentioned).toBe(true);
    });
    it('eligibility: branches mapped to codes, CPI must be written, years 1..5', () => {
        const text = 'Open to Computer Science and Electrical Engineering students in 3rd or 4th year with CGPA above 7.5. Role: Intern.';
        const v = verifyExtraction(base({ role_title: 'Intern', eligibility: { branches: ['Computer Science', 'Electrical Engineering', 'Biotech'], years: [3, 4, 9], min_cpi: 7.5 } }), text);
        expect(v.fields.eligibleBranches).toEqual(['CS', 'EE']);
        expect(v.fields.eligibleYears).toEqual([3, 4]);
        expect(v.fields.minCpi).toBe(7.5);
        expect(v.uncertainFields).toContain('eligibility');
        expect(verifyExtraction(base({ role_title: 'Intern', eligibility: { branches: [], years: [], min_cpi: 8 } }), 'Intern').fields.minCpi).toBeNull();
    });
    it('an apply URL not in the page is ignored', () => {
        expect(verifyExtraction(base({ role_title: 'Intern', apply_url: 'https://evil.example/apply' }), 'Intern').fields.applyUrl).toBeNull();
        expect(verifyExtraction(base({ role_title: 'Intern', apply_url: 'https://acme.example/apply' }), 'Intern. Apply at https://acme.example/apply').fields.applyUrl).toBe('https://acme.example/apply');
    });
    it('"not a job posting" with a grounded title is kept but flagged (seen with qwen on a Keka page, 1 Oct)', () => {
        const page = 'Software Engineer - Intern\n0 Years\nBengaluru (Kormangala)\nFull-Time\nRequirements\n- Bachelor in CS';
        const v = verifyExtraction(base({ is_job_posting: false, role_title: 'Software Engineer - Intern', overall_confidence: 0.85 }), page, { provider: 'gemini' });
        expect(v.uncertainFields).toContain('isJobPosting');
        expect(v.confidence).toBe(0.6); // 0.85 - 0.15 (flagged) - 0.10 (type UNKNOWN overridden to INTERNSHIP)
    });
    it('helpers', () => {
        expect(normalizeForMatch('  A–B\n\tC ')).toBe('a-b c');
        expect(deadlineGrounded('2026-10-05', normalizeForMatch('apply by 5th oct'))).toBe(true);
        expect(deadlineGrounded('2026-10-05', normalizeForMatch('apply by 05/10/2026'))).toBe(true);
        expect(deadlineGrounded('2026-10-05', normalizeForMatch('apply by 6th oct'))).toBe(false);
    });
});

describe('Ollama provider via callModel (fetch mocked)', () => {
    beforeEach(() => {
        vi.stubEnv('LLM_PROVIDER', 'ollama');
        vi.stubEnv('OLLAMA_URL', 'http://ollama.test:11434');
        vi.stubEnv('CAREERS_LLM_FAST_MODEL', '');
        vi.stubEnv('CAREERS_LLM_STRONG_MODEL', '');
    });
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
    });

    const reply = (body, status = 200) => vi.fn(async () => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }));

    it('success: sends the schema + prompt, maps the answer and usage', async () => {
        vi.stubGlobal('fetch', reply({ model: 'qwen2.5:7b', message: { content: '{"a":1}' }, done_reason: 'stop', prompt_eval_count: 812, eval_count: 143 }));
        const r = await callModel('LLM_FAST', 'page text');
        expect(r).toMatchObject({ text: '{"a":1}', finishReason: 'STOP', usage: { inputTokens: 812, outputTokens: 143 }, model: 'qwen2.5:7b', provider: 'ollama', truncated: false });
        const [url, init] = fetch.mock.calls[0];
        expect(url).toBe('http://ollama.test:11434/api/chat');
        const body = JSON.parse(init.body);
        expect(body).toMatchObject({ model: 'qwen2.5:7b', stream: false, options: { temperature: 0, num_ctx: 8192 } });
        expect(body.format).toEqual(EXTRACTION_SCHEMA);
        expect(body.messages[0].content).toBe(SYSTEM_PROMPT);
        expect(body.messages[1].content).toContain('page text');
    });
    it('caps the input at 12,000 characters', async () => {
        vi.stubGlobal('fetch', reply({ message: { content: '{}' }, done_reason: 'stop' }));
        const r = await callModel('LLM_FAST', 'x'.repeat(15_000));
        expect(r.truncated).toBe(true);
        expect(JSON.parse(fetch.mock.calls[0][1].body).messages[1].content.length).toBeLessThan(12_100);
    });
    it('done_reason "length" -> LENGTH (the run then fails the extraction)', async () => {
        vi.stubGlobal('fetch', reply({ message: { content: '{"is_job' }, done_reason: 'length' }));
        const r = await callModel('LLM_FAST', 'p');
        expect(r.finishReason).toBe('LENGTH');
        expect(callResultProblem(r)).toMatch(/LENGTH/);
    });
    it('connection refused -> UNREACHABLE', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => { throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNREFUSED' } }); }));
        await expect(callModel('LLM_FAST', 'p')).rejects.toMatchObject({ kind: 'UNREACHABLE', message: expect.stringContaining('ECONNREFUSED') });
    });
    it('404 -> MODEL_MISSING; 500 -> SERVER; 400 -> BAD_REQUEST', async () => {
        vi.stubGlobal('fetch', reply('{"error":"model not found"}', 404));
        await expect(callModel('LLM_FAST', 'p')).rejects.toMatchObject({ kind: 'MODEL_MISSING' });
        vi.stubGlobal('fetch', reply('boom', 500));
        await expect(callModel('LLM_FAST', 'p')).rejects.toMatchObject({ kind: 'SERVER' });
        vi.stubGlobal('fetch', reply('bad', 400));
        await expect(callModel('LLM_FAST', 'p')).rejects.toMatchObject({ kind: 'BAD_REQUEST' });
    });
    it('no strong model configured -> no escalation model', () => {
        expect(modelFor('LLM_STRONG')).toBeNull();
        expect(modelFor('LLM_FAST')).toBe('qwen2.5:7b');
    });
    it('an unavailable provider is a CONFIG error, not a crash', async () => {
        vi.stubEnv('LLM_PROVIDER', 'gemini');
        await expect(callModel('LLM_FAST', 'p')).rejects.toMatchObject({ kind: 'CONFIG' });
    });
    it('providerStatus: up with model / up without model / down', async () => {
        vi.stubGlobal('fetch', reply({ models: [{ name: 'qwen2.5:7b', model: 'qwen2.5:7b' }] }));
        expect(await providerStatus()).toMatchObject({ provider: 'ollama', reachable: true, modelPresent: true, lastError: null });
        vi.stubGlobal('fetch', reply({ models: [{ name: 'llama3.2:1b' }] }));
        expect(await providerStatus()).toMatchObject({ reachable: true, modelPresent: false, lastError: expect.stringContaining('ollama pull') });
        vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('fetch failed'); }));
        expect(await providerStatus()).toMatchObject({ reachable: false });
    });
});

describe('outcome decisions', () => {
    const now = new Date('2026-10-01T10:00:00Z');
    const ex = (attempts = 0) => ({ id: 1, attempts });
    it('connection refused: stays QUEUED, later nextAttemptAt, run stops with a red alert', () => {
        const plan = afterCallError(ex(0), new LlmError('UNREACHABLE', 'refused'), now);
        expect(plan.extraction.state).toBeUndefined();
        expect(plan.extraction.nextAttemptAt.getTime()).toBe(now.getTime() + 10 * 60_000);
        expect(plan).toMatchObject({ submission: null, stopRun: true, alert: 'UNREACHABLE' });
    });
    it('retryable errors give up after 5 attempts', () => {
        const plan = afterCallError(ex(MAX_ATTEMPTS - 1), new LlmError('SERVER', '500'), now);
        expect(plan.extraction.state).toBe('FAILED');
        expect(plan.submission.status).toBe('FAILED');
        expect(plan.stopRun).toBe(false);
    });
    it('model missing -> FAILED at once, and the run stops', () => {
        expect(afterCallError(ex(0), new LlmError('MODEL_MISSING', 'pull it'), now)).toMatchObject({ extraction: { state: 'FAILED' }, stopRun: true, alert: 'MODEL_MISSING' });
    });
    it('CONFIG leaves the row untouched', () => {
        expect(afterCallError(ex(0), new LlmError('CONFIG', 'x'), now)).toMatchObject({ extraction: null, stopRun: true });
    });
    it('backoff doubles and caps at 6 h', () => {
        expect(backoffMs(1)).toBe(10 * 60_000);
        expect(backoffMs(3)).toBe(40 * 60_000);
        expect(backoffMs(20)).toBe(6 * 3600_000);
    });
    it('next step', () => {
        const v = (over) => ({ isJobPosting: true, fields: { roleTitle: 'Intern' }, confidence: 0.6, ...over });
        expect(nextStep({ verified: v({ isJobPosting: false, fields: { roleTitle: null } }), tier: 'LLM_FAST', threshold: 0.8 })).toBe('NOT_JOB');
        expect(nextStep({ verified: v({ isJobPosting: false }), tier: 'LLM_FAST', threshold: 0.8 })).toBe('APPLY');
        expect(nextStep({ verified: v({ fields: { roleTitle: null } }), tier: 'LLM_FAST', threshold: 0.8 })).toBe('NO_TITLE');
        expect(nextStep({ verified: v(), tier: 'LLM_FAST', threshold: 0.8, strongModel: null })).toBe('APPLY');
        expect(nextStep({ verified: v(), tier: 'LLM_FAST', threshold: 0.8, strongModel: 'big' })).toBe('ESCALATE');
        expect(nextStep({ verified: v(), tier: 'LLM_STRONG', threshold: 0.8, strongModel: 'big' })).toBe('APPLY');
    });
});

describe('budget and pricing', () => {
    it('ollama is always allowed and free', () => {
        expect(budgetDecision({ provider: 'ollama', todayRequests: 9999, dailyLimit: 1 })).toEqual({ ok: true });
        expect(costUsd({ provider: 'ollama', model: 'qwen2.5:7b', usage: { inputTokens: 1e6, outputTokens: 1e6 } })).toBe(0);
    });
    it('gemini: daily cap, then paid monthly budget', () => {
        const g = { provider: 'gemini', dailyLimit: 200, paidTier: true, budgetUsd: 5, estimateUsd: 0.01 };
        expect(budgetDecision({ ...g, todayRequests: 200, monthSpendUsd: 0 })).toEqual({ ok: false, reason: 'DAILY_LIMIT' });
        expect(budgetDecision({ ...g, todayRequests: 3, monthSpendUsd: 4.995 })).toEqual({ ok: false, reason: 'BUDGET' });
        expect(budgetDecision({ ...g, todayRequests: 3, monthSpendUsd: 1 })).toEqual({ ok: true });
        expect(budgetDecision({ ...g, paidTier: false, todayRequests: 3, monthSpendUsd: 99 })).toEqual({ ok: true });
    });
    it('gemini free tier costs 0; paid uses the price table; thinking counts as output', () => {
        expect(costUsd({ provider: 'gemini', model: 'gemini-3.1-flash-lite', usage: { inputTokens: 1e6, outputTokens: 0 }, paidTier: false })).toBe(0);
        expect(costUsd({ provider: 'gemini', model: 'gemini-3.1-flash-lite', usage: { inputTokens: 1e6, outputTokens: 1e6 }, paidTier: true })).toBeCloseTo(1.75);
        expect(costUsd({ provider: 'gemini', model: 'unknown', usage: { inputTokens: 1, outputTokens: 1 }, paidTier: true })).toBeNull();
    });
});

describe('extractionPostingData', () => {
    const page = 'Acme Robotics Pvt Ltd is hiring a Software Engineering Intern in Pune. Stipend: INR 30,000 per month. Python.';
    const verified = verifyExtraction(base({
        company_name: 'Acme Robotics Pvt Ltd', role_title: 'Software Engineering Intern', location: 'Pune', type: 'INTERNSHIP',
        compensation_text: 'Stipend: INR 30,000 per month', overall_confidence: 0.9,
    }), page, { provider: 'ollama' });
    const extraction = { tier: 'LLM_FAST', inputText: page, inputTruncated: false, sourceUrl: 'https://careers.acme.example/j/1' };

    it('pay numbers come from our parser; tier and capped confidence are set; lands in Flagged (< 0.8)', () => {
        const { data } = extractionPostingData({ verified, extraction, company: { companyId: 4, uncertain: false }, provider: 'ollama' });
        expect(data).toMatchObject({
            companyId: 4, roleTitle: 'Software Engineering Intern', type: 'INTERNSHIP', stipendMin: 30000, stipendMax: 30000,
            stipendDisclosure: 'DISCLOSED', extractionTier: 'LLM_FAST', extractionConfidence: 0.7, applyUrl: 'https://careers.acme.example/j/1',
        });
        expect(data.extractionConfidence).toBeLessThan(0.8);
    });
    it('a candidate company and a truncated page are flagged and cost confidence', () => {
        const { data } = extractionPostingData({ verified, extraction: { ...extraction, inputTruncated: true }, company: { companyId: 9, uncertain: true }, provider: 'gemini' });
        expect(data.uncertainFields).toEqual(expect.arrayContaining(['company', 'description']));
        expect(data.extractionConfidence).toBe(0.55); // 0.7 (verified, local cap) - 0.15 (candidate company)
    });
});

describe('branchCodes', () => {
    it('maps names and codes, keeps unknown ones aside, never matches inside words', () => {
        expect(branchCodes(['Computer Science and Engineering', 'ECE', 'Mathematics & Computing', 'certified', 'Biotech'])).toEqual({ codes: ['CS', 'EC', 'MC'], unknown: ['certified', 'Biotech'] });
    });
});
