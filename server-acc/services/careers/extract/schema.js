// What the model must return (Architecture 8.2). EXTRACTION_SCHEMA is sent to the provider as a
// JSON-schema response format; extractionOutput (zod) re-validates whatever comes back, because a
// format hint is not a guarantee. Rules: additionalProperties false everywhere, every field
// required, no numeric bounds in the JSON schema (ranges are checked here in zod).
import { z } from 'zod';

const nullable = (type) => ({ type: [type, 'null'] });

export const EXTRACTION_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: [
        'is_job_posting', 'company_name', 'role_title', 'type', 'ppo_mentioned', 'location', 'work_mode', 'skills',
        'compensation_text', 'eligibility', 'deadline_stated', 'apply_url', 'overall_confidence',
    ],
    properties: {
        is_job_posting: { type: 'boolean' },
        company_name: nullable('string'),
        role_title: nullable('string'),
        type: { type: 'string', enum: ['INTERNSHIP', 'FULL_TIME', 'UNKNOWN'] },
        ppo_mentioned: nullable('boolean'),
        location: nullable('string'),
        work_mode: { type: 'string', enum: ['ONSITE', 'HYBRID', 'REMOTE', 'UNKNOWN'] },
        skills: { type: 'array', items: { type: 'string' } },
        compensation_text: nullable('string'),
        eligibility: {
            type: 'object',
            additionalProperties: false,
            required: ['branches', 'years', 'min_cpi'],
            properties: {
                branches: { type: 'array', items: { type: 'string' } },
                years: { type: 'array', items: { type: 'integer' } },
                min_cpi: nullable('number'),
            },
        },
        deadline_stated: nullable('string'),
        apply_url: nullable('string'),
        overall_confidence: { type: 'number' },
    },
};

const str = z.string().trim().max(2000).nullable().transform((s) => (s ? s : null));

// overall_confidence is NOT range-checked here: an out-of-range value is a model error that
// verify.js turns into 0.5 (it must not reject an otherwise usable extraction).
export const extractionOutput = z.object({
    is_job_posting: z.boolean(),
    company_name: str,
    role_title: str,
    type: z.enum(['INTERNSHIP', 'FULL_TIME', 'UNKNOWN']),
    ppo_mentioned: z.boolean().nullable(),
    location: str,
    work_mode: z.enum(['ONSITE', 'HYBRID', 'REMOTE', 'UNKNOWN']),
    skills: z.array(z.string().trim().max(80)).max(60),
    compensation_text: str,
    eligibility: z.object({
        branches: z.array(z.string().trim().max(80)).max(40),
        years: z.array(z.number().int()).max(10),
        min_cpi: z.number().nullable(),
    }).strict(),
    deadline_stated: str,
    apply_url: str,
    overall_confidence: z.number(),
}).strict();

// JSON text -> validated object, or throws an Error with a short summary (stored on the Extraction).
export function parseExtraction(text) {
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error(`Model output is not JSON: ${String(text).slice(0, 120)}`);
    }
    const result = extractionOutput.safeParse(data);
    if (!result.success) {
        const summary = result.error.issues.slice(0, 5).map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
        throw new Error(`Model output failed validation: ${summary}`);
    }
    return result.data;
}
