import { describe, it, expect, vi, beforeEach } from 'vitest';

// In-memory stand-in for the Prisma models runExtractions touches; filled per test.
const db = vi.hoisted(() => ({}));
vi.mock('../../config/db.js', () => ({ default: db }));
vi.mock('../../services/careers/settings.js', () => ({
    getSetting: async (key) => ({ 'careers.llmEnabled': true, 'careers.confidenceThreshold': 0.6, 'careers.llmPaidTier': false })[key],
}));
vi.mock('../../services/careers/extract/providerStatus.js', () => ({
    providerStatus: async () => ({ reachable: true, modelPresent: true }),
    isUsable: () => true,
}));
vi.mock('../../services/careers/extract/budget.js', () => ({ canCall: async () => ({ ok: true }) }));
vi.mock('../../services/careers/extract/callModel.js', () => ({
    callModel: vi.fn(),
    providerName: () => 'ollama',
    modelFor: (tier) => (tier === 'LLM_FAST' ? 'qwen2.5:7b' : null),
}));
vi.mock('../../services/careers/extract/applyExtraction.js', () => ({ applyExtraction: vi.fn() }));

const { runExtractions } = await import('../../services/careers/extract/runExtractions.js');
const { callModel } = await import('../../services/careers/extract/callModel.js');
const { applyExtraction } = await import('../../services/careers/extract/applyExtraction.js');

const PAGE = 'Acme Robotics is hiring a Software Engineering Intern in Bengaluru. Apply on our careers page.';
const answer = {
    text: JSON.stringify({
        is_job_posting: true, company_name: 'Acme Robotics', role_title: 'Software Engineering Intern', type: 'INTERNSHIP', ppo_mentioned: null,
        location: 'Bengaluru', work_mode: 'UNKNOWN', skills: [], compensation_text: null, eligibility: { branches: [], years: [], min_cpi: null },
        deadline_stated: null, apply_url: null, overall_confidence: 0.6,
    }),
    finishReason: 'STOP', usage: { inputTokens: 100, outputTokens: 50 }, model: 'qwen2.5:7b', provider: 'ollama', truncated: false,
};

let extractions;
let submissions;

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const row = (id) => ({ id, submissionId: id, tier: 'LLM_FAST', inputText: PAGE, inputTruncated: false, sourceUrl: `https://jobs.example.com/${id}`, attempts: 0, state: 'QUEUED' });
    extractions = { 1: row(1), 2: row(2) };
    submissions = { 1: { id: 1, status: 'EXTRACTING' }, 2: { id: 2, status: 'EXTRACTING' } };
    Object.assign(db, {
        extraction: {
            findMany: async () => Object.values(extractions).filter((e) => e.state === 'QUEUED'),
            update: async ({ where, data }) => Object.assign(extractions[where.id], data),
            create: async () => ({}),
        },
        linkSubmission: {
            findUnique: async ({ where }) => submissions[where.id],
            update: async ({ where, data }) => Object.assign(submissions[where.id], data),
        },
        llmUsage: { create: async () => ({}) },
    });
});

describe('runExtractions: one bad row does not block the queue (B-01)', () => {
    it('a plain Error from the model call fails that row and the next row still runs', async () => {
        callModel.mockRejectedValueOnce(new Error('Unexpected token < in JSON at position 0')).mockResolvedValueOnce(answer);
        applyExtraction.mockResolvedValue({ status: 'PROCESSED', postingId: 7 });

        const summary = await runExtractions();

        expect(extractions[1]).toMatchObject({ state: 'FAILED', attempts: 1, error: expect.stringContaining('Unexpected token') });
        expect(submissions[1]).toMatchObject({ status: 'FAILED', error: expect.stringContaining('Unexpected token') });
        expect(extractions[2]).toMatchObject({ state: 'DONE', postingId: 7 });
        expect(summary).toMatchObject({ failed: 1, applied: 1 });
    });

    it('an error while saving the posting fails that row and the next row still runs', async () => {
        callModel.mockResolvedValue(answer);
        applyExtraction.mockRejectedValueOnce(new Error('Could not tell which company')).mockResolvedValueOnce({ status: 'PROCESSED', postingId: 8 });

        const summary = await runExtractions();

        expect(extractions[1]).toMatchObject({ state: 'FAILED', attempts: 1, error: expect.stringContaining('Could not tell which company') });
        expect(submissions[1]).toMatchObject({ status: 'FAILED' });
        expect(extractions[2]).toMatchObject({ state: 'DONE', postingId: 8 });
        expect(summary).toMatchObject({ called: 2, failed: 1, applied: 1 });
    });
});
