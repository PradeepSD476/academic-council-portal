// Runs one ATS source end to end: fetch -> relevance filter -> build -> dedup/upsert -> liveness,
// and records a SourceRun plus the source's health. Never throws for a fetch or data problem: the
// failure is written to SourceRun.error and Source.lastError so the operations page shows it.
import prisma from '../../../config/db.js';
import { getSetting } from '../settings.js';
import { fetchPostings } from './adapters/index.js';
import { evaluateRelevance } from '../text/relevance.js';
import { loadCompanyIndex } from '../companies/companyIndex.js';
import { resolveCompany } from '../companies/resolveCompany.js';
import { buildPostingData } from './buildPosting.js';
import { upsertPosting } from './upsertPosting.js';
import { applyMissedRuns } from './liveness.js';
import { nextHealth } from './health.js';

// An ATS board belongs to one company (source.companyId). A source added without one is resolved
// by its name, and the company is marked uncertain for review.
async function companyForSource(source) {
    if (source.companyId) {
        const company = await prisma.company.findUnique({ where: { id: source.companyId }, select: { status: true } });
        return { companyId: source.companyId, uncertain: company?.status === 'CANDIDATE' };
    }
    const index = await loadCompanyIndex(prisma);
    const resolved = await resolveCompany(prisma, source.name, index, { fuzzyThreshold: await getSetting('careers.fuzzyThreshold') });
    if (!resolved) throw new Error(`Source #${source.id} has no company and its name "${source.name}" cannot be resolved`);
    return { companyId: resolved.companyId, uncertain: resolved.uncertain };
}

// Returns { sourceId, runId, status, fetchedCount, keptCount, newCount, duplicateCount, seenCount,
//           dropped: { reason: n }, failedPostings, liveness, error }
export async function runSource(source, { now = new Date() } = {}) {
    const run = await prisma.sourceRun.create({ data: { sourceId: source.id, startedAt: now } });
    const result = {
        sourceId: source.id, runId: run.id, status: 'SUCCESS',
        fetchedCount: 0, keptCount: 0, newCount: 0, duplicateCount: 0, seenCount: 0,
        dropped: {}, failedPostings: 0, liveness: null, error: null,
    };
    let firstPostingError = null;

    try {
        const company = await companyForSource(source);
        const { postings, fetchedCount, skipped } = await fetchPostings(source);
        result.fetchedCount = fetchedCount;
        if (skipped) result.dropped.unmappable = skipped;

        for (const raw of postings) {
            const relevance = evaluateRelevance(raw);
            if (!relevance.keep) {
                result.dropped[relevance.reason] = (result.dropped[relevance.reason] ?? 0) + 1;
                continue;
            }
            result.keptCount++;
            try {
                const data = buildPostingData(raw, { relevance, company });
                const { outcome } = await upsertPosting(prisma, { sourceId: source.id, raw, data, now });
                result[`${outcome}Count`]++;
            } catch (err) {
                // One bad job must not lose the rest of the board; it is reported on the run.
                result.failedPostings++;
                firstPostingError ??= `${raw.externalId}: ${err.message}`;
                console.error(`[careers] source #${source.id} posting ${raw.externalId} not saved`, err);
            }
        }

        if (result.keptCount > 0 && result.failedPostings === result.keptCount) {
            throw new Error(`All ${result.keptCount} relevant postings failed to save. First: ${firstPostingError}`);
        }
        // An empty board is suspicious (ZERO_RESULTS), so it doesn't count as every job disappearing.
        if (fetchedCount > 0) {
            result.liveness = await applyMissedRuns(prisma, source.id, postings.map((p) => p.externalId), now);
        }
    } catch (err) {
        result.status = 'FAILED';
        result.error = err.message;
    }

    if (!result.error && result.failedPostings) {
        result.error = `${result.failedPostings} of ${result.keptCount} postings not saved. First: ${firstPostingError}`;
    }

    await prisma.sourceRun.update({
        where: { id: run.id },
        data: {
            status: result.status,
            finishedAt: new Date(),
            fetchedCount: result.fetchedCount,
            keptCount: result.keptCount,
            newCount: result.newCount,
            duplicateCount: result.duplicateCount,
            error: result.error,
        },
    });
    // A few unsaved postings are reported on the run but don't make the source FAILING.
    const health = nextHealth(source, { ...result, error: result.status === 'FAILED' ? result.error : null }, now);
    await prisma.source.update({ where: { id: source.id }, data: health });

    const summary = `fetched=${result.fetchedCount} kept=${result.keptCount} new=${result.newCount} dup=${result.duplicateCount} seen=${result.seenCount}`;
    if (result.status === 'FAILED') console.error(`[careers] source #${source.id} ${source.kind}/${source.boardToken} FAILED: ${result.error}`);
    else console.info(`[careers] source #${source.id} ${source.kind}/${source.boardToken} ${health.health} ${summary}`);
    return { ...result, health: health.health };
}
