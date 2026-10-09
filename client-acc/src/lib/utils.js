export function getInitials(name, fallback = '?') {
  if (!name || typeof name !== 'string') return fallback;

  const cleaned = name
    .trim()
    .replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.|Miss|Mx\.)\s+/i, '')
    .replace(/\s+/g, ' ');

  const parts = cleaned.split(' ').filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}