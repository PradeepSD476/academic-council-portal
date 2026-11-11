// A shared page can say anything about itself: "hiringOrganization: Google" and an apply link on any
// domain both pass grounding because they are on the page. Only what the page's host proves is
// trusted; the rest is flagged for the reviewer (B-02). Pure.

// Apply links on these job boards are fine whoever's page they came from.
export const KNOWN_ATS_SITES = ['greenhouse.io', 'lever.co', 'ashbyhq.com'];

// Second-level labels under country domains: flipkart.co.in, iitp.ac.in.
const COUNTRY_SLDS = new Set(['ac', 'co', 'com', 'edu', 'gov', 'net', 'org', 'firm', 'gen', 'ind', 'ltd', 'res']);

// "careers.acme.com" -> "acme.com", "www.flipkart.co.in" -> "flipkart.co.in".
export function siteOf(hostname) {
    const labels = hostname.toLowerCase().replace(/\.$/, '').split('.');
    const keep = labels.length > 2 && labels.at(-1).length === 2 && COUNTRY_SLDS.has(labels.at(-2)) ? 3 : 2;
    return labels.slice(-keep).join('.');
}

function httpSite(url) {
    try {
        const u = new URL(url);
        return ['http:', 'https:'].includes(u.protocol) ? siteOf(u.hostname) : null;
    } catch {
        return null; // not a URL: treated as no site
    }
}

// pageUrl: the fetched page (after redirects); applyUrl: what the page says (may be null);
// company: from companyFor ({ fromHost, website }).
// Returns { applyUrl, applyUrlUncertain, companyUncertain }.
export function linkTrust({ pageUrl, applyUrl, company }) {
    const pageSite = httpSite(pageUrl);
    const companySite = company.website ? httpSite(company.website) : null;

    let finalUrl = pageUrl;
    let applyUrlUncertain = false;
    if (applyUrl) {
        const applySite = httpSite(applyUrl);
        if (applySite && (applySite === pageSite || applySite === companySite || KNOWN_ATS_SITES.includes(applySite))) finalUrl = applyUrl;
        else applyUrlUncertain = true;
    }

    const shownOnCompanySite = Boolean(companySite) && (pageSite === companySite || httpSite(finalUrl) === companySite);
    return { applyUrl: finalUrl, applyUrlUncertain, companyUncertain: !company.fromHost && !shownOnCompanySite };
}
