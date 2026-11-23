import { z } from 'zod';
import prisma from '../../config/db.js';

export const DEFAULT_NOTIFICATION_SETTINGS = Object.freeze({ resourcesEnabled: true, careerVaultExperiencesEnabled: true, jobsInternshipsEnabled: true, announcementsEnabled: true });
export const notificationPatch = z.object(Object.fromEntries(Object.keys(DEFAULT_NOTIFICATION_SETTINGS).map((key) => [key, z.boolean().optional()]))).strict().refine((data) => Object.keys(data).length > 0, 'Choose at least one notification setting.');
export const notificationSettingsSelect = Object.fromEntries(Object.keys(DEFAULT_NOTIFICATION_SETTINGS).map((key) => [key, true]));

export const effectiveNotificationSettings = (row) => Object.fromEntries(Object.entries(DEFAULT_NOTIFICATION_SETTINGS).map(([key, value]) => [key, row?.[key] ?? value]));
export async function getNotificationSettings(userId, db = prisma) {
    return effectiveNotificationSettings(await db.userNotificationSettings.findUnique({ where: { userId }, select: notificationSettingsSelect }));
}
export async function saveNotificationSettings(userId, body, db = prisma) {
    const updates = notificationPatch.parse(body);
    return db.userNotificationSettings.upsert({ where: { userId }, create: { userId, ...updates }, update: updates, select: notificationSettingsSelect });
}
export function notificationRecipientWhere(category) {
    if (!Object.hasOwn(DEFAULT_NOTIFICATION_SETTINGS, category)) throw new Error(`Unknown notification category: ${category}`);
    return { OR: [{ notificationSettings: { is: null } }, { notificationSettings: { is: { [category]: true } } }] };
}
export async function notificationAllowed(userId, category, db = prisma) {
    if (!Object.hasOwn(DEFAULT_NOTIFICATION_SETTINGS, category)) throw new Error(`Unknown notification category: ${category}`);
    // A missing settings row is the all-enabled default. A DB failure propagates: never
    // silently treat an unreadable opt-out as permission to send.
    const user = await db.user.findUnique({ where: { id: userId }, select: { notificationSettings: { select: { [category]: true } } } });
    return Boolean(user) && (user.notificationSettings?.[category] ?? true);
}

export const validNotificationEmail = (email) => typeof email === 'string' && /^[^\s@<>,;:"()[\]\\]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/.test(email.trim()) && !/[\r\n]/.test(email);
