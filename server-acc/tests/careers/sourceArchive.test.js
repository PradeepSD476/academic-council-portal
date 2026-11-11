import { describe, it, expect } from 'vitest';
import { archiveProblem, archiveData, restoreData, enableProblem } from '../../services/careers/sources/archive.js';

const src = (over = {}) => ({ id: 3, kind: 'GREENHOUSE', boardToken: 'acme', isEnabled: true, archivedAt: null, ...over });
const now = new Date('2026-10-10T12:00:00Z');

describe('archive a source (P6-T11, F-07)', () => {
    it('archives an ATS board: disabled and hidden, nothing deleted', () => {
        expect(archiveProblem(src())).toBeNull();
        expect(archiveData(now)).toEqual({ archivedAt: now, isEnabled: false, health: 'DISABLED' });
    });
    it('refuses the MANUAL / STUDENT_LINK system sources and an already archived one', () => {
        expect(archiveProblem(src({ kind: 'MANUAL', boardToken: null }))).toMatch(/system source/i);
        expect(archiveProblem(src({ archivedAt: now }))).toMatch(/already archived/i);
    });
    it('restore brings it back to the list, still disabled', () => {
        expect(restoreData()).toEqual({ archivedAt: null });
    });
    it('an archived source cannot be enabled until it is restored', () => {
        expect(enableProblem(src({ archivedAt: now, isEnabled: false }), { isEnabled: true })).toMatch(/restore/i);
        expect(enableProblem(src({ archivedAt: now, isEnabled: false }), { name: 'New name' })).toBeNull();
        expect(enableProblem(src(), { isEnabled: true })).toBeNull();
    });
});
