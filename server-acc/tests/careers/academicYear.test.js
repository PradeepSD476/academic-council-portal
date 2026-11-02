import { describe, it, expect } from 'vitest';
import { academicYearStart, currentAcademicYear } from '../../services/careers/academicYear.js';

describe('academicYearStart', () => {
    it('June still belongs to the previous academic year', () => {
        expect(academicYearStart(new Date(2026, 5, 30))).toBe(2025);
    });
    it('July starts a new academic year', () => {
        expect(academicYearStart(new Date(2026, 6, 1))).toBe(2026);
    });
    it('January belongs to the academic year that started the previous July', () => {
        expect(academicYearStart(new Date(2027, 0, 15))).toBe(2026);
    });
});

describe('currentAcademicYear', () => {
    it('a 2024 admit is in year 3 during Sep 2026', () => {
        expect(currentAcademicYear(2024, new Date(2026, 8, 29))).toBe(3);
    });
    it('a 2024 admit is in year 2 during May 2026', () => {
        expect(currentAcademicYear(2024, new Date(2026, 4, 1))).toBe(2);
    });
    it('matches the forum eligibility formula (year > 2 may post)', () => {
        const now = new Date(2026, 8, 29);
        expect(currentAcademicYear(2025, now)).toBe(2);
        expect(currentAcademicYear(2023, now)).toBe(4);
    });
    it('returns null for unknown admission year', () => {
        expect(currentAcademicYear(null)).toBeNull();
        expect(currentAcademicYear(undefined)).toBeNull();
        expect(currentAcademicYear('2024')).toBeNull();
    });
});
