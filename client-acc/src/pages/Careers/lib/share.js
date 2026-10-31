// Share a posting (P7-T6, F-32): the portal URL (the reader logs in to open it) and a WhatsApp link
// with the title, since that is how openings travel between batchmates. Pure.
export const postingUrl = (id, origin) => `${origin}/dashboard/career-vault/jobs/${id}`;

export function shareText(posting, url) {
  const company = posting.company?.name ? ` at ${posting.company.name}` : "";
  return `${posting.roleTitle}${company}, on ACC Jobs & Internships: ${url}`;
}

// wa.me opens WhatsApp (app or web) with the text filled in; the student picks the chat.
export const whatsappHref = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`;
