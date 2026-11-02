import { describe, it, expect } from 'vitest';
import { draftBody, draftFields, rawFromVerified } from '../../services/careers/links/linkDraft.js';

describe('draft a posting from a link (admin, F-34)', () => {
    it('takes one http(s) URL', () => {
        expect(draftBody.parse({ url: ' https://example.org/jobs/1 ' })).toEqual({ url: 'https://example.org/jobs/1' });
        expect(() => draftBody.parse({ url: 'ftp://x.org/a' })).toThrow();
        expect(() => draftBody.parse({ url: 'not a url' })).toThrow();
        expect(() => draftBody.parse({})).toThrow();
    });
    it('turns the verified model fields into a RawPosting; the page text is the fallback description', () => {
        const f = { roleTitle: 'SDE Intern', companyName: 'Acme', location: 'Bengaluru', applyUrl: null, descriptionText: null, compensationText: 'Stipend ₹50,000 / month', deadline: '2026-11-15' };
        expect(rawFromVerified(f, 'https://acme.com/jobs/1', 'PAGE TEXT')).toMatchObject({
            title: 'SDE Intern', companyName: 'Acme', locationText: 'Bengaluru', url: 'https://acme.com/jobs/1', descriptionText: 'PAGE TEXT', compensationText: 'Stipend ₹50,000 / month', deadline: '2026-11-15',
        });
        expect(rawFromVerified({ ...f, applyUrl: 'https://acme.com/apply', descriptionText: 'Just the description' }, 'https://acme.com/jobs/1', 'PAGE').url).toBe('https://acme.com/apply');
    });
    it('keeps only the fields the posting form has; the model\'s own reading wins for mode, skills, PPO and eligibility', () => {
        const built = {
            companyId: null, roleTitle: 'SDE Intern', roleTitleNormalized: 'sde intern', type: 'INTERNSHIP', location: 'Bengaluru', locationNormalized: 'bengaluru',
            workMode: 'UNKNOWN', skills: ['Java'], eligibleBranches: [], eligibleYears: [], eligibleGradYears: [2027], season: 'SUMMER', startMonth: null, durationMonths: 2,
            minCpi: null, compCurrency: 'INR', stipendMin: 50000, stipendMax: 50000, stipendDisclosure: 'DISCLOSED', ctcMin: null, ctcMax: null, ctcDisclosure: 'NOT_DISCLOSED',
            compensationRaw: 'Stipend ₹50,000 / month', descriptionText: 'D', contentFingerprint: 'x', applyUrl: 'https://a', deadlineStated: new Date('2026-11-15'),
            extractionTier: 'STRUCTURED', extractionConfidence: 0.8, uncertainFields: ['season'],
        };
        const d = draftFields(built, { workMode: 'HYBRID', skills: ['Java', 'Go'], ppoMentioned: true, eligibleBranches: ['CS'], eligibleYears: [3], minCpi: 7.5, eligibleGradYears: [] });
        expect(d).toMatchObject({ roleTitle: 'SDE Intern', type: 'INTERNSHIP', workMode: 'HYBRID', skills: ['Java', 'Go'], ppoMentioned: true, eligibleBranches: ['CS'], eligibleYears: [3], minCpi: 7.5, eligibleGradYears: [2027], stipendMin: 50000, durationMonths: 2 });
        for (const k of ['companyId', 'roleTitleNormalized', 'locationNormalized', 'contentFingerprint', 'extractionTier', 'extractionConfidence', 'uncertainFields']) expect(d).not.toHaveProperty(k);
        expect(draftFields(built).workMode).toBe('UNKNOWN'); // structured sources: our own reading only
    });
});
