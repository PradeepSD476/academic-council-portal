import { describe, it, expect } from 'vitest';
import { simhash64, hammingDistance, isNearDuplicate, EMPTY_FINGERPRINT } from '../../services/careers/text/fingerprint.js';
import { extractSkills, canonicalizeSkills } from '../../services/careers/text/skills.js';
import { detectWorkMode } from '../../services/careers/text/workMode.js';
import { evaluateRelevance, guessType, classifyLocation } from '../../services/careers/text/relevance.js';

const JD = `We are looking for a Software Engineering Intern to join our payments platform team in Bengaluru.
You will design and build backend services in Java and Go, write clean and well tested code, review pull
requests from your peers, and work closely with product managers and designers to ship features used by
millions of merchants across India. You will learn how large scale distributed systems are operated, how
we monitor reliability, and how incidents are handled. Requirements: strong fundamentals in data
structures and algorithms, familiarity with SQL databases, curiosity, and the ability to communicate
clearly in a small team. Students graduating in 2027 from any engineering discipline are welcome to apply.`;

describe('fingerprint', () => {
    it('is 16 hex chars and deterministic', () => {
        const fp = simhash64(JD);
        expect(fp).toMatch(/^[0-9a-f]{16}$/);
        expect(simhash64(JD)).toBe(fp);
    });
    it('ignores case, punctuation and whitespace changes', () => {
        const messy = JD.toUpperCase().replace(/\s+/g, '   ').replace(/\./g, ' . ');
        expect(hammingDistance(simhash64(JD), simhash64(messy))).toBe(0);
    });
    it('a line of boilerplate stays a near duplicate (<= 3 bits)', () => {
        const withBoilerplate = `${JD}\nWe are an equal opportunity employer.`;
        expect(hammingDistance(simhash64(JD), simhash64(withBoilerplate))).toBeLessThanOrEqual(3);
        expect(isNearDuplicate(simhash64(JD), simhash64(withBoilerplate))).toBe(true);
    });
    it('unrelated descriptions are far apart (> 10 bits)', () => {
        const other = `Mechanical design engineer for turbine blades. Experience with ANSYS and SolidWorks,
        finite element analysis of rotating components, and preparation of manufacturing drawings for the
        foundry. Location Pune. Minimum five years in the power generation industry is required.`;
        expect(hammingDistance(simhash64(JD), simhash64(other))).toBeGreaterThan(10);
    });
    it('empty text gives the empty fingerprint, which never counts as a duplicate', () => {
        expect(simhash64('')).toBe(EMPTY_FINGERPRINT);
        expect(isNearDuplicate(EMPTY_FINGERPRINT, EMPTY_FINGERPRINT)).toBe(false);
    });
});

describe('skills', () => {
    it('finds canonical skills as whole words', () => {
        expect(extractSkills('Experience with ReactJS, Node.js, PostgreSQL and AWS. Python is a plus.'))
            .toEqual(['Python', 'React', 'Node.js', 'PostgreSQL', 'AWS']);
    });
    it('handles symbol-heavy names', () => {
        expect(extractSkills('C++ and C# on .NET')).toEqual(['C++', 'C#', '.NET']);
    });
    it('does not match inside other words or ambiguous English', () => {
        expect(extractSkills('We go the extra mile; Javanese culture; plan C; reactive mindset')).toEqual([]);
    });
    it('does not treat "javascript" as Java', () => {
        expect(extractSkills('Strong JavaScript skills')).toEqual(['JavaScript']);
    });
    it('canonicalizes free-form skill strings and drops unknown ones', () => {
        expect(canonicalizeSkills(['reactjs', 'Golang', 'teamwork', 'k8s'])).toEqual(['Go', 'React', 'Kubernetes']);
    });
    it('empty input gives no skills', () => {
        expect(extractSkills('')).toEqual([]);
    });
});

