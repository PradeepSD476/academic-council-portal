// Prisma's `contains` becomes LIKE '%value%' without escaping, so a search for "%" or "_" matched
// every row (B-14). Escape the LIKE wildcards and the escape character itself (backslash is
// PostgreSQL's default LIKE escape). Pure.
export const likeSafe = (s) => String(s).replace(/[\\%_]/g, '\\$&');
