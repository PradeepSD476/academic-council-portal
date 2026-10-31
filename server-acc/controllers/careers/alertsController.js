// Job alerts (P7-T1, F-19): a student's saved searches, and the no-login unsubscribe link from the
// digest email. Everything except unsubscribe / resubscribe is scoped to req.user.
import crypto from 'node:crypto';
import { z } from 'zod';
import prisma from '../../config/db.js';
import { sendError, CareersError, parseId } from '../../services/careers/errors.js';
import { getSetting } from '../../services/careers/settings.js';
import { alertBody, alertUpdateBody, cleanFilters, filterSummary, MAX_ALERTS } from '../../services/careers/alerts/savedSearch.js';

const alertSelect = {
    id: true, name: true, filters: true, frequency: true, unsubscribedAt: true,
    lastSentAt: true, lastSentCount: true, lastError: true, createdAt: true,
};
// The send error can carry SMTP server details, so students only learn that the last email failed
// (the text stays in the row and the API log for ACC).
const withSummary = ({ lastError, ...a }) => ({ ...a, emailFailed: Boolean(lastError), summary: filterSummary(a.filters) });

async function ownAlert(id, userId) {
    const alert = await prisma.savedSearch.findFirst({ where: { id, userId }, select: { id: true } });
    if (!alert) throw new CareersError(404, 'NOT_FOUND', 'This alert was not found.');
}

export const listAlerts = async (req, res) => {
    try {
        const alerts = await prisma.savedSearch.findMany({ where: { userId: req.user.id }, select: alertSelect, orderBy: { id: 'asc' } });
        const emailsOn = await getSetting('careers.alertEmailsEnabled');
        return res.json({ success: true, data: alerts.map(withSummary), meta: { max: MAX_ALERTS, emailsOn } });
    } catch (err) {
        return sendError(res, err, 'listAlerts');
    }
};

export const createAlert = async (req, res) => {
    try {
        const body = alertBody.parse(req.body ?? {});
        const filters = cleanFilters(body.filters);
        const count = await prisma.savedSearch.count({ where: { userId: req.user.id } });
        if (count >= MAX_ALERTS) {
            throw new CareersError(409, 'ALERT_LIMIT', `You can keep up to ${MAX_ALERTS} job alerts. Delete one to add another.`);
        }
        const alert = await prisma.savedSearch.create({
            data: { userId: req.user.id, name: body.name, filters, frequency: body.frequency, token: crypto.randomBytes(24).toString('base64url') },
            select: alertSelect,
        });
        const when = body.frequency === 'DAILY' ? 'each morning' : 'once a week';
        return res.status(201).json({ success: true, message: `Alert saved. New matching openings will be emailed ${when}.`, data: withSummary(alert) });
    } catch (err) {
        return sendError(res, err, 'createAlert');
    }
};

export const updateAlert = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        const body = alertUpdateBody.parse(req.body ?? {});
        await ownAlert(id, req.user.id);
        const data = { name: body.name, frequency: body.frequency };
        if (body.paused !== undefined) data.unsubscribedAt = body.paused ? new Date() : null;
        const alert = await prisma.savedSearch.update({ where: { id }, data, select: alertSelect });
        return res.json({ success: true, data: withSummary(alert) });
    } catch (err) {
        return sendError(res, err, 'updateAlert');
    }
};

// The student's own alert; nothing else refers to it.
export const deleteAlert = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        await ownAlert(id, req.user.id);
        await prisma.savedSearch.delete({ where: { id } });
        return res.json({ success: true, message: 'Alert deleted.' });
    } catch (err) {
        return sendError(res, err, 'deleteAlert');
    }
};

const tokenBody = z.object({ token: z.string().min(16).max(100) }).strict();

// No login (the link in the email). Opening the link unsubscribes at once; "Turn it back on" undoes it.
const setSubscribed = (subscribed) => async (req, res) => {
    try {
        const { token } = tokenBody.parse(req.body ?? {});
        const alert = await prisma.savedSearch.findUnique({ where: { token }, select: { id: true, name: true } });
        if (!alert) throw new CareersError(404, 'NOT_FOUND', 'This link is not valid any more. The alert may have been deleted.');
        await prisma.savedSearch.update({ where: { id: alert.id }, data: { unsubscribedAt: subscribed ? null : new Date() } });
        return res.json({ success: true, data: { name: alert.name, subscribed } });
    } catch (err) {
        return sendError(res, err, subscribed ? 'resubscribeAlert' : 'unsubscribeAlert');
    }
};

export const unsubscribeAlert = setSubscribed(false);
export const resubscribeAlert = setSubscribed(true);
