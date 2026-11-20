# Workbook verification

The implementation fetched the live Google Sheet successfully, parsed only the three configured EndSem tabs, and built HTML and text reminders for **every exam date**. The fallback xlsx has the same tab values. Workbook structure matches the supplied description; dates are Excel date cells under `HS`, the Evening header has repeated whitespace, and timetable cells contain commas and actual newlines.

**Cohort: fixture users representing all 3,524 distinct sheet enrolment rolls. These are not registered-portal-user counts.** No mail was sent. No local server database URL was available; the CLI supports repeating this audit against registered users at deployment.

| Date (2026) | Would send | Students with missing rooms | Missing-room exams | Students with ambiguous rooms | Students with clashes |
|---|---:|---:|---:|---:|---:|
| 21 Nov | 1,562 | 4 | 4 | 0 | 0 |
| 22 Nov | 2,509 | 0 | 0 | 0 | 0 |
| 23 Nov | 2,598 | 1 | 1 | 0 | 0 |
| 25 Nov | 2,961 | 10 | 10 | 0 | 0 |
| 26 Nov | 1,796 | 0 | 0 | 0 | 0 |
| 27 Nov | 2,929 | 0 | 0 | 0 | 0 |
| 28 Nov | 2,589 | 18 | 18 | 1 | 1 |
| 29 Nov | 1,024 | 1 | 1 | 0 | 0 |
| 30 Nov | 330 | 0 | 0 | 0 | 0 |

24 November is recognised from the workbook as the Guru Nanak Jayanti institute holiday. No exam date is hardcoded in application code.

- All 246 timetable units have enrolment rows. The 250 enrolment units include four absent from the timetable: CB5103, EP4105, ME3104, PH001.
- Slash-set matching reconciles EE6103/EE6117 with EE6117/EE6103.
- There are 34 missing-room exam assignments. Date/slot/roll membership is used even when the room's course text differs, as requested.
- On 28 November, unit matching resolves one of the two students' initial multiple-room candidates. One student still has ambiguous rooms for two exams and a same-slot clash. The reminders include warnings.
- 114 date/slot/room/roll records are not enrolled in the courses listed for their room. These are report entries, not recipients created from seating data.
- All fixture rolls have at least one timetable exam, so the fixture cohort's no-exam count is zero. This says nothing about the portal's registered-user population.

Detailed reports include rolls and remain outside Git. The committed verification contains aggregates only. Use `exams:audit --all-dates --output <private-directory>` to regenerate after any timetable revision; these figures describe the inspected snapshot, not an immutable timetable.

The exam migration was applied to a disposable PostgreSQL 16 database, and seven integration checks passed using independent Prisma connections. They verify exclusive run/delivery ownership, expired-owner revocation, persisted retry limits, durable source-keyed cache, and two-run idempotency. The temporary database was removed afterward. Portal migrations and real SMTP sending were not performed.
