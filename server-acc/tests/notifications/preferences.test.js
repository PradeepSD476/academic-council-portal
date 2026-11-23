import { describe, it, expect, beforeEach, vi } from 'vitest';
const db = vi.hoisted(() => ({ userNotificationSettings: { findUnique: vi.fn(), upsert: vi.fn() }, user: { findUnique: vi.fn() } }));
vi.mock('../../config/db.js', () => ({ default: db }));
import { DEFAULT_NOTIFICATION_SETTINGS, getNotificationSettings, saveNotificationSettings, notificationAllowed, notificationRecipientWhere } from '../../services/notifications/preferences.js';
import { readNotificationSettings, updateNotificationSettings } from '../../controllers/notificationSettingsController.js';

const response = () => ({ status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
beforeEach(() => vi.resetAllMocks());
describe('separate user notification settings', () => {
    it('defaults every category to true without inserting a row on read', async () => {
        db.userNotificationSettings.findUnique.mockResolvedValue(null);
        expect(await getNotificationSettings(7)).toEqual(DEFAULT_NOTIFICATION_SETTINGS);
        expect(db.userNotificationSettings.upsert).not.toHaveBeenCalled();
    });
    it('returns stored false values and updates only fields supplied', async () => {
        const row = { ...DEFAULT_NOTIFICATION_SETTINGS, jobsInternshipsEnabled: false };
        db.userNotificationSettings.findUnique.mockResolvedValue(row);
        expect(await getNotificationSettings(7)).toEqual(row);
        db.userNotificationSettings.upsert.mockResolvedValue({ ...row, resourcesEnabled: false });
        await saveNotificationSettings(7, { resourcesEnabled: false });
        expect(db.userNotificationSettings.upsert.mock.calls[0][0]).toMatchObject({ where: { userId: 7 }, create: { userId: 7, resourcesEnabled: false }, update: { resourcesEnabled: false } });
    });
    it.each([{}, { jobsInternshipsEnabled: 'false' }, { announcementsEnabled: null }, { resourcesEnabled: 0 }, { userId: 9 }, { email: 'other@example.org' }, { jobsInternshipsEnabled: false, role: 'SUPER_ADMIN' }])('rejects invalid/foreign fields %j', async (body) => {
        await expect(saveNotificationSettings(7, body)).rejects.toThrow();
        expect(db.userNotificationSettings.upsert).not.toHaveBeenCalled();
    });
    it('uses only the authenticated user id, never another account from the body', async () => {
        db.userNotificationSettings.upsert.mockResolvedValue(DEFAULT_NOTIFICATION_SETTINGS);
        const res = response(); await updateNotificationSettings({ user: { id: 7 }, body: { announcementsEnabled: false } }, res);
        expect(res.body.success).toBe(true);
        expect(db.userNotificationSettings.upsert.mock.calls[0][0].where.userId).toBe(7);
        const denied = response(); await updateNotificationSettings({ user: { id: 7 }, body: { userId: 9, announcementsEnabled: false } }, denied);
        expect(denied.code).toBe(400);
    });
    it('returns a retryable API error instead of pretending all settings are enabled on DB failure', async () => {
        db.userNotificationSettings.findUnique.mockRejectedValue(new Error('offline'));
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const res = response(); await readNotificationSettings({ user: { id: 7 } }, res);
        expect(res.code).toBe(500); expect(res.body).not.toHaveProperty('data');
        spy.mockRestore();
    });
    it('checks current preferences immediately before sending and treats missing users as ineligible', async () => {
        db.user.findUnique.mockResolvedValue({ notificationSettings: null });
        expect(await notificationAllowed(7, 'resourcesEnabled')).toBe(true);
        db.user.findUnique.mockResolvedValue({ notificationSettings: { resourcesEnabled: false } });
        expect(await notificationAllowed(7, 'resourcesEnabled')).toBe(false);
        db.user.findUnique.mockResolvedValue(null);
        expect(await notificationAllowed(7, 'resourcesEnabled')).toBe(false);
        db.user.findUnique.mockRejectedValue(new Error('offline'));
        await expect(notificationAllowed(7, 'resourcesEnabled')).rejects.toThrow('offline');
    });
    it('recipient queries include missing rows and reject unknown category names', () => {
        expect(notificationRecipientWhere('jobsInternshipsEnabled')).toEqual({ OR: [{ notificationSettings: { is: null } }, { notificationSettings: { is: { jobsInternshipsEnabled: true } } }] });
        expect(() => notificationRecipientWhere('toString')).toThrow(/Unknown/);
    });
});
