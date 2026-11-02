// P8-T1 (F-29): the optional numbers from the experience form. Only the filled fields that the chosen
// experience type shows are sent (Internship: no CTC; Placement: no stipend); nothing filled → no
// "report" key at all (the server then leaves the columns alone).
export function reportPayload(report, experienceType) {
  const hidden = experienceType === "INTERNSHIP" ? "ctcLpa" : experienceType === "PLACEMENT" ? "stipend" : null;
  const out = Object.fromEntries(Object.entries(report).filter(([k, v]) => k !== hidden && String(v ?? "").trim() !== ""));
  return Object.keys(out).length ? { report: out } : {};
}
