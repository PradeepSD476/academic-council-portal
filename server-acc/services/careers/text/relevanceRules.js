// Tunable rules for the relevance filter. ATS boards are global and mostly senior roles; without
// this filter the review queue floods and admins stop reviewing.

// Seniority in the title -> drop.
export const SENIOR_TITLE = /\b(senior|sr\.?|staff|principal|lead|leader|manager|director|head|vp|vice president|architect|chief|president|expert|specialist ii|ii|iii|iv)\b|\blevel\s*[2-9]\b|\bl[4-9]\b/i;

// Early-career signals in the title -> keep.
export const JUNIOR_TITLE = /\b(intern|internship|trainee|apprentice|apprenticeship|co-?op|graduate|new grad|campus|fresher|freshers|entry[\s-]level|junior|jr\.?|associate|sde[\s-]?(i|1)|engineer\s+(i|1)|analyst|early career|university)\b/i;

// Early-career signals in the description -> keep.
export const JUNIOR_DESCRIPTION = /\b0\s*(-|–|to)\s*[12]\+?\s*years?\b|\bfresh(er|ers)?\b|\bfresh graduates?\b|\brecent graduates?\b|\bnew grad(uate)?s?\b|\b20(2[5-9])\s*(batch|graduates?|pass[\s-]?outs?)\b|\bgraduating in 20(2[5-9])\b|\bno prior experience\b/i;

// Title words that make a posting an internship.
export const INTERNSHIP_TITLE = /\b(intern|internship|trainee|apprentice|apprenticeship|co-?op)\b/i;

// Remote postings are kept only if they are open to India.
export const REMOTE_OPEN_TO_INDIA = /\b(india|apac|asia|anywhere|worldwide|global|any location)\b/i;

// Places that mean "not India" when a remote posting names them.
export const FOREIGN_PLACES = /\b(usa|u\.s\.a?|united states|us|canada|uk|u\.k\.|united kingdom|england|london|ireland|dublin|germany|berlin|france|paris|netherlands|amsterdam|spain|europe|emea|americas|latam|mexico|brazil|australia|sydney|new zealand|singapore|japan|tokyo|china|hong kong|korea|israel|uae|dubai|poland|sweden|switzerland|san francisco|new york|seattle|boston|austin|toronto|vancouver)\b/i;
