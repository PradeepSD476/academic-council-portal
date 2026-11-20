import { DateTime } from 'luxon';
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const missingRoomText = 'Room not assigned yet, please check with the exam cell';

export function reminderMail(recipient, date, config) {
    const day = DateTime.fromISO(date, { zone: config.timezone }).setLocale('en').toFormat('cccc, dd LLL yyyy');
    const subject = `${config.examName}: Your exam schedule for ${day}`;
    const lines = recipient.exams.map((e) => ({ ...e, roomText: e.missingRoom ? missingRoomText : e.ambiguousRoom ? `${e.rooms.join(' / ')} — conflicting room assignments; please verify with the exam cell` : e.rooms.join(', ') }));
    const note = 'Carry your ID card. Please verify details with your department if anything looks wrong.';
    const text = [`${config.examName}`, `Roll: ${recipient.roll}`, `Date: ${day}`, '', ...lines.map((e) => `${e.clash ? 'CLASH WARNING: ' : ''}${e.course} | ${e.slot} | ${e.time} | ${e.roomText}`), '', note, '', 'Academic & Career Council, IIT Patna'].join('\n');
    const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="font-family:Arial,sans-serif;color:#0f172a;margin:0;padding:16px"><div style="max-width:600px;margin:auto">
      <h2 style="font-size:20px">${escapeHtml(config.examName)}</h2><p><b>Roll:</b> ${escapeHtml(recipient.roll)}<br><b>Date:</b> ${escapeHtml(day)}</p>
      ${lines.map((e) => `<div style="border:1px solid #cbd5e1;border-radius:8px;padding:12px;margin:12px 0">${e.clash ? '<p style="color:#b91c1c;font-weight:bold;margin:0 0 8px">CLASH WARNING: More than one exam in this slot. Contact the exam cell.</p>' : ''}<b>${escapeHtml(e.course)}</b><br>${escapeHtml(e.slot)} · ${escapeHtml(e.time)}<br><b>Room:</b> ${escapeHtml(e.roomText)}</div>`).join('')}
      <p style="font-size:13px;color:#475569">${escapeHtml(note)}</p><p>Academic &amp; Career Council<br>IIT Patna</p></div></body></html>`;
    return { subject, text, html };
}

export function summaryMail(summary) {
    const counts = summary.counts || {};
    const text = [`Exam reminder: ${summary.datasetId} / ${summary.date}`, `Mode: ${summary.mode}`, `Source: ${summary.source?.source || 'unavailable'}`, `Source timestamp: ${summary.source?.fetchedAt || '-'}`, `Outcome: ${summary.outcome}`, ...Object.entries(counts).map(([k, v]) => `${k}: ${v}`), ...(summary.error ? [`Error: ${summary.error}`] : []), 'Full data-quality details are attached.'].join('\n');
    return { subject: `[ACC exams] ${summary.datasetId} ${summary.date}: ${summary.outcome}`, text, html: `<div style="font-family:Arial,sans-serif"><pre style="white-space:pre-wrap">${escapeHtml(text)}</pre></div>`, attachments: [{ filename: 'exam-reminder-report.json', content: JSON.stringify(summary, null, 2), contentType: 'application/json' }] };
}

export async function sendExamMail(to, message, { transport, env = process.env, messageId } = {}) {
    if (!transport) ({ default: transport } = await import('../../utils/mail/transporter.js'));
    const result = await transport.sendMail({ from: `"Academic & Career Council" <${env.EXAM_REMINDERS_FROM || env.SMTP_USER}>`, ...message, to: { address: to }, ...(messageId ? { messageId } : {}) });
    if (result.rejected?.length || (Array.isArray(result.accepted) && result.accepted.length === 0)) {
        const err = new Error('Mail provider rejected the recipient'); err.permanent = true; throw err;
    }
    return result.messageId;
}
