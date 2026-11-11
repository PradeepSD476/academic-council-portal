// The job-alert digest email (P7-T1). Pure: builds subject, text and HTML from the postings. Every
// value from the database is escaped; links point to the portal (the reader logs in there).
import { filterSummary } from './savedSearch.js';

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const TYPE = { INTERNSHIP: 'Internship', FULL_TIME: 'Full-time' };
const MODE = { ONSITE: 'On-site', HYBRID: 'Hybrid', REMOTE: 'Remote' };

const dateText = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

function postingLine(p) {
    const bits = [TYPE[p.type], MODE[p.workMode], p.location].filter(Boolean);
    if (p.deadlineStated) bits.push(`Deadline stated by source: ${dateText(p.deadlineStated)}`);
    return { title: `${p.roleTitle} at ${p.company?.name ?? 'Company not stated'}`, details: bits.join(' · ') };
}

// Stored filters are API params; the jobs page types the CTC filter in LPA (minCtcLpa).
export function pageParams(filters = {}) {
    const out = new URLSearchParams();
    for (const [k, v] of Object.entries(filters ?? {})) {
        if (k === 'minCtc') out.set('minCtcLpa', String(Number(v) / 100000));
        else out.set(k, String(v));
    }
    return out;
}

// clientUrl: the portal's base URL (CLIENT_URL). total may exceed postings.length.
export function digestMail({ alert, postings, total, clientUrl }) {
    const base = String(clientUrl ?? '').replace(/\/+$/, '');
    const jobUrl = (id) => `${base}/dashboard/career-vault/jobs/${id}`;
    const searchUrl = `${base}/dashboard/career-vault/jobs?${pageParams(alert.filters).toString()}`;
    const unsubscribeUrl = `${base}/alerts/unsubscribe?token=${encodeURIComponent(alert.token)}`;
    const period = alert.frequency === 'DAILY' ? 'today' : 'this week';
    const more = total - postings.length;

    const subject = `${total} new opening${total === 1 ? '' : 's'} for “${alert.name}”`;
    const lines = postings.map(postingLine);

    const text = [
        `New openings ${period} for your job alert “${alert.name}” (${filterSummary(alert.filters)}):`,
        '',
        ...lines.flatMap((l, i) => [`- ${l.title}`, ...(l.details ? [`  ${l.details}`] : []), `  ${jobUrl(postings[i].id)}`]),
        ...(more > 0 ? ['', `…and ${more} more: ${searchUrl}`] : []),
        '',
        'These are off-campus openings collected and reviewed by the Academic & Career Council. Apply on the company\'s site; ACC does not run the hiring.',
        '',
        `Stop these emails: ${unsubscribeUrl}`,
    ].join('\n');

    const items = lines.map((l, i) => `
      <li style="margin:0 0 12px">
        <a href="${escapeHtml(jobUrl(postings[i].id))}" style="color:#1d4ed8;font-weight:600;text-decoration:none">${escapeHtml(l.title)}</a>
        ${l.details ? `<div style="color:#475569;font-size:13px">${escapeHtml(l.details)}</div>` : ''}
      </li>`).join('');
    const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#0f172a;max-width:600px">
      <p>New openings ${period} for your job alert <b>${escapeHtml(alert.name)}</b><br>
      <span style="color:#475569;font-size:13px">${escapeHtml(filterSummary(alert.filters))}</span></p>
      <ul style="padding-left:18px">${items}</ul>
      ${more > 0 ? `<p><a href="${escapeHtml(searchUrl)}">…and ${more} more on the portal</a></p>` : ''}
      <p style="color:#475569;font-size:12px">Off-campus openings collected and reviewed by the Academic &amp; Career Council. Apply on the company's site; ACC does not run the hiring.</p>
      <p style="color:#475569;font-size:12px"><a href="${escapeHtml(unsubscribeUrl)}">Stop these emails</a></p>
    </body></html>`;

    return { subject, text, html, unsubscribeUrl };
}
