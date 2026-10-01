// Turns one student-submitted link into a posting, cheapest path first (Architecture 7a):
//   1. job site we never fetch (LinkedIn, Naukri, ...)  -> STORED_ONLY, no network request
//   2. Greenhouse / Lever / Ashby job link              -> that job from the ATS API (STRUCTURED)
//   3. page with schema.org JobPosting JSON-LD          -> JSON_LD
//   4. anything else                                    -> page text queued for the model (EXTRACTING)
// Then dedup: a job we already have becomes DUPLICATE with one more PostingSource on it.
// Only the public page is ever fetched or sent on; the student's note never leaves the database.
import { createHash } from 'node:crypto';
import prisma from '../../../config/db.js';
import { getSetting } from '../settings.js';
import { isBlockedDomain } from './blockedDomains.js';
import { parseAtsLink, fetchAtsJob } from './atsLink.js';
import { safeFetch } from './safeFetch.js';
import { extractJsonLd } from './jsonLd.js';
import { htmlToText } from '../text/html.js';
import { guessType, classifyLocation } from '../text/relevance.js';
import { loadCompanyIndex } from '../companies/companyIndex.js';
import { resolveCompany } from '../companies/resolveCompany.js';
import { buildPostingData } from '../ingest/buildPosting.js';
import { upsertPosting } from '../ingest/upsertPosting.js';
import { inputCap } from '../extract/callModel.js';

export const BATCH_SIZE = 20;
const STUCK_MS = 30 * 60 * 1000;
const MIN_PAGE_TEXT = 200;

const sha1 = (s) => createHash('sha1').update(s).digest('hex');

async function studentLinkSource() {
    const source = await prisma.source.findFirst({ where: { kind: 'STUDENT_LINK', boardToken: null } });
    if (!source) throw new Error('The STUDENT_LINK source is missing. Run npm run careers:seed.');
    return source;
}

// "careers.acme-robotics.com" -> "acme-robotics": a last resort when the page names no company.
function nameFromHost(hostname) {
    const labels = hostname.replace(/^www\./, '').split('.');
    return labels.length > 2 ? labels[labels.length - 2] : labels[0];
}

export async function companyFor({ kind, boardToken }, companyName, hostname) {
    if (kind) {
        const source = await prisma.source.findUnique({ where: { kind_boardToken: { kind, boardToken } }, include: { company: { select: { status: true } } } });
        if (source?.companyId) return { companyId: source.companyId, uncertain: source.company?.status === 'CANDIDATE' };
    }
    const name = companyName || boardToken || nameFromHost(hostname);
    const resolved = await resolveCompany(prisma, name, await loadCompanyIndex(prisma), { fuzzyThreshold: await getSetting('careers.fuzzyThreshold') });
    if (!resolved) throw new Error('Could not tell which company this job belongs to');
    return { companyId: resolved.companyId, uncertain: resolved.uncertain };
}

// A student link is never dropped by the relevance filter (a person chose to share it); a place
// abroad or unknown is flagged for the reviewer instead.
export function linkLocationClass(locationText) {
    const place = classifyLocation(locationText);
    return place === 'foreign' ? 'unknown' : place;
}

// Saves a structured RawPosting from a link; returns the submission update.
async function savePosting(submission, raw, company, tier) {
    const relevance = { type: guessType(raw.title) ?? 'UNKNOWN', location: linkLocationClass(raw.locationText) };
    const data = { ...buildPostingData(raw, { relevance, company }), extractionTier: tier };
    return saveLinkPosting(submission, raw, data);
}

// Dedup + save under the STUDENT_LINK source; the observation is keyed by the canonical link.
// Returns { status: PENDING_REVIEW | DUPLICATE, postingId, error: null }.
export async function saveLinkPosting(submission, raw, data) {
    const source = await studentLinkSource();
    const observation = { ...raw, externalId: sha1(submission.canonicalUrl), url: submission.canonicalUrl };
    const { outcome, postingId } = await upsertPosting(prisma, { sourceId: source.id, raw: observation, data });
    return { status: outcome === 'new' ? 'PENDING_REVIEW' : 'DUPLICATE', postingId, error: null };
}

async function queueForModel(submission, page) {
    const text = htmlToText(page.body, { preferMain: true });
    if (text.length < MIN_PAGE_TEXT) {
        return { status: 'FAILED', error: `The page has almost no text (${text.length} characters). It may need a login or JavaScript; an admin can enter it by hand.` };
    }
    // The provider's cap (12,000 characters for the local model). If the provider isn't set up yet,
    // the local cap is used and the row simply waits in the queue.
    let cap = 12_000;
    try {
        cap = inputCap();
    } catch {
        // LLM_PROVIDER not available yet; keep the default.
    }
    await prisma.extraction.create({
        data: {
            submissionId: submission.id,
            tier: 'LLM_FAST',
            inputText: text.slice(0, cap),
            inputTruncated: text.length > cap,
            sourceUrl: page.url,
        },
    });
    return { status: 'EXTRACTING', error: null };
}

// Returns the final { status, postingId?, error? } (also written to the submission).
export async function processSubmission(submission) {
    await prisma.linkSubmission.update({ where: { id: submission.id }, data: { status: 'PROCESSING', error: null } });
    let result;
    try {
        const url = new URL(submission.canonicalUrl);
        const ats = parseAtsLink(submission.canonicalUrl);
        if (isBlockedDomain(url.hostname)) {
            console.info(`[careers] submission #${submission.id}: ${url.hostname} is store-only; not fetched`);
            result = { status: 'STORED_ONLY', error: null };
        } else if (ats) {
            const raw = await fetchAtsJob(ats);
            result = await savePosting(submission, raw, await companyFor(ats, raw.companyName, url.hostname), 'STRUCTURED');
        } else {
            const page = await safeFetch(submission.canonicalUrl);
            const raw = page.contentType.includes('html') ? extractJsonLd(page.body, page.url) : null;
            if (raw) result = await savePosting(submission, raw, await companyFor({}, raw.companyName, new URL(page.url).hostname), 'JSON_LD');
            else result = await queueForModel(submission, page);
        }
    } catch (err) {
        console.warn(`[careers] submission #${submission.id} failed: ${err.message}`);
        result = { status: 'FAILED', error: String(err.message).slice(0, 500) };
    }
    await prisma.linkSubmission.update({
        where: { id: submission.id },
        data: { status: result.status, error: result.error ?? null, ...(result.postingId ? { postingId: result.postingId } : {}) },
    });
    return result;
}

// Worker job: up to BATCH_SIZE new submissions, oldest first. Rows left PROCESSING by a crashed
// run (older than 30 min) are picked up again.
export async function processSubmissions({ limit = BATCH_SIZE } = {}) {
    const stuckBefore = new Date(Date.now() - STUCK_MS);
    const batch = await prisma.linkSubmission.findMany({
        where: { OR: [{ status: 'RECEIVED' }, { status: 'PROCESSING', updatedAt: { lt: stuckBefore } }] },
        orderBy: { createdAt: 'asc' },
        take: limit,
    });
    const counts = {};
    for (const submission of batch) {
        const { status } = await processSubmission(submission);
        counts[status] = (counts[status] ?? 0) + 1;
    }
    if (batch.length) console.info(`[careers] processed ${batch.length} submission(s): ${JSON.stringify(counts)}`);
    return { processed: batch.length, counts };
}
