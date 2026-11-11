// "Deadlines stated by source" on the Saved page (P6-T6, F-20 in-app). Only deadlines a source
// published; upcoming ones by date, passed ones after them. Plain dates, no countdowns.

// Today's date in India as YYYY-MM-DD (deadlines are stored as dates at 00:00 UTC).
export function todayInIndia(now = new Date()) {
  return now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

// items: Saved cards. Returns [{ posting, date: "YYYY-MM-DD", passed }].
export function deadlineRows(items, now = new Date()) {
  const today = todayInIndia(now);
  const rows = items
    .filter((p) => p.deadlineStated)
    .map((p) => {
      const date = new Date(p.deadlineStated).toISOString().slice(0, 10);
      return { posting: p, date, passed: date < today };
    });
  const byDate = (a, b) => a.date.localeCompare(b.date) || a.posting.id - b.posting.id;
  return [...rows.filter((r) => !r.passed).sort(byDate), ...rows.filter((r) => r.passed).sort(byDate)];
}
