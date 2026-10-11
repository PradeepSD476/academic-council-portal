// "Fill from link" on the admin's Add posting page (F-34): read a job link and return a draft of the
// posting form. Nothing is saved: no posting, no company, no extraction row; the admin checks and
// edits the draft, then saves it as a manual posting. Cheapest path first, like processSubmission:
//   job site we never fetch (LinkedIn, ...) -> refused
//   Greenhouse / Lever / Ashby job link     -> the ATS API (STRUCTURED)
//   page with JobPosting JSON-LD             -> JSON_LD
//   anything else                            -> the AI step (only while it is on, under the daily cap)
// The page is fetched through safeFetch (no private addresses). Only the public page goes to the model.
import { z } from 'zod';
import prisma from '../../../config/db.js';
import { CareersError } from '../errors.js';
import { getSetting } from '../settings.js';
import { isBlockedDomain } from './blockedDomains.js';
import { parseAtsLink, fetchAtsJob } from './atsLink.js';
import { safeFetch } from './safeFetch.js';
import { extractJsonLd } from './jsonLd.js';
import { linkLocationClass } from './processSubmission.js';
import { htmlToText } from '../text/html.js';
import { guessType } from '../text/relevance.js';
import { buildPostingData } from '../ingest/buildPosting.js';
import { loadCompanyIndex } from '../companies/companyIndex.js';
import { resolveName } from '../companies/matcher.js';
import { callModel, providerName, modelFor } from '../extract/callModel.js';
import { providerStatus, isUsable } from '../extract/providerStatus.js';
import { canCall } from '../extract/budget.js';
import { costUsd } from '../extract/pricing.js';
import { parseExtraction } from '../extract/schema.js';
import { verifyExtraction } from '../extract/verify.js';
import { callResultProblem } from '../extract/outcome.js';

const MIN_PAGE_TEXT = 200;

// A fetch problem (blocked address, timeout, 404, not HTML) is the admin's to see, not a server error.
async function readable(fn) {
    try {
        return await fn();
    } catch (err) {
        if (err instanceof CareersError) throw err;
        throw new CareersError(422, 'FETCH_FAILED', `Could not read the page: ${err.message}`);
    }
}

