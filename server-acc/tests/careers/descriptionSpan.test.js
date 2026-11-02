import { describe, it, expect } from 'vitest';
import { descriptionSpan, MIN_SPAN_CHARS } from '../../services/careers/extract/descriptionSpan.js';
import { verifyExtraction } from '../../services/careers/extract/verify.js';
import { parseExtraction } from '../../services/careers/extract/schema.js';

const PAGE = `Search for Jobs
Or
Software Engineer Intern
MyGyan
Posted
6 months ago
Sema Summary
MyGyan is seeking a Software Engineer Intern to join their team in Bengaluru. You will engage in various software development tasks, acquiring hands-on experience in real-world projects.
About Company
MyGyan is a technology-driven company focused on providing innovative educational solutions.
Core Requirements
Pursuing a degree in Computer Science or related field
Basic understanding of programming languages
Responsibilities
Assist in software development projects
Test and debug applications
Learn and apply software engineering principles
Similar Jobs
Software Engineer Intern
Semesteria
Remote
Hi 👋
AI chat is launching soon on Semesteria.`;

describe('descriptionSpan: the job description cut out of a full page by two verbatim anchors', () => {
    it('keeps the text from the first anchor to the end of the last one, lines intact; drops menus and similar jobs', () => {
        const out = descriptionSpan(PAGE, 'MyGyan is seeking a Software Engineer Intern to join', 'Learn and apply software engineering principles');
        expect(out.startsWith('MyGyan is seeking a Software Engineer Intern')).toBe(true);
        expect(out.endsWith('Learn and apply software engineering principles')).toBe(true);
        expect(out).toContain('\nCore Requirements\n');
        expect(out).not.toMatch(/Search for Jobs|Similar Jobs|AI chat/);
    });
    it('matches ignoring case, punctuation and line breaks inside the anchors', () => {
        const out = descriptionSpan(PAGE, 'mygyan is seeking a software engineer intern, to join', 'test and debug applications learn and apply software engineering principles.');
        expect(out?.endsWith('Learn and apply software engineering principles')).toBe(true);
    });
    it('returns null when an anchor is missing, not in the page, reversed, or the span is too short', () => {
        expect(descriptionSpan(PAGE, null, 'Learn and apply software engineering principles')).toBeNull();
        expect(descriptionSpan(PAGE, 'words that are nowhere in this page at all', 'Learn and apply software engineering principles')).toBeNull();
        expect(descriptionSpan(PAGE, 'Learn and apply software engineering principles', 'MyGyan is seeking a Software Engineer Intern')).toBeNull();
        expect(descriptionSpan(PAGE, 'Basic understanding of programming languages', 'Responsibilities Assist in software development projects')).toBeNull(); // < MIN_SPAN_CHARS
        expect(MIN_SPAN_CHARS).toBeGreaterThan(50);
    });
    it('needs at least 10 letters / digits in each anchor (one common word could match anywhere)', () => {
        expect(descriptionSpan(PAGE, 'MyGyan', 'principles')).toBeNull();
    });
    it('a short end anchor and spacing differences still match (real page: IIT Tirupati via indiascienceandtechnology.gov.in)', () => {
        const page = `Home / Internships / Summer Internship
Conferences & Seminars Menu
- Workshops
Summer Internship at IIT Tirupati
Eligibility:
Pre-final year students of B.E/ B.Tech/B.Sc/ M.Sc/ B.A/ M.A or equivalent from any recognized University.
Duration:
2 months
Stipend:
The top 5 students per department will be paid a stipend of ₹5,000/- per month.
Status:
Closed`;
        const out = descriptionSpan(page, 'Eligibility: Pre-final year students of B.E/B.Tech/ B.Sc', 'Status: Closed');
        expect(out?.startsWith('Eligibility:')).toBe(true);
        expect(out?.endsWith('Closed')).toBe(true);
        expect(out).not.toContain('Seminars Menu');
    });
    it('a word slipped inside a long anchor still matches through a shorter anchor', () => {
        const out = descriptionSpan(PAGE, 'MyGyan is seeking a Software Engineer Intern to join our team in Mumbai', 'Assist in projects Test and debug applications Learn and apply software engineering principles');
        expect(out?.startsWith('MyGyan is seeking')).toBe(true);
        expect(out?.endsWith('Learn and apply software engineering principles')).toBe(true);
    });
    it('widens the cut to whole lines, so a sentence after the end anchor on the same line is kept (real page: IIPE SIP)', () => {
        const page = `The SIP will be open to B.E/B.Tech. and M.Sc. students for an internship of 8 weeks with a stipend of Rs. 10,000/- for the entire tenure. The SIP will provide students with a platform to explore research with faculty at the IIPE. The purpose of the SIP is to motivate the students (STEM).
SIP Application Proforma
Form SIP - 01 PDF Doc`;
        const out = descriptionSpan(page, 'The SIP will be open to B.E/B.Tech.', 'explore research with faculty at the IIPE.');
        expect(out?.endsWith('motivate the students (STEM).')).toBe(true);
        expect(out).not.toContain('Proforma');
    });
    it('verifyExtraction puts the cut description on the fields; no anchors → null (the apply step keeps the page)', () => {
        const base = {
            is_job_posting: true, company_name: 'MyGyan', role_title: 'Software Engineer Intern', type: 'INTERNSHIP', ppo_mentioned: null,
            location: null, work_mode: 'UNKNOWN', skills: [], compensation_text: null, eligibility: { branches: [], years: [], min_cpi: null },
            deadline_stated: null, apply_url: null, overall_confidence: 0.8,
        };
        const withAnchors = parseExtraction(JSON.stringify({ ...base, description_first_words: 'MyGyan is seeking a Software Engineer Intern', description_last_words: 'Learn and apply software engineering principles' }));
        const v = verifyExtraction(withAnchors, PAGE, { provider: 'groq' });
        expect(v.fields.descriptionText?.startsWith('MyGyan is seeking')).toBe(true);
        expect(v.fields.descriptionText).not.toContain('Similar Jobs');
        expect(verifyExtraction(parseExtraction(JSON.stringify(base)), PAGE, { provider: 'groq' }).fields.descriptionText).toBeNull();
    });
});
