import { describe, it, expect } from 'vitest';
import { parseCompensation } from '../../services/careers/text/compensation.js';

const stipend = (t) => parseCompensation(t, { kind: 'stipend' });
const ctc = (t) => parseCompensation(t, { kind: 'ctc' });

describe('parseCompensation: stipend (per month)', () => {
    it('range with rupee sign and en dash', () => {
        expect(stipend('₹40,000–60,000 per month')).toMatchObject({ min: 40000, max: 60000, disclosure: 'RANGE', currency: 'INR' });
    });
    it('k suffix with /month', () => {
        expect(stipend('₹50k/month')).toMatchObject({ min: 50000, max: 50000, disclosure: 'DISCLOSED', currency: 'INR' });
    });
    it('"50k/month" without currency defaults to INR', () => {
        expect(stipend('50k/month')).toMatchObject({ min: 50000, max: 50000, disclosure: 'DISCLOSED', currency: 'INR' });
    });
    it('Indian digit grouping and "per month"', () => {
        expect(stipend('Stipend: Rs. 1,00,000 per month')).toMatchObject({ min: 100000, max: 100000, disclosure: 'DISCLOSED' });
    });
    it('"to" range with k units and "monthly"', () => {
        expect(stipend('INR 30k to 45k monthly')).toMatchObject({ min: 30000, max: 45000, disclosure: 'RANGE' });
    });
    it('"1.2L" without a period is UNCLEAR, not guessed', () => {
        expect(stipend('Stipend: 1.2L')).toEqual({ min: null, max: null, disclosure: 'UNCLEAR', currency: 'INR', raw: 'Stipend: 1.2L' });
    });
    it('"1.2L per month" is clear', () => {
        expect(stipend('Stipend: 1.2L per month')).toMatchObject({ min: 120000, max: 120000, disclosure: 'DISCLOSED' });
    });
    it('"competitive" is NOT_DISCLOSED with null amounts (never 0) and keeps the wording', () => {
        expect(stipend('Competitive stipend')).toEqual({ min: null, max: null, disclosure: 'NOT_DISCLOSED', currency: null, raw: 'Competitive stipend' });
    });
    it('"as per industry standards" is NOT_DISCLOSED', () => {
        expect(stipend('As per industry standards').disclosure).toBe('NOT_DISCLOSED');
    });
    it('empty or missing text is NOT_DISCLOSED with raw null', () => {
        expect(stipend('')).toEqual({ min: null, max: null, disclosure: 'NOT_DISCLOSED', currency: null, raw: null });
        expect(stipend(undefined).disclosure).toBe('NOT_DISCLOSED');
    });
    it('"unpaid" is the only case where 0 is a real value', () => {
        expect(stipend('This is an unpaid internship')).toMatchObject({ min: 0, max: 0, disclosure: 'DISCLOSED' });
    });
    it('foreign currency keeps its numbers and currency (no conversion)', () => {
        expect(stipend('$5000/month')).toMatchObject({ min: 5000, max: 5000, disclosure: 'DISCLOSED', currency: 'USD' });
    });
    it('weekly pay is UNCLEAR (we do not convert periods)', () => {
        expect(stipend('₹10,000 per week').disclosure).toBe('UNCLEAR');
    });
    it('ignores durations and years that are not money', () => {
        expect(stipend('6 months internship in 2026, stipend ₹40,000/month')).toMatchObject({ min: 40000, max: 40000 });
    });
    it('a yearly amount given as a stipend is UNCLEAR', () => {
        expect(stipend('₹6,00,000 per annum').disclosure).toBe('UNCLEAR');
    });
});

describe('parseCompensation: CTC (per year)', () => {
    it('"12 LPA"', () => {
        expect(ctc('12 LPA')).toMatchObject({ min: 1200000, max: 1200000, disclosure: 'DISCLOSED', currency: 'INR' });
    });
    it('"12-18 LPA" applies the unit to both ends', () => {
        expect(ctc('CTC: 12-18 LPA')).toMatchObject({ min: 1200000, max: 1800000, disclosure: 'RANGE' });
    });
    it('"12 lakh per annum"', () => {
        expect(ctc('12 lakh per annum')).toMatchObject({ min: 1200000, max: 1200000 });
    });
    it('lakh without a period is annual for CTC', () => {
        expect(ctc('CTC 22.5 lakhs')).toMatchObject({ min: 2250000, max: 2250000, disclosure: 'DISCLOSED' });
    });
    it('crore units', () => {
        expect(ctc('1.2 Cr per annum')).toMatchObject({ min: 12000000, max: 12000000 });
    });
    it('a monthly CTC is UNCLEAR (not multiplied by 12)', () => {
        expect(ctc('₹1,50,000 per month').disclosure).toBe('UNCLEAR');
    });
    it('a plain number without a period is UNCLEAR', () => {
        expect(ctc('Salary 900000').disclosure).toBe('UNCLEAR');
    });
    it('USD per year', () => {
        expect(ctc('$120,000 per year')).toMatchObject({ min: 120000, max: 120000, currency: 'USD', disclosure: 'DISCLOSED' });
    });
    it('"unpaid" does not apply to CTC', () => {
        expect(ctc('unpaid').disclosure).toBe('NOT_DISCLOSED');
    });
});
