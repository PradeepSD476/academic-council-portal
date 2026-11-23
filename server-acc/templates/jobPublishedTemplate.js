const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function jobPublicationUrl(clientUrl, postingId) {
    const base = new URL(clientUrl);
    if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) throw new Error('CLIENT_URL must be a valid HTTP(S) portal URL.');
    return new URL(`/dashboard/career-vault/jobs/${postingId}`, base).href;
}

export default function jobPublishedTemplate({ title, type, url }) {
    const label = type === 'INTERNSHIP' ? 'internship opening' : type === 'FULL_TIME' ? 'full-time opening' : 'job opening';
    const safeTitle = String(title || 'New opening').replace(/[\r\n]+/g, ' ').trim();
    return {
        subject: `New ${label} published: ${safeTitle}`,
        text: `Hello,\n\nA new ${label} has been published on the Academic & Career Council portal.\n\n${safeTitle}\n\nView opening:\n${url}\n\nRegards,\nAcademic & Career Council\nIndian Institute of Technology Patna`,
        html: `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:20px;font-family:Arial,sans-serif;line-height:1.6;color:#333"><div style="max-width:600px;margin:auto">
          <h2 style="color:#0b5ed7;font-size:22px">New Opening Published</h2>
          <p>Hello,</p><p>A new ${label} has been published on the Academic &amp; Career Council portal.</p>
          <div style="margin:20px 0;padding:16px;background-color:#f4f6f8;border-left:4px solid #0b5ed7"><p style="margin:0;font-size:16px;font-weight:bold">${escapeHtml(safeTitle)}</p></div>
          <div style="margin:24px 0;text-align:center"><a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 20px;background-color:#0b5ed7;color:white;text-decoration:none;border-radius:6px;font-weight:bold;font-size:15px">View Opening</a></div>
          <p>Regards,<br>Academic &amp; Career Council<br>Indian Institute of Technology Patna</p>
          <hr style="margin:24px 0;border:0;border-top:1px solid #e2e8f0"><p style="font-size:12px;color:#777">This is an automated message. Please do not reply.</p>
          <p style="font-size:12px;color:#777">© Academic &amp; Career Council, Indian Institute of Technology Patna</p>
        </div></body></html>`,
    };
}
