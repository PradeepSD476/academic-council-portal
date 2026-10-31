// Where an apply link really goes, for the review editor (B-02). A shared page can name any company
// and point "Apply" anywhere, so for link postings the reviewer is warned unless the link is on the
// company's own website or a known job board. Same site rule as the server's links/linkTrust.js.

const KNOWN_ATS_SITES = ["greenhouse.io", "lever.co", "ashbyhq.com"];
const COUNTRY_SLDS = new Set(["ac", "co", "com", "edu", "gov", "net", "org", "firm", "gen", "ind", "ltd", "res"]);
const LINK_TIERS = ["JSON_LD", "LLM_FAST", "LLM_STRONG"];

function siteOf(url) {
  try {
    const labels = new URL(url).hostname.toLowerCase().replace(/\.$/, "").split(".");
    const keep = labels.length > 2 && labels.at(-1).length === 2 && COUNTRY_SLDS.has(labels.at(-2)) ? 3 : 2;
    return labels.slice(-keep).join(".");
  } catch {
    return null;
  }
}

// Returns null (nothing to say) or { site, warn }.
export function applyLinkCheck(applyUrl, { tier, companyWebsite }) {
  const site = siteOf(applyUrl);
  if (!site) return null;
  const vouched = KNOWN_ATS_SITES.includes(site) || (companyWebsite && siteOf(companyWebsite) === site);
  return { site, warn: LINK_TIERS.includes(tier) && !vouched };
}
