// Idempotent seed for the careers feature: setting defaults and the canonical company registry.
// Safe to run repeatedly and in production: it only inserts what is missing and never overwrites
// values an admin has changed.
// Usage: npm run careers:seed
import dotenv from 'dotenv';
dotenv.config();
import prisma from '../config/db.js';
import { SETTINGS } from '../services/careers/settings.js';
import { normalizeCompanyName } from '../services/careers/text/normalize.js';
import { slugify } from '../services/careers/companies/slug.js';

// [display name, ...extra aliases]. Aliases that normalise to the same key as the name
// (e.g. "Google LLC") are redundant and skipped automatically.
const COMPANIES = [
    ['Google', 'Alphabet'],
    ['Microsoft', 'MSFT', 'Microsoft IDC', 'Microsoft India Development Center'],
    ['Amazon', 'Amazon Web Services', 'AWS'],
    ['Adobe'],
    ['Goldman Sachs', 'GS'],
    ['JPMorgan Chase', 'JP Morgan', 'J.P. Morgan', 'JPMC'],
    ['Morgan Stanley'],
    ['D. E. Shaw', 'DE Shaw', 'D.E. Shaw & Co.', 'The D. E. Shaw Group'],
    ['Tower Research Capital', 'Tower Research'],
    ['Flipkart', 'Flipkart Internet'],
    ['Uber'],
    ['Atlassian'],
    ['Salesforce'],
    ['Oracle'],
    ['Intuit'],
    ['Qualcomm'],
    ['Texas Instruments', 'TI'],
    ['Samsung', 'Samsung R&D Institute', 'SRIB', 'Samsung Research'],
    ['NVIDIA'],
    ['Intel'],
    ['AMD', 'Advanced Micro Devices'],
    ['Cisco', 'Cisco Systems'],
    ['Walmart', 'Walmart Global Tech'],
    ['American Express', 'Amex'],
    ['Deutsche Bank'],
    ['Barclays'],
    ['Wells Fargo'],
    ['Media.net'],
    ['Rubrik'],
    ['Nutanix'],
    ['ServiceNow'],
    ['Sprinklr'],
    ['Razorpay'],
    ['Zomato', 'Eternal'],
    ['Swiggy'],
    ['PhonePe'],
    ['Paytm', 'One97 Communications'],
    ['CRED', 'Dreamplug Technologies'],
    ['Meesho'],
    ['Groww'],
    ['Zepto'],
    ['Juspay'],
    ['Postman'],
    ['BrowserStack'],
    ['Dream11', 'Dream Sports'],
    ['MakeMyTrip'],
    ['InMobi'],
    ['Zeta'],
    ['Databricks'],
    ['Cloudflare'],
    ['Stripe'],
    ['Coinbase'],
    ['Notion'],
    ['OpenAI'],
    ['Ramp'],
    ['Linear'],
    ['Airbnb'],
    ['Visa'],
    ['Mastercard'],
    ['Arcesium'],
];

async function seedSettings() {
    let created = 0;
    for (const [key, def] of Object.entries(SETTINGS)) {
        if (def.default === null) continue; // absent row already means "default"
        const exists = await prisma.appSetting.findUnique({ where: { key } });
        if (exists) continue;
        await prisma.appSetting.create({ data: { key, value: def.default } });
        created++;
    }
    return created;
}

async function seedCompanies() {
    const stats = { companies: 0, aliases: 0, skippedRedundant: 0, conflicts: [] };
    for (const [name, ...extra] of COMPANIES) {
        const slug = slugify(name);
        const normalizedName = normalizeCompanyName(name);
        let company = await prisma.company.findUnique({ where: { slug } });
        if (!company) {
            company = await prisma.company.create({ data: { name, slug, normalizedName, status: 'ACTIVE' } });
            stats.companies++;
        }

        for (const alias of [name, ...extra]) {
            const normalizedAlias = normalizeCompanyName(alias);
            if (!normalizedAlias) continue;
            const owner = await prisma.companyAlias.findUnique({ where: { normalizedAlias } });
            if (owner) {
                if (owner.companyId === company.id) stats.skippedRedundant++;
                else stats.conflicts.push(`${alias} -> already an alias of company #${owner.companyId}`);
                continue;
            }
            await prisma.companyAlias.create({
                data: { companyId: company.id, alias, normalizedAlias, origin: 'SEED' },
            });
            stats.aliases++;
        }
    }
    return stats;
}

async function main() {
    const settings = await seedSettings();
    const stats = await seedCompanies();
    console.info(`[careers] seed: ${settings} settings created, ${stats.companies} companies created, ${stats.aliases} aliases created, ${stats.skippedRedundant} redundant/existing aliases skipped`);
    for (const c of stats.conflicts) console.warn(`[careers] seed alias conflict: ${c}`);
}

main()
    .catch((err) => {
        console.error('[careers] seed failed', err);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
