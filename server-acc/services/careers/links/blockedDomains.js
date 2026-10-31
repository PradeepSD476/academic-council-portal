// Job sites we never fetch (their terms forbid scraping, or pages need a login). A link to them is
// stored as is (STORED_ONLY) and an admin types the details in from the review tab. Pure.
const BLOCKED = [
    'linkedin.com', 'lnkd.in', 'naukri.com', 'indeed.com', 'indeed.co.in', 'glassdoor.com', 'glassdoor.co.in',
    'internshala.com', 'wellfound.com', 'angel.co', 'instahyre.com', 'foundit.in', 'unstop.com', 'cutshort.io',
];
// indeed.* / glassdoor.* in any country.
const BLOCKED_FAMILIES = /(^|\.)(indeed|glassdoor)\.[a-z.]+$/;

export function isBlockedDomain(hostname) {
    const host = String(hostname ?? '').toLowerCase().replace(/\.$/, '');
    if (!host) return false;
    return BLOCKED.some((d) => host === d || host.endsWith(`.${d}`)) || BLOCKED_FAMILIES.test(host);
}
