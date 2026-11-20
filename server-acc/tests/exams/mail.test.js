import { describe, it, expect } from 'vitest';
import nodemailer from 'nodemailer';
import { sendExamMail } from '../../services/exams/mail.js';

describe('existing Nodemailer transport integration', () => {
    it('sends a single structured recipient and uses the configured sender/message ID', async () => {
        const json = nodemailer.createTransport({ jsonTransport: true });
        let built;
        const transport = { sendMail: async (message) => {
            const result = await json.sendMail(message); built = JSON.parse(result.message); return result;
        } };
        const id = await sendExamMail('one@example.org', { subject: 'Reminder', text: 'Schedule', html: '<p>Schedule</p>' }, { transport, env: { EXAM_REMINDERS_FROM: 'council@example.org' }, messageId: '<exam-test@example.org>' });
        expect(built.to).toEqual([{ address: 'one@example.org', name: '' }]);
        expect(built.from.address).toBe('council@example.org');
        expect(built.text).toBe('Schedule'); expect(built.html).toBe('<p>Schedule</p>');
        expect(id).toBe('<exam-test@example.org>');
    });
    it('treats a rejected recipient as a permanent failure', async () => {
        await expect(sendExamMail('one@example.org', {}, { transport: { sendMail: async () => ({ accepted: [], rejected: ['one@example.org'] }) }, env: {} })).rejects.toMatchObject({ permanent: true });
    });
});
