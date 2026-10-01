// Runs every enabled ATS source, one after another. One source failing never stops the others
// (Architecture 6.1). Called by the worker (daily) and by scripts/careers/runJob.js.
import prisma from '../../../config/db.js';
import { getSetting } from '../settings.js';
import { runSource } from './runSource.js';

export const ATS_KINDS = ['GREENHOUSE', 'LEVER', 'ASHBY'];

// options.sourceId: run only that source (admin "Run now").
// Returns { skipped: null | reason, results: runSource results }.
export async function ingestAll({ sourceId = null } = {}) {
    if (!(await getSetting('careers.ingestionEnabled'))) {
        console.warn('[careers] ingest skipped: careers.ingestionEnabled is off');
        return { skipped: 'ingestion disabled (careers.ingestionEnabled = false)', results: [] };
    }

    // Disabled sources are not run; show that on their health badge.
    await prisma.source.updateMany({
        where: { kind: { in: ATS_KINDS }, isEnabled: false, health: { not: 'DISABLED' } },
        data: { health: 'DISABLED' },
    });

    const sources = await prisma.source.findMany({
        where: { kind: { in: ATS_KINDS }, ...(sourceId ? { id: sourceId } : { isEnabled: true }) },
        orderBy: { id: 'asc' },
    });
    if (sourceId) {
        if (!sources.length) return { skipped: `source #${sourceId} is not an ATS source`, results: [] };
        if (!sources[0].isEnabled) return { skipped: `source #${sourceId} is disabled`, results: [] };
    }

    const results = [];
    for (const source of sources) {
        try {
            results.push(await runSource(source));
        } catch (err) {
            // runSource records its own failures; this only catches database errors while doing so.
            console.error(`[careers] source #${source.id} crashed`, err);
            results.push({ sourceId: source.id, status: 'FAILED', error: err.message });
        }
    }
    return { skipped: null, results };
}