describe('work mode', () => {
    it.each([
        [{ workplaceText: 'Hybrid' }, 'HYBRID'],
        [{ workplaceText: 'remote' }, 'REMOTE'],
        [{ workplaceText: 'On-site' }, 'ONSITE'],
        [{ text: 'This role is fully remote within India.' }, 'REMOTE'],
        [{ text: 'You will work from office 5 days a week.' }, 'ONSITE'],
        [{ text: 'This is not a remote role.' }, 'ONSITE'],
        [{ text: 'Remote first, with quarterly on-site weeks.' }, 'HYBRID'],
        [{ workplaceText: 'unspecified', text: 'Work from home allowed.' }, 'REMOTE'],
        [{ text: 'Join our payments team.' }, 'UNKNOWN'],
        [{}, 'UNKNOWN'],
    ])('%j -> %s', (input, expected) => {
        expect(detectWorkMode(input)).toBe(expected);
    });
});

describe('relevance', () => {
    it('keeps an intern role in Bengaluru as INTERNSHIP', () => {
        expect(evaluateRelevance({ title: 'Software Engineer Intern', locationText: 'Bengaluru, India' }))
            .toMatchObject({ keep: true, type: 'INTERNSHIP', location: 'india' });
    });
    it('keeps a new-grad full-time role', () => {
        expect(evaluateRelevance({ title: 'Software Engineer - New Grad 2026', locationText: 'Hyderabad' }))
            .toMatchObject({ keep: true, type: 'FULL_TIME' });
    });
    it('keeps a plain title when the description asks for 0-2 years', () => {
        expect(evaluateRelevance({ title: 'Software Engineer', locationText: 'Pune', descriptionText: 'We need 0-2 years of experience.' }))
            .toMatchObject({ keep: true, type: 'FULL_TIME' });
    });
    it('drops a plain title with no early-career signal', () => {
        expect(evaluateRelevance({ title: 'Software Engineer', locationText: 'Pune' })).toMatchObject({ keep: false, reason: 'level' });
    });
    it.each(['Senior Software Engineer', 'Staff Engineer', 'Engineering Manager', 'Software Engineer II', 'Lead Data Scientist', 'Principal Architect'])(
        'drops senior title: %s', (title) => {
            expect(evaluateRelevance({ title, locationText: 'Bengaluru' })).toMatchObject({ keep: false, reason: 'seniority' });
        });
    it('an intern title wins over a seniority word ("Lead Generation Intern")', () => {
        expect(evaluateRelevance({ title: 'Lead Generation Intern', locationText: 'Mumbai' })).toMatchObject({ keep: true, type: 'INTERNSHIP' });
    });
    it('drops roles located abroad', () => {
        expect(evaluateRelevance({ title: 'Software Engineer Intern', locationText: 'London, UK' })).toMatchObject({ keep: false, reason: 'location' });
        expect(evaluateRelevance({ title: 'Software Engineer Intern', locationText: 'Remote - US' })).toMatchObject({ keep: false, reason: 'location' });
    });
    it('keeps remote roles open to India', () => {
        expect(classifyLocation('Remote - India')).toBe('remote-india');
        expect(classifyLocation('Remote (APAC)')).toBe('remote-india');
        expect(classifyLocation('Remote')).toBe('remote-india');
    });
    it('keeps an unrecognised place as unknown instead of dropping it', () => {
        expect(classifyLocation('Kanpur')).toBe('unknown');
        expect(evaluateRelevance({ title: 'Data Analyst', locationText: 'Kanpur' })).toMatchObject({ keep: true, location: 'unknown' });
    });
    it('a missing location is unknown and kept', () => {
        expect(evaluateRelevance({ title: 'Graduate Trainee', locationText: null })).toMatchObject({ keep: true, location: 'unknown' });
    });
    it('guessType is null when the title says nothing', () => {
        expect(guessType('Software Engineer')).toBeNull();
        expect(guessType('ML Research Intern')).toBe('INTERNSHIP');
    });
});
