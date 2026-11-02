// Adding ATS boards as sources: one at a time (Add board) or many from a paste (P6-T1, F-23).
// Every board is read once before it is saved, so a wrong token is reported instead of becoming a
// FAILING source on its next run.
import { CareersError } from '../errors.js';
import { fetchPostings } from '../ingest/adapters/index.js';
import { evaluateRelevance } from '../text/relevance.js';
import { resolveCompany } from '../companies/resolveCompany.js';

const BOARD_CHECKS_AT_ONCE = 4;
// Bulk lines name the company as text. Only exact and normalised matches are used; anything else
// becomes a CANDIDATE company for an admin to confirm, never a fuzzy guess.
const NO_FUZZY = 2;

export const defaultSourceName = (companyName, kind) => `${companyName} (${kind.toLowerCase()})`;

export async function existingBoard(prisma, kind, boardToken) {
    return prisma.source.findUnique({ where: { kind_boardToken: { kind, boardToken } } });
}

// Reads the board; returns { fetchedCount, relevantNow } or throws a 400 BOARD_INVALID.
export async function checkBoard(kind, boardToken, fetchBoard = fetchPostings) {
    let check;
    try {
        check = await fetchBoard({ kind, boardToken });
    } catch (err) {
        throw new CareersError(400, 'BOARD_INVALID', `The ${kind.toLowerCase()} board "${boardToken}" could not be read: ${err.message}`);
    }
    return { fetchedCount: check.fetchedCount, relevantNow: check.postings.filter((p) => evaluateRelevance(p).keep).length };
}

// Runs fn over items, at most `limit` at a time, keeping the order of the results.
async function mapLimited(items, limit, fn) {
    const out = new Array(items.length);
    let next = 0;
    const worker = async () => {
        while (next < items.length) {
            const i = next++;
            out[i] = await fn(items[i]);
        }
    };
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return out;
}

// entries: from parseBulkLines. Returns one result per entry, in order:
// { lineNo, kind, boardToken, companyName, result: 'added' | 'skipped' | 'failed', message,
//   sourceId?, companyCreated?, fetchedCount?, relevantNow? }
// Boards are read a few at a time; companies and sources are then created one by one, so two lines
// for the same new company share one candidate.
export async function bulkAddBoards(prisma, entries, { index, fetchBoard = fetchPostings, select } = {}) {
    const checked = await mapLimited(entries, BOARD_CHECKS_AT_ONCE, async (entry) => {
        const exists = await existingBoard(prisma, entry.kind, entry.boardToken);
        // B-38: an archived board is hidden on Sources, so say where it is.
        if (exists) return { entry, skip: `Already source #${exists.id} (${exists.name})${exists.archivedAt ? ', archived: restore it under Sources → Show archived' : ''}.` };
        try {
            return { entry, check: await checkBoard(entry.kind, entry.boardToken, fetchBoard) };
        } catch (err) {
            return { entry, error: err.message };
        }
    });

    const results = [];
    for (const { entry, skip, error, check } of checked) {
        const base = { lineNo: entry.lineNo, kind: entry.kind, boardToken: entry.boardToken, companyName: entry.companyName };
        if (skip) {
            results.push({ ...base, result: 'skipped', message: skip });
            continue;
        }
        if (error) {
            results.push({ ...base, result: 'failed', message: error });
            continue;
        }
        try {
            const resolved = await resolveCompany(prisma, entry.companyName, index, { fuzzyThreshold: NO_FUZZY });
            if (!resolved) throw new CareersError(400, 'VALIDATION_ERROR', 'The company name is empty after cleaning.');
            const company = await prisma.company.findUnique({ where: { id: resolved.companyId }, select: { id: true, name: true, rejectedAt: true } });
            // B-38: never attach a new board to a company an admin rejected.
            if (company.rejectedAt) {
                results.push({ ...base, result: 'failed', message: `${company.name} was rejected as a company. Restore it under Jobs review → Candidate companies → Show rejected, or use the employer's real name.` });
                continue;
            }
            const source = await prisma.source.create({
                data: { kind: entry.kind, boardToken: entry.boardToken, companyId: company.id, name: defaultSourceName(company.name, entry.kind) },
                ...(select ? { select } : {}),
            });
            results.push({
                ...base,
                companyName: company.name,
                result: 'added',
                message: `${check.fetchedCount} jobs now, ${check.relevantNow} ${check.relevantNow === 1 ? 'looks' : 'look'} relevant.${resolved.created ? ' New company: confirm it under Jobs review → Candidates.' : ''}`,
                sourceId: source.id,
                companyCreated: resolved.created,
                ...check,
            });
        } catch (err) {
            // Another admin added the same board a moment ago.
            if (err?.code === 'P2002') results.push({ ...base, result: 'skipped', message: 'Added by someone else just now.' });
            else results.push({ ...base, result: 'failed', message: err.message });
        }
    }
    return results;
}

// Pure. Counts for the summary line.
export function bulkSummary(results, errors = []) {
    const count = (r) => results.filter((x) => x.result === r).length;
    return { added: count('added'), skipped: count('skipped'), failed: count('failed') + errors.length };
}