export const draftBody = z.object({
    url: z.string().trim().url().refine((u) => /^https?:\/\//i.test(u), { message: 'Use an http(s) link.' }),
}).strict();

// The posting-form fields (what the Add posting page holds); everything else buildPostingData makes is dropped.
const FORM_FIELDS = [
    'roleTitle', 'type', 'location', 'workMode', 'ppoMentioned', 'skills', 'compCurrency', 'stipendDisclosure', 'stipendMin', 'stipendMax',
    'ctcDisclosure', 'ctcMin', 'ctcMax', 'compensationRaw', 'applyUrl', 'descriptionText', 'eligibleBranches', 'eligibleYears', 'eligibleGradYears',
    'minCpi', 'deadlineStated', 'season', 'startMonth', 'durationMonths',
];

// Pure. built: buildPostingData output; fromModel: the verified model fields that override our own
// reading (as applyExtraction does), or undefined for structured sources.
export function draftFields(built, fromModel) {
    const d = Object.fromEntries(FORM_FIELDS.filter((k) => k in built).map((k) => [k, built[k]]));
    if (fromModel) {
        Object.assign(d, {
            workMode: fromModel.workMode, skills: fromModel.skills, ppoMentioned: fromModel.ppoMentioned,
            eligibleBranches: fromModel.eligibleBranches, eligibleYears: fromModel.eligibleYears, minCpi: fromModel.minCpi,
            eligibleGradYears: fromModel.eligibleGradYears?.length ? fromModel.eligibleGradYears : d.eligibleGradYears,
        });
    }
    return d;
}

// Pure. Verified model fields -> RawPosting. The description the model located (B-22), else the page text.
export function rawFromVerified(f, pageUrl, pageText) {
    return {
        title: f.roleTitle, companyName: f.companyName, locationText: f.location, url: f.applyUrl || pageUrl,
        descriptionText: f.descriptionText ?? pageText, workplaceText: null, employmentTypeText: null,
        compensationText: f.compensationText, postedAt: null, deadline: f.deadline,
    };
}

// A known company for the name, without creating anything: { companyId, name, status } or a new name.
async function suggestCompany(name) {
    if (!name) return null;
    const match = resolveName(name, await loadCompanyIndex(prisma), { fuzzyThreshold: await getSetting('careers.fuzzyThreshold') });
    if (match.companyId === null) return { companyId: null, name, status: null };
    const c = await prisma.company.findUnique({ where: { id: match.companyId }, select: { id: true, name: true, status: true } });
    return c ? { companyId: c.id, name: c.name, status: c.status, matchedFrom: name !== c.name ? name : undefined } : { companyId: null, name, status: null };
}

async function fromModel(page) {
    const text = htmlToText(page.body, { preferMain: true });
    if (text.length < MIN_PAGE_TEXT) throw new CareersError(422, 'NO_TEXT', `The page has almost no text (${text.length} characters). It may need a login or JavaScript; enter the details by hand.`);
    if (!(await getSetting('careers.llmEnabled'))) throw new CareersError(409, 'AI_OFF', 'This page has no structured job data, and the AI step is switched off (Operations → Feature flags). Enter the details by hand, or turn it on.');
    const status = await providerStatus();
    if (!isUsable(status)) throw new CareersError(503, 'AI_UNUSABLE', `The AI step is not available: ${status.lastError ?? 'provider not ready'}.`);
    const provider = providerName();
    const model = modelFor('LLM_FAST');
    const budget = await canCall({ provider, model, inputChars: text.length });
    if (!budget.ok) throw new CareersError(429, budget.reason, budget.reason === 'DAILY_LIMIT' ? 'Today\'s limit of AI calls is used up. Try again tomorrow or enter the details by hand.' : 'The monthly AI budget is used up.');

    const result = await callModel('LLM_FAST', text);
    const paidTier = await getSetting('careers.llmPaidTier');
    await prisma.llmUsage.create({
        data: { model: result.model, provider, purpose: 'draft', inputTokens: result.usage.inputTokens, outputTokens: result.usage.outputTokens, costUsd: costUsd({ provider, model: result.model, usage: result.usage, paidTier }) ?? 0 },
    });
    const problem = callResultProblem(result);
    if (problem) throw new CareersError(502, 'AI_FAILED', `The AI step could not read the page: ${problem}.`);
    let verified;
    try {
        verified = verifyExtraction(parseExtraction(result.text), text, { provider });
    } catch (err) {
        throw new CareersError(502, 'AI_FAILED', `The AI step returned something unusable: ${err.message}`);
    }
    if (!verified.fields.roleTitle) throw new CareersError(422, 'NOT_A_JOB', 'The AI step found no job title on this page. It may not be a single job posting.');
    return { raw: rawFromVerified(verified.fields, page.url, text), fields: verified.fields, uncertain: verified.uncertainFields, model: result.model, truncated: result.truncated };
}

// A company careers page that embeds Greenhouse ("…?gh_jid=8066310") is read from the board when one
// of our Greenhouse boards already knows that job id (the page itself usually needs JavaScript).
async function greenhouseFromJobId(url) {
    const jobId = new URL(url).searchParams.get('gh_jid');
    if (!/^\d{3,20}$/.test(jobId ?? '')) return null;
    const seen = await prisma.postingSource.findFirst({ where: { externalId: jobId, source: { kind: 'GREENHOUSE' } }, select: { source: { select: { boardToken: true } } } });
    return seen?.source.boardToken ? { kind: 'GREENHOUSE', boardToken: seen.source.boardToken, jobId } : null;
}

// Returns { source: 'ATS' | 'JSON_LD' | 'AI', draft, company, uncertainFields, note }.
export async function linkDraft(url) {
    const host = new URL(url).hostname;
    if (isBlockedDomain(host)) throw new CareersError(422, 'STORE_ONLY', `${host} pages can't be read automatically. Copy the details by hand.`);

    let raw; let source; let modelFields; let uncertain = []; let note = null;
    const ats = parseAtsLink(url) ?? await greenhouseFromJobId(url);
    if (ats) {
        raw = await readable(() => fetchAtsJob(ats));
        source = 'ATS';
    } else {
        const page = await readable(() => safeFetch(url));
        raw = page.contentType.includes('html') ? extractJsonLd(page.body, page.url) : null;
        if (raw) {
            source = 'JSON_LD';
        } else {
            const m = await fromModel(page);
            ({ raw } = m);
            modelFields = m.fields;
            uncertain = m.uncertain;
            source = 'AI';
            note = `Read by ${m.model}${m.truncated ? ' (long page: only the start was read)' : ''}. Check every field against the page.`;
        }
    }

    const type = modelFields?.type && modelFields.type !== 'UNKNOWN' ? modelFields.type : (guessType(raw.title) ?? 'UNKNOWN');
    const built = buildPostingData(raw, { relevance: { type, location: linkLocationClass(raw.locationText) }, company: { companyId: null, uncertain: false } });
    return {
        source,
        draft: draftFields(built, modelFields),
        company: await suggestCompany(raw.companyName),
        uncertainFields: [...new Set([...built.uncertainFields, ...uncertain])],
        note,
    };
}
