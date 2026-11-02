import { SETTINGS, getAllSettings, setSettings } from '../../services/careers/settings.js';

export const getSettings = async (req, res) => {
    try {
        const data = await getAllSettings();
        return res.status(200).json({ success: true, message: 'Settings fetched.', data });
    } catch (err) {
        console.error('[careers] getSettings', err);
        return res.status(500).json({
            success: false,
            error: 'SERVER_ERROR',
            message: 'Unable to fetch settings. Please try again.',
        });
    }
};

// Body: { "<key>": <value>, ... }. All values are validated before anything is written, so a
// partly-invalid request changes nothing.
export const updateSettings = async (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length === 0) {
        return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Send an object of { settingKey: value }.',
        });
    }

    const details = [];
    const parsed = {};
    for (const [key, value] of Object.entries(body)) {
        const def = SETTINGS[key];
        if (!def) {
            details.push({ key, issue: 'Unknown setting.' });
            continue;
        }
        if (!def.editable) {
            details.push({ key, issue: 'This setting cannot be changed here.' });
            continue;
        }
        const result = def.schema.safeParse(value);
        if (!result.success) {
            details.push({ key, issue: result.error.issues.map((i) => i.message).join('; ') });
            continue;
        }
        parsed[key] = result.data;
    }
    if (details.length) {
        return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Some settings are invalid. Nothing was changed.',
            details,
        });
    }

    try {
        await setSettings(parsed, req.user.id);
        const data = await getAllSettings();
        return res.status(200).json({ success: true, message: 'Settings updated.', data });
    } catch (err) {
        console.error('[careers] updateSettings', err);
        return res.status(500).json({
            success: false,
            error: 'SERVER_ERROR',
            message: 'Unable to update settings. Please try again.',
        });
    }
};
