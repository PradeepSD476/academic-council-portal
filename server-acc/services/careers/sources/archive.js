// Archive / restore an ATS source (P6-T11, F-07). Archived = disabled, hidden on Sources by default,
// skipped by the worker; its postings and runs keep their history. Nothing is deleted (a hard delete
// is ⚖️ and not built, D-01).
import { ATS_KINDS } from '../ingest/ingestAll.js';

// Pure. Why this source can't be archived, or null.
export function archiveProblem(source) {
    if (!ATS_KINDS.includes(source.kind)) return 'The MANUAL and STUDENT_LINK system sources cannot be archived.';
    if (source.archivedAt) return 'This source is already archived.';
    return null;
}

export const archiveData = (now = new Date()) => ({ archivedAt: now, isEnabled: false, health: 'DISABLED' });

// Restored sources come back disabled; an admin enables them when wanted.
export const restoreData = () => ({ archivedAt: null });

// Pure. An archived source must be restored before it can be enabled again.
export function enableProblem(source, body) {
    return source.archivedAt && body.isEnabled === true ? 'Restore this source before enabling it.' : null;
}
