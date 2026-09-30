// Merge, split and undo for the company registry. Automatic name matching is sometimes wrong
// (proposal 2.2), so every correction is logged in CompanyMergeLog and can be reversed.
// Each operation runs in one transaction. Companies are never deleted; a merged company keeps
// its row with status MERGED.
import prisma from '../../../config/db.js';
import { CareersError } from '../errors.js';
import { normalizeCompanyName } from '../text/normalize.js';
import { uniqueSlug } from './slug.js';

// Things that belong to a company and move with it. P1 adds postings and sources here.
const MOVABLE = [
    { key: 'aliasIds', model: 'companyAlias' },
    { key: 'experienceIds', model: 'experience' },
];

function emptyMoved() {
    return { aliasIds: [], experienceIds: [], postingIds: [], sourceIds: [] };
}

async function loadCompany(tx, id, label) {
    const company = await tx.company.findUnique({ where: { id } });
    if (!company) throw new CareersError(404, 'NOT_FOUND', `${label} company #${id} was not found.`);
    return company;
}

async function moveIds(tx, model, ids, fromCompanyId, toCompanyId) {
    if (!ids.length) return 0;
    // Only rows still attached to fromCompanyId move, so an undo never steals rows that were
    // re-assigned elsewhere after the original operation.
    const result = await tx[model].updateMany({
        where: { id: { in: ids }, companyId: fromCompanyId },
        data: { companyId: toCompanyId },
    });
    return result.count;
}

export async function mergeCompanies({ fromId, toId, userId }) {
    if (fromId === toId) throw new CareersError(400, 'VALIDATION_ERROR', 'A company cannot be merged into itself.');
    return prisma.$transaction(async (tx) => {
        const from = await loadCompany(tx, fromId, 'Source');
        const to = await loadCompany(tx, toId, 'Target');
        if (from.status === 'MERGED') throw new CareersError(409, 'ALREADY_MERGED', `${from.name} is already merged into another company.`);
        if (to.status === 'MERGED') throw new CareersError(409, 'TARGET_MERGED', `${to.name} is merged; merge into the company it points to instead.`);

        const moved = emptyMoved();
        for (const { key, model } of MOVABLE) {
            const rows = await tx[model].findMany({ where: { companyId: fromId }, select: { id: true } });
            moved[key] = rows.map((r) => r.id);
            await moveIds(tx, model, moved[key], fromId, toId);
        }
        moved.previousStatus = from.status;

        await tx.company.update({ where: { id: fromId }, data: { status: 'MERGED', mergedIntoId: toId } });
        const log = await tx.companyMergeLog.create({
            data: { action: 'MERGE', fromCompanyId: fromId, toCompanyId: toId, moved, performedById: userId },
        });
        return { log, from: { id: from.id, name: from.name }, to: { id: to.id, name: to.name }, moved };
    });
}

