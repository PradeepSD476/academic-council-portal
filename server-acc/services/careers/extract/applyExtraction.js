// Verified model output -> Posting (PENDING_REVIEW), through the same building, company resolution
// and dedup as every other path. Pay numbers come from parseCompensation (inside buildPostingData),
// never from the model.
import { createHash } from 'node:crypto';
import { buildPostingData, UNCERTAIN_FIELD_PENALTY } from '../ingest/buildPosting.js';
import { companyFor, saveLinkPosting, linkLocationClass } from '../links/processSubmission.js';
import { LOCAL_MODEL_CAP } from './verify.js';

// Pure: the Posting fields from a verified extraction. company = { companyId, uncertain }.
export function extractionPostingData({ verified, extraction, company, provider }) {
    const f = verified.fields;
    const raw = {
        externalId: createHash('sha1').update(extraction.sourceUrl).digest('hex'),
        title: f.roleTitle,
        companyName: f.companyName,
        locationText: f.location,
        url: f.applyUrl ?? extraction.sourceUrl,
        descriptionText: extraction.inputText,
        workplaceText: null,
        employmentTypeText: null,
        compensationText: f.compensationText,
        postedAt: null,
        deadline: f.deadline,
    };
    const data = buildPostingData(raw, { relevance: { type: f.type, location: linkLocationClass(f.location) }, company });

    // Fields only buildPostingData noticed (e.g. a candidate company, unclear pay) also cost confidence.
    const extra = data.uncertainFields.filter((u) => !verified.uncertainFields.includes(u));
    const uncertain = [...new Set([...verified.uncertainFields, ...extra, ...(extraction.inputTruncated ? ['description'] : [])])];
    let confidence = verified.confidence - UNCERTAIN_FIELD_PENALTY * extra.length;
    if (provider === 'ollama') confidence = Math.min(confidence, LOCAL_MODEL_CAP);
    confidence = Math.max(0, Math.round(confidence * 100) / 100);

    return {
        raw,
        data: {
            ...data,
            workMode: f.workMode,
            skills: f.skills,
            ppoMentioned: f.ppoMentioned,
            eligibleBranches: f.eligibleBranches,
            eligibleYears: f.eligibleYears,
            minCpi: f.minCpi,
            extractionTier: extraction.tier,
            extractionConfidence: confidence,
            uncertainFields: uncertain,
        },
    };
}

// Returns { status: PENDING_REVIEW | DUPLICATE, postingId }.
export async function applyExtraction({ submission, extraction, verified, provider }) {
    const hostname = new URL(extraction.sourceUrl).hostname;
    const company = await companyFor({}, verified.fields.companyName, hostname);
    const { raw, data } = extractionPostingData({ verified, extraction, company, provider });
    return saveLinkPosting(submission, raw, data);
}
