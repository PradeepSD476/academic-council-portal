import { getNotificationSettings, saveNotificationSettings } from '../services/notifications/preferences.js';

export async function readNotificationSettings(req, res) {
    try { return res.json({ success: true, data: await getNotificationSettings(req.user.id) }); }
    catch (err) { console.error('[notifications] Settings read failed', err.message); return res.status(500).json({ success: false, message: 'Unable to load notification settings. Please try again.' }); }
}
export async function updateNotificationSettings(req, res) {
    try { return res.json({ success: true, data: await saveNotificationSettings(req.user.id, req.body) }); }
    catch (err) {
        if (err.name === 'ZodError') return res.status(400).json({ success: false, message: 'Provide only notification settings with true or false values.' });
        console.error('[notifications] Settings update failed', err.message);
        return res.status(500).json({ success: false, message: 'Unable to save notification settings. Please try again.' });
    }
}