// Moves the chosen aliases/experiences from company `sourceId` into a new ACTIVE company.
export async function splitCompany({ sourceId, name, aliasIds = [], experienceIds = [], userId }) {
    const cleanName = name.trim().replace(/\s+/g, ' ');
    const normalized = normalizeCompanyName(cleanName);
    if (!normalized) throw new CareersError(400, 'VALIDATION_ERROR', 'The new company needs a name.');
    if (!aliasIds.length && !experienceIds.length) {
        throw new CareersError(400, 'VALIDATION_ERROR', 'Choose at least one alias or experience to move.');
    }

    return prisma.$transaction(async (tx) => {
        const source = await loadCompany(tx, sourceId, 'Source');
        if (source.status === 'MERGED') throw new CareersError(409, 'ALREADY_MERGED', `${source.name} is merged; split the company it points to.`);

        const ownAliases = await tx.companyAlias.findMany({ where: { companyId: sourceId }, select: { id: true } });
        const ownAliasIds = new Set(ownAliases.map((a) => a.id));
        const foreignAlias = aliasIds.find((id) => !ownAliasIds.has(id));
        if (foreignAlias) throw new CareersError(400, 'VALIDATION_ERROR', `Alias #${foreignAlias} does not belong to ${source.name}.`);
        if (aliasIds.length >= ownAliasIds.size) {
            throw new CareersError(400, 'VALIDATION_ERROR', `${source.name} must keep at least one alias.`);
        }
        if (experienceIds.length) {
            const owned = await tx.experience.count({ where: { id: { in: experienceIds }, companyId: sourceId } });
            if (owned !== experienceIds.length) {
                throw new CareersError(400, 'VALIDATION_ERROR', `Some experiences are not linked to ${source.name}.`);
            }
        }

        const slug = await uniqueSlug(cleanName, async (s) => Boolean(await tx.company.findUnique({ where: { slug: s }, select: { id: true } })));
        const created = await tx.company.create({
            data: { name: cleanName, slug, normalizedName: normalized, status: 'ACTIVE' },
        });

        const moved = { ...emptyMoved(), aliasIds, experienceIds, createdAliasIds: [] };
        await moveIds(tx, 'companyAlias', aliasIds, sourceId, created.id);
        await moveIds(tx, 'experience', experienceIds, sourceId, created.id);

        // Make the new company findable by its own name, unless that name is already an alias
        // somewhere (then it stays where it is, to avoid silently re-pointing it).
        const nameTaken = await tx.companyAlias.findUnique({ where: { normalizedAlias: normalized } });
        if (!nameTaken) {
            const alias = await tx.companyAlias.create({
                data: { companyId: created.id, alias: cleanName, normalizedAlias: normalized, origin: 'MANUAL' },
            });
            moved.createdAliasIds.push(alias.id);
        }

        const log = await tx.companyMergeLog.create({
            data: { action: 'SPLIT', fromCompanyId: sourceId, toCompanyId: created.id, moved, performedById: userId },
        });
        return { log, source: { id: source.id, name: source.name }, created, moved };
    });
}

export async function undoMergeLog({ logId, userId }) {
    return prisma.$transaction(async (tx) => {
        const log = await tx.companyMergeLog.findUnique({ where: { id: logId } });
        if (!log) throw new CareersError(404, 'NOT_FOUND', `Log entry #${logId} was not found.`);
        if (log.undoneAt) throw new CareersError(409, 'ALREADY_UNDONE', 'This change was already undone.');

        // Undo in reverse order only: a later change to either company must be undone first,
        // otherwise rows could be moved out from under it.
        const later = await tx.companyMergeLog.findFirst({
            where: {
                id: { gt: log.id },
                undoneAt: null,
                OR: [
                    { fromCompanyId: { in: [log.fromCompanyId, log.toCompanyId] } },
                    { toCompanyId: { in: [log.fromCompanyId, log.toCompanyId] } },
                ],
            },
            orderBy: { id: 'desc' },
        });
        if (later) {
            throw new CareersError(409, 'LATER_CHANGE_EXISTS', `Undo the later ${later.action.toLowerCase()} (#${later.id}) first.`, { blockingLogId: later.id });
        }

        const moved = { ...emptyMoved(), ...(log.moved ?? {}) };
        if (log.action === 'MERGE') {
            for (const { key, model } of MOVABLE) {
                await moveIds(tx, model, moved[key] ?? [], log.toCompanyId, log.fromCompanyId);
            }
            await tx.company.update({
                where: { id: log.fromCompanyId },
                data: { status: moved.previousStatus ?? 'ACTIVE', mergedIntoId: null },
            });
        } else {
            // SPLIT: fold the created company back into the original. Its own name alias is
            // removed; anything attached to it since the split also goes back.
            if (moved.createdAliasIds?.length) {
                await tx.companyAlias.deleteMany({ where: { id: { in: moved.createdAliasIds }, companyId: log.toCompanyId } });
            }
            for (const { model } of MOVABLE) {
                await tx[model].updateMany({ where: { companyId: log.toCompanyId }, data: { companyId: log.fromCompanyId } });
            }
            await tx.company.update({
                where: { id: log.toCompanyId },
                data: { status: 'MERGED', mergedIntoId: log.fromCompanyId },
            });
        }

        return tx.companyMergeLog.update({
            where: { id: log.id },
            data: { undoneAt: new Date(), undoneById: userId },
        });
    });
}
