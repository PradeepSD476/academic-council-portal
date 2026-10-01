// schema.org JobPosting from a page's JSON-LD (cost cascade tier: free, structured, published by
// the employer for search engines). Pure: HTML in, RawPosting (or null) out.
import * as cheerio from 'cheerio';
import { htmlToText } from '../text/html.js';

const asArray = (v) => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);
const isJobPosting = (node) => asArray(node?.['@type']).some((t) => String(t).toLowerCase() === 'jobposting');

function* walk(node) {
    for (const item of asArray(node)) {
        if (!item || typeof item !== 'object') continue;
        yield item;
        if (item['@graph']) yield* walk(item['@graph']);
    }
}

export function findJobPosting(html) {
    const $ = cheerio.load(html);
    for (const el of $('script[type="application/ld+json"]').toArray()) {
        let data;
        try {
            data = JSON.parse($(el).contents().text().trim());
        } catch {
            continue; // some sites ship broken JSON-LD; try the next block
        }
        for (const node of walk(data)) if (isJobPosting(node)) return node;
    }
    return null;
}

const text = (v) => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : null) || null;

function placeText(place) {
    const a = place?.address;
    if (typeof a === 'string') return a.trim() || null;
    const parts = [a?.addressLocality, a?.addressRegion, typeof a?.addressCountry === 'object' ? a.addressCountry?.name : a?.addressCountry];
    return parts.map(text).filter(Boolean).join(', ') || text(place?.name);
}

function locationText(job) {
    const places = asArray(job.jobLocation).map(placeText).filter(Boolean);
    if (asArray(job.jobLocationType).some((t) => String(t).toUpperCase() === 'TELECOMMUTE')) {
        const where = asArray(job.applicantLocationRequirements).map((r) => text(r?.name)).filter(Boolean);
        places.push(`Remote${where.length ? ` - ${where.join(', ')}` : ''}`);
    }
    return places.length ? [...new Set(places)].join('; ') : null;
}

const UNIT = { HOUR: 'per hour', DAY: 'per day', WEEK: 'per week', MONTH: 'per month', YEAR: 'per year' };

// baseSalary (MonetaryAmount) -> text that parseCompensation understands, e.g. "INR 40000 - 60000 per month".
function compensationText(job) {
    const s = job.baseSalary;
    if (!s || typeof s !== 'object') return null;
    const v = typeof s.value === 'object' && s.value !== null ? s.value : { value: s.value };
    const min = Number(v.minValue ?? v.value);
    const max = Number(v.maxValue ?? v.value);
    if (!(min > 0 || max > 0)) return null;
    const amount = min && max && min !== max ? `${min} - ${max}` : String(min || max);
    return [text(s.currency), amount, UNIT[String(v.unitText ?? s.unitText ?? '').toUpperCase()] ?? ''].filter(Boolean).join(' ');
}

function employmentType(job) {
    const types = asArray(job.employmentType).map((t) => String(t).replace(/_/g, ' ').toLowerCase());
    if (!types.length) return null;
    return types.map((t) => (t === 'intern' ? 'internship' : t)).join(', ');
}

// pageUrl: the fetched page (used when the JSON-LD has no url / identifier).
export function jobPostingToRaw(job, pageUrl) {
    const title = text(job.title) ?? text(job.name);
    if (!title) return null;
    const org = asArray(job.hiringOrganization)[0];
    const identifier = typeof job.identifier === 'object' ? text(job.identifier?.value) : text(job.identifier);
    return {
        externalId: identifier ?? pageUrl,
        title,
        companyName: typeof org === 'string' ? org.trim() : text(org?.name),
        locationText: locationText(job),
        url: text(job.url) && /^https?:\/\//.test(job.url) ? job.url.trim() : pageUrl,
        descriptionText: htmlToText(String(job.description ?? '')),
        workplaceText: asArray(job.jobLocationType).some((t) => String(t).toUpperCase() === 'TELECOMMUTE') ? 'remote' : null,
        employmentTypeText: employmentType(job),
        compensationText: compensationText(job),
        postedAt: text(job.datePosted),
        deadline: text(job.validThrough),
    };
}

export function extractJsonLd(html, pageUrl) {
    const job = findJobPosting(html);
    return job ? jobPostingToRaw(job, pageUrl) : null;
}
