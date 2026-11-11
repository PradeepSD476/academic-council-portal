// Clear test data before go-live (P8-T3, F-17; user OK 11 Oct, D-15). Local and staging only: refuses
// when NODE_ENV=production. `runJob.js cleanup` only lists; `cleanup --yes` deletes. What counts as
// test data is a fixed set of patterns, never a guess:
//   - postings whose apply URL is a test host (example.com / .org / .net, *.test, *.invalid,
//     localhost, an IP literal, a wildcard-DNS host like nip.io), and every posting of a test company;
//   - companies named "… Test <run timestamp>" (what the check scripts create), unless an experience,
//     a source or the merge log refers to them;
//   - sources named "test" or "bogus" (whole word) with no observations;
//   - student links to a test host that did not become a posting.
// A deleted posting gets a PostingDeletion row (by CLEANUP_USER_ID, "Cleanup command" in the log).
import { CareersError } from '../errors.js';

export const CLEANUP_USER_ID = 0;
export const CLEANUP_REASON = 'Test data (cleanup command)';
const RESERVED = /(^|\.)(example\.(com|org|net)|example|test|invalid|localhost)$/i;
const WILDCARD_DNS = /(^|\.)(nip\.io|sslip\.io|xip\.io)$/i;
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

export function isTestHost(url) {
    let host;
    try { host = new URL(url).hostname; } catch { return false; }
    if (!host) return false;
    return RESERVED.test(host) || WILDCARD_DNS.test(host) || IPV4.test(host) || host.startsWith('[');
}
export const isTestCompanyName = (name) => /\btest\s+\d{10,}\s*$/i.test(name ?? '');
export const isTestSourceName = (name) => /\b(test|bogus)\b/i.test(name ?? '');

export function assertNotProduction(env = process.env) {
    if (env.NODE_ENV === 'production') throw new CareersError(409, 'PRODUCTION', 'The cleanup command does not run with NODE_ENV=production.');
}

// Pure. data: { companies: [{ id, name, experiences, sources, inMergeLog }], postings: [{ id, roleTitle,
// companyId, applyUrl, status }], sources: [{ id, name, observations }], links: [{ id, url, postingId }] }.
export function cleanupPlan({ companies, postings, sources, links }) {
    const skipped = [];
    const planCompanies = [];
    for (const c of companies.filter((x) => isTestCompanyName(x.name))) {
        const why = c.experiences ? `${c.experiences} experience(s) linked` : c.sources ? `${c.sources} source(s) use it` : c.inMergeLog ? 'it is in the merge log' : null;
        if (why) skipped.push({ kind: 'company', id: c.id, name: c.name, why });
        else planCompanies.push(c);
    }
    const companyIds = new Set(planCompanies.map((c) => c.id));
    const planPostings = postings.filter((p) => isTestHost(p.applyUrl) || companyIds.has(p.companyId));
    const planSources = [];
    for (const s of sources.filter((x) => isTestSourceName(x.name))) {
        if (s.observations) skipped.push({ kind: 'source', id: s.id, name: s.name, why: `${s.observations} posting observation(s)` });
        else planSources.push(s);
    }
    const planLinks = [];
    for (const l of links.filter((x) => isTestHost(x.url))) {
        if (l.postingId) skipped.push({ kind: 'link', id: l.id, name: l.url, why: `it made posting #${l.postingId}` });
        else planLinks.push(l);
    }
    return { postings: planPostings, companies: planCompanies, sources: planSources, links: planLinks, skipped };
}

export async function findTestData(db) {
    const [companies, postings, sources, links, mergeLog] = await Promise.all([
        db.company.findMany({ select: { id: true, name: true, _count: { select: { experiences: true, sources: true } } } }),
        db.posting.findMany({ select: { id: true, roleTitle: true, companyId: true, applyUrl: true, status: true }, orderBy: { id: 'asc' } }),
        db.source.findMany({ select: { id: true, name: true, _count: { select: { observations: true } } } }),
        db.linkSubmission.findMany({ select: { id: true, url: true, postingId: true }, orderBy: { id: 'asc' } }),
        db.companyMergeLog.findMany({ select: { fromCompanyId: true, toCompanyId: true } }),
    ]);
    const merged = new Set(mergeLog.flatMap((m) => [m.fromCompanyId, m.toCompanyId]));
    return cleanupPlan({
        companies: companies.map((c) => ({ id: c.id, name: c.name, experiences: c._count.experiences, sources: c._count.sources, inMergeLog: merged.has(c.id) })),
        postings,
        sources: sources.map((s) => ({ id: s.id, name: s.name, observations: s._count.observations })),
        links,
    });
}

// Deletes exactly the plan, in one transaction. Re-reads nothing: run it right after findTestData.
export async function runCleanup(db, plan, env = process.env) {
    assertNotProduction(env);
    const postingIds = plan.postings.map((p) => p.id);
    const companyIds = plan.companies.map((c) => c.id);
    const sourceIds = plan.sources.map((s) => s.id);
    const linkIds = plan.links.map((l) => l.id);
    return db.$transaction(async (tx) => {
        const full = await tx.posting.findMany({
            where: { id: { in: postingIds } },
            select: { id: true, roleTitle: true, status: true, company: { select: { name: true } }, _count: { select: { saves: true, applications: true, reports: true, hiddenBy: true, observations: true, reviews: true } } },
        });
        if (full.length) {
            await tx.postingDeletion.createMany({
                data: full.map((p) => ({
                    postingId: p.id, roleTitle: p.roleTitle, companyName: p.company.name, status: p.status, reason: CLEANUP_REASON, byUserId: CLEANUP_USER_ID,
                    removed: { saves: p._count.saves, applications: p._count.applications, reports: p._count.reports, hidden: p._count.hiddenBy, observations: p._count.observations, reviews: p._count.reviews },
                })),
            });
            await tx.linkSubmission.updateMany({ where: { postingId: { in: postingIds } }, data: { postingId: null, dismissedAt: new Date(), dismissReason: 'The posting made from this link was removed by ACC.' } });
            await tx.extraction.updateMany({ where: { postingId: { in: postingIds } }, data: { postingId: null } });
        }
        const postings = (await tx.posting.deleteMany({ where: { id: { in: postingIds } } })).count;
        await tx.companyAlias.deleteMany({ where: { companyId: { in: companyIds } } });
        const companies = (await tx.company.deleteMany({ where: { id: { in: companyIds } } })).count;
        await tx.sourceRun.deleteMany({ where: { sourceId: { in: sourceIds } } });
        const sources = (await tx.source.deleteMany({ where: { id: { in: sourceIds } } })).count;
        await tx.extraction.deleteMany({ where: { submissionId: { in: linkIds } } });
        const links = (await tx.linkSubmission.deleteMany({ where: { id: { in: linkIds } } })).count;
        return { postings, companies, sources, links };
    });
}
