// Admin: ATS sources (boards), "Run now" requests for the worker, and recent runs.
import { z } from 'zod';
import prisma from '../../config/db.js';
import { CareersError, sendError, parseId } from '../../services/careers/errors.js';
import { getSetting, setSetting, clearSettingsCache } from '../../services/careers/settings.js';
import { fetchPostings } from '../../services/careers/ingest/adapters/index.js';
import { ATS_KINDS } from '../../services/careers/ingest/ingestAll.js';
import { evaluateRelevance } from '../../services/careers/text/relevance.js';

const createBody = z.object({
    kind: z.enum(ATS_KINDS),
    // Board tokens are path segments on the ATS APIs: letters, digits, - and _ only.
    boardToken: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9_-]{0,99}$/, 'Use the board token from the board URL (letters, digits, - or _).'),
    companyId: z.number().int().positive(),
    name: z.string().trim().min(1).max(120).optional(),
});

const updateBody = z.object({
    isEnabled: z.boolean().optional(),
    name: z.string().trim().min(1).max(120).optional(),
    companyId: z.number().int().positive().optional(),
}).refine((b) => Object.keys(b).length > 0, { message: 'Nothing to update.' });

const runsQuery = z.object({ limit: z.coerce.number().int().min(1).max(100).default(20) });

const sourceSelect = {
    id: true, name: true, kind: true, boardToken: true, isEnabled: true, health: true, lastRunAt: true, lastSuccessAt: true,
    lastFetchedCount: true, lastKeptCount: true, consecutiveFailures: true, lastError: true, createdAt: true,
    company: { select: { id: true, name: true, slug: true, status: true } },
    _count: { select: { observations: true } },
};

export const listSources = async (req, res) => {
    try {
        const [sources, pendingRequest] = await Promise.all([
            prisma.source.findMany({ select: sourceSelect, orderBy: [{ kind: 'asc' }, { id: 'asc' }] }),
            getSetting('careers.runRequest'),
        ]);
        const live = await prisma.postingSource.groupBy({ by: ['sourceId'], where: { isLive: true }, _count: { _all: true } });
        const liveBySource = new Map(live.map((r) => [r.sourceId, r._count._all]));
        return res.json({
            success: true,
            data: sources.map((s) => ({ ...s, liveObservations: liveBySource.get(s.id) ?? 0 })),
            pendingRequest,
        });
    } catch (err) {
        return sendError(res, err, 'listSources');
    }
};

// Validate-on-create: the board is fetched once; a token that doesn't work is a 400, not a FAILING
// source the next morning.
export const createSource = async (req, res) => {
    try {
        const body = createBody.parse(req.body);
        const company = await prisma.company.findUnique({ where: { id: body.companyId }, select: { id: true, name: true, status: true } });
        if (!company) throw new CareersError(404, 'NOT_FOUND', `Company #${body.companyId} was not found.`);
        if (company.status === 'MERGED') throw new CareersError(409, 'COMPANY_MERGED', `${company.name} is merged into another company; pick that one.`);

        const exists = await prisma.source.findUnique({ where: { kind_boardToken: { kind: body.kind, boardToken: body.boardToken } } });
        if (exists) throw new CareersError(409, 'SOURCE_EXISTS', `This board is already source #${exists.id} (${exists.name}).`, { sourceId: exists.id });

        let check;
        try {
            check = await fetchPostings({ kind: body.kind, boardToken: body.boardToken });
        } catch (err) {
            throw new CareersError(400, 'BOARD_INVALID', `The ${body.kind.toLowerCase()} board "${body.boardToken}" could not be read: ${err.message}`);
        }
        const kept = check.postings.filter((p) => evaluateRelevance(p).keep).length;

        const source = await prisma.source.create({
            data: { kind: body.kind, boardToken: body.boardToken, companyId: company.id, name: body.name ?? `${company.name} (${body.kind.toLowerCase()})` },
            select: sourceSelect,
        });
        return res.status(201).json({
            success: true,
            message: `Board added: ${check.fetchedCount} jobs now, ${kept} look relevant (India, early career). It runs with the next ingest.`,
            data: { source, check: { fetchedCount: check.fetchedCount, relevantNow: kept } },
        });
    } catch (err) {
        return sendError(res, err, 'createSource');
    }
};

export const updateSource = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        const body = updateBody.parse(req.body);
        const source = await prisma.source.findUnique({ where: { id } });
        if (!source) throw new CareersError(404, 'NOT_FOUND', `Source #${id} was not found.`);
        if (!ATS_KINDS.includes(source.kind) && body.isEnabled === false) {
            throw new CareersError(400, 'VALIDATION_ERROR', 'The MANUAL and STUDENT_LINK system sources cannot be disabled.');
        }
        const data = { ...body };
        // Health follows the switch at once; a re-enabled source is UNKNOWN until its next run.
        if (body.isEnabled === false) data.health = 'DISABLED';
        if (body.isEnabled === true && !source.isEnabled) data.health = 'UNKNOWN';
        const updated = await prisma.source.update({ where: { id }, data, select: sourceSelect });
        return res.json({ success: true, message: 'Source updated.', data: updated });
    } catch (err) {
        return sendError(res, err, 'updateSource');
    }
};

// Pure: combines a new run request with one still waiting. Two different sources -> run all.
export function mergeRunRequest(pending, sourceId) {
    if (!pending || pending.sourceId === sourceId) return sourceId;
    return 'ALL';
}

async function requestRun(sourceId, userId) {
    clearSettingsCache();
    const pending = await getSetting('careers.runRequest');
    const request = { sourceId: mergeRunRequest(pending, sourceId), requestedAt: new Date().toISOString(), byUserId: userId };
    await setSetting('careers.runRequest', request, userId);
    return request;
}

export const runSourceNow = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        const source = await prisma.source.findUnique({ where: { id } });
        if (!source) throw new CareersError(404, 'NOT_FOUND', `Source #${id} was not found.`);
        if (!ATS_KINDS.includes(source.kind)) throw new CareersError(400, 'VALIDATION_ERROR', `${source.kind} sources are not fetched from a board.`);
        if (!source.isEnabled) throw new CareersError(409, 'SOURCE_DISABLED', 'Enable the source before running it.');
        const request = await requestRun(id, req.user.id);
        return res.status(202).json({ success: true, message: 'Run requested. The worker picks it up within about a minute.', data: request });
    } catch (err) {
        return sendError(res, err, 'runSourceNow');
    }
};

export const runAllNow = async (req, res) => {
    try {
        const request = await requestRun('ALL', req.user.id);
        return res.status(202).json({ success: true, message: 'Run of all sources requested. The worker picks it up within about a minute.', data: request });
    } catch (err) {
        return sendError(res, err, 'runAllNow');
    }
};

export const listRuns = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        const { limit } = runsQuery.parse(req.query);
        const runs = await prisma.sourceRun.findMany({ where: { sourceId: id }, orderBy: { startedAt: 'desc' }, take: limit });
        return res.json({ success: true, data: runs });
    } catch (err) {
        return sendError(res, err, 'listRuns');
    }
};
