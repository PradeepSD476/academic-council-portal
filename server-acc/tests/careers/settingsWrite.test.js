import { describe, it, expect, vi, beforeEach } from 'vitest';

const db = vi.hoisted(() => ({}));
vi.mock('../../config/db.js', () => ({ default: db }));

const { setSettings } = await import('../../services/careers/settings.js');

beforeEach(() => {
    Object.assign(db, {
        appSetting: { upsert: vi.fn((args) => ({ op: 'upsert', key: args.where.key })) },
        $transaction: vi.fn(async (ops) => ops),
    });
});

describe('setSettings (B-13)', () => {
    it('writes every key in one transaction', async () => {
        await setSettings({ 'careers.submissionDailyLimit': 3, 'careers.visibleToStudents': true }, 7);
        expect(db.$transaction).toHaveBeenCalledTimes(1);
        expect(db.$transaction.mock.calls[0][0].map((o) => o.key)).toEqual(['careers.submissionDailyLimit', 'careers.visibleToStudents']);
        expect(db.appSetting.upsert.mock.calls[0][0]).toMatchObject({ update: { value: 3, updatedById: 7 } });
    });
    it('validates everything before writing anything', async () => {
        await expect(setSettings({ 'careers.submissionDailyLimit': 3, 'careers.fuzzyThreshold': 1.7 }, 7)).rejects.toThrow();
        expect(db.$transaction).not.toHaveBeenCalled();
    });
});
