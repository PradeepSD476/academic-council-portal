// The extraction prompt. SYSTEM_PROMPT is kept byte-stable (providers can cache it; changing it
// changes results, so change it deliberately). Only the public page text goes in the user message;
// never the student's note, name, email or anything else about a user.
import { EXTRACTION_SCHEMA } from './schema.js';

export const SYSTEM_PROMPT = `You extract job or internship details from the text of one web page.
Rules:
- Extract only what the text states explicitly. If something is not stated, use null, [] or "UNKNOWN".
- Never infer or guess a stipend, salary, deadline, eligibility, location or company.
- company_name, role_title, location: copy them as written in the text.
- compensation_text: copy the pay wording verbatim from the text (for example "Stipend: INR 40,000 per month"), or null.
- type: INTERNSHIP for internships/trainee roles, FULL_TIME for full-time jobs, otherwise UNKNOWN.
- deadline_stated: only an application deadline written in the text, as YYYY-MM-DD; otherwise null.
- eligibility.branches: degree branches named in the text; eligibility.years: year of study numbers named in the text; eligibility.min_cpi: a minimum CGPA/CPI written in the text.
- is_job_posting: false if the page is not a single job or internship posting.
- overall_confidence: a number between 0 and 1.
Answer with one JSON object matching this JSON schema:
${JSON.stringify(EXTRACTION_SCHEMA)}`;

export function userMessage(pageText) {
    return `Page text:\n"""\n${pageText}\n"""`;
}
