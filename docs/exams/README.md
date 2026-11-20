# Exam reminder operations

Exam reminders have no UI. The existing `fetcher-acc` worker checks enabled exam datasets every minute. Each dataset defaults to 07:30 in `Asia/Kolkata`. The API process does not send these reminders.

## First deployment

1. Install the server dependencies (`npm ci`) and generate Prisma (`npx prisma generate`). Apply the additive migration with `npx prisma migrate deploy` using the normal database/deployment process. Back up the database before a production migration. Do not use `prisma db push`.
2. Configure the existing SMTP settings and the exam variables in `server-acc/.env.example`. All scheduling/sending is **off by default**. Copy examples into the server's real `.env`; never commit secrets or the sheet URL.
3. Set `EXAM_ENDSEM_SHEET_URL` to the supplied view-only Google Sheet link. The entire workbook is fetched as xlsx; only the three mapped tabs are parsed. The fallback workbook at `server-acc/data/exams/endsem.xlsx` is intentionally included in Git and the backend image. Set `EXAM_ENDSEM_FALLBACK_PATH=/app/data/exams/endsem.xlsx` in Docker (or an absolute host path for local CLI use). Include the workbook in the commit so the GitHub Actions checkout can build it into the image; a file existing only on your computer is unavailable to CI.
4. No production workbook upload or data volume is needed. Do not mount an empty host directory over `/app/data/exams`, because it would hide the bundled file. The development Compose definition mounts only `config/exams` read-only for config hot reload; production can add that optional config mount after placing the registry on the host. Cache and delivery logs live in PostgreSQL, not the container filesystem.
5. Rebuild/recreate the worker to install dependencies and environment changes. Keep `EXAM_REMINDERS_ENABLED=false`, `EXAM_REMINDERS_SEND_ENABLED=false`, and `EXAM_REMINDERS_DRY_RUN=true` during initial checks.
6. Validate, audit all dates, and inspect a dry-run email before enabling mail. Run commands below in `server-acc`, or prefix `docker compose exec fetcher-acc` when using Docker.

```sh
npm run exams:validate -- --dataset endsem-autumn-2026
npm run exams:audit -- --dataset endsem-autumn-2026 --all-dates --output exam-output/audit
npm run exams:run -- --dataset endsem-autumn-2026 --date 2026-11-21 --dry-run --output exam-output/preview
```

These commands use registered DB users when `POSTGRES_DATABASE_URL` is set. Without a DB, pass `--fixture` to use all sheet enrolment rolls with fake addresses, or `--users-fixture path.json` for an array of `{ "id": 1, "rollNo": "...", "email": "..." }`. Fixture modes are prohibited with `--send`. Reports always label the cohort; fixture totals are not registered-user totals.

`validate` loads/validates the source and prints the full quality report without sending. `audit` builds every student's HTML and text email for every exam date without sending and reports recipients, missing-room exams/students, ambiguous-room students, clashes, and valid registered rolls without any exams. Add `--date YYYY-MM-DD` to audit one date. `--output` saves a private JSON report; `run --dry-run --output` also saves individual HTML/text previews. Output contains student data: keep it outside public/served directories and Git. Newly created output directories/files use permissions 0700/0600.

For a real test, configure `EXAM_REMINDERS_ADMIN_EMAIL`, optional `EXAM_REMINDERS_FROM` (otherwise `SMTP_USER`), `EXAM_REMINDERS_SEND_ENABLED=true`, and a nonempty `EXAM_REMINDERS_TEST_ROLLS` or `EXAM_REMINDERS_TEST_EMAILS` comma-separated allowlist:

```sh
npm run exams:run -- --dataset endsem-autumn-2026 --date 2026-11-21 --send --test
```

A live test sends the actual reminder only to allowlisted recipients, plus an admin summary. Confirmed test sends count as sent for that dataset/roll/date and are not resent by the full run. Dry-runs never consume delivery keys. To send manually to all eligible users, omit `--test`; `--send` and the send-enabled environment gate are both required. Manual runs may deliberately target any date; the scheduled run has a cutoff as described below.

After checking test messages, set `EXAM_REMINDERS_ENABLED=true`, `EXAM_REMINDERS_DRY_RUN=false`, and `EXAM_REMINDERS_TEST_MODE=false` for scheduled production sends. `EXAM_REMINDERS_SEND_AT=07:30` overrides the dataset's time when its `sendAtEnv` points to that variable. Recreate containers after changing environment variables; editing a mounted JSON config or the live sheet needs no restart.

## Dataset configuration

The default registry is `server-acc/config/exams/datasets.json`. `EXAM_REMINDERS_CONFIG` or CLI `--config` selects another registry. Use a private mounted registry (for example `datasets.local.json`) when storing live URLs directly in JSON. The default tracked registry contains names/mappings only, not URLs or student data. The selected fallback workbook is tracked separately at `data/exams/endsem.xlsx`; other workbooks and generated reports/previews remain ignored. Replacing the bundled workbook requires a commit and image rebuild; live sheet revisions are still fetched before each run.

The registry contains `activeDatasets` and `datasets`. Several dataset IDs can be active. Give a **new exam/semester** a new ID; retain the same ID for timetable revisions so already-confirmed reminders are not duplicated. Revisions affect pending/failed deliveries, not previously sent emails; this feature is not a timetable-change notification system.

Each dataset has:

| Field | Meaning |
|---|---|
| `id`, `examName`, `adapter` | Stable delivery namespace, displayed exam name, adapter name (default `mapped`). |
| `source.liveUrlEnv`, `source.fallbackPathEnv` | Environment variable names containing the URL and xlsx path. |
| `source.liveUrl`, `source.fallbackPath` | Optional direct values for private mounted configs; nonempty env values override these. Relative file paths resolve beside the registry. |
| `timezone`, `sendAt`, `sendAtEnv` | IANA timezone, HH:mm send time, optional environment override name. |
| `dateFormats` | Accepted Luxon date-format strings, e.g. `yyyy-MM-dd`, `d/M/yyyy`, `dd.MM.yyyy`. Native Excel date cells also work. |
| `coursePattern`, `roll` | Course validation regex; roll `trim`, `uppercase`, `pattern`. No programme/batch whitelist is applied. |
| `separators` | Literal separator arrays for `courses`, `roomCourses`, `roomRolls`, `enrolmentRolls`; string separator for slash-combined `unit`. |
| `slots` | Ordered entries with `id`, `label`, `aliases`, `start`/`end` (HH:mm), `displayTime`, and a `header` mapping for grid layouts. Any number of slots is supported. |
| `timetable`, `rooms`, `enrolments` | Exact `tab` names and `columns` field mappings. Timetable `layout` is `grid` or `rows`. |
| `holidays` | `keywords` for text detection plus ISO `dates` overrides. Dates are never embedded in application logic. |
| `delivery` | `batchSize` (25), `maxPerMinute` (60), `maxAttempts` (3), and `retryMinutes` ([1, 5]). Lower the rate to match the SMTP provider's allowance. |

Header mappings accept a name, array of aliases, or `{ "position": 2 }` for a one-based column. Names ignore case, outer spaces, and repeated internal whitespace. Header rows are discovered; title/blank rows before them are allowed. Reordered/extra columns are harmless; missing *required* columns fail validation. Matched-count and matched-roll pairs, `Count` formulas, and unmapped tabs are ignored.

Grid timetables map `columns.date` and each slot's `header`; row timetables map `date`, `slot`, `unit`. Rooms require `date`, `slot`, `room`, `unit`, `rolls`; enrolments require `unit`, `rolls`. Unit code sets are order-independent, so `EE6103/EE6117` and `EE6117/EE6103` match. Duplicate rows/rolls are merged. Trailing numeric counts such as `(21)` in room course cells are removed.

For a **published** `/spreadsheets/d/e/.../pubhtml` link, set `source.publishedTabGids` to an object mapping each of the three exact tab names to its published numeric gid string. The loader fetches those three CSVs, converts them to a workbook in memory, and uses the same parser. Publish all required tabs. Standard view-only `/spreadsheets/d/ID/edit` URLs require no gid mappings. An accessible single tab is insufficient if the other required tabs are private.

See `server-acc/tests/exams/fixtures/alternate.json` for a second complete dataset with different tabs and columns, a row-based timetable, a different roll format, `+` combined units, pipe separators, and three renamed slots. No matching or email code changes are needed for it.

## Adding an adapter

Add a parser in `services/exams/adapters/` and register it in the exported `adapters` map in `services/exams/workbook.js`. Use `adapterOptions` in the dataset for adapter-specific settings; mapped-layout column requirements do not apply to other adapters. Its interface is `(excelJsWorkbook, config) => model` (sync or async), and it must validate its required structure before returning:

```js
{
  timetable: [{ date: 'YYYY-MM-DD', slotId: 'configured-id', unit: 'canonical-code-set' }],
  rooms: [{ date: 'YYYY-MM-DD', slotId: 'configured-id', room: '102', unit: 'canonical-code-set', rolls: new Set() }],
  enrolments: new Map(), // canonical unit -> Set of normalised rolls
  holidays: new Set(), // YYYY-MM-DD
  labels: new Map() // canonical unit -> course label displayed in email
}
```

Dates must be dataset-local calendar dates; slots must exist in config; rolls and units must follow the configured normalisers. Reuse `normalise.js`. Keep validation inside the adapter so an invalid live dataset triggers fallback. Register the adapter name in the dataset and add fixtures/tests. Scheduling and email code only consume this model.

## Source fallback and data quality

Every invocation fetches and validates live data first. On network/access/format/validation failure: reparse the last validated live workbook from PostgreSQL, then try the configured xlsx. Cache keys include dataset ID, URL, and published tab mapping; a new URL cannot accidentally use an old sheet's cache. Cache age/hash and failure reasons appear in each run summary. A cached copy is used regardless of age, as requested; review its timestamp when live fetches fail. If every source fails, student sends stop and the admin is alerted. `validate` and dry-run send no mail, including admin mail.

Reports include units without enrolment rows, enrolment-only units, missing/ambiguous rooms, seated-but-unenrolled rolls, and same-slot clashes. They also count unregistered sheet rolls, invalid user rolls/emails, and duplicate DB roll mappings. All registered roles are eligible if their roll matches. Duplicate DB rolls use the lowest-ID account with a valid stored email. No address is reconstructed from a roll.

Room matching uses date/slot/roll membership, with unit-based narrowing when several rooms match. A sole date/slot/roll match is retained even if room course text differs; the seating/enrolment quality report exposes that mismatch. Unresolved multiple rooms are listed as candidates with a warning, rather than guessed. Missing rooms do not suppress exam reminders. Emails never include another student's roll or schedule.

## Reliability and recovery

`ExamReminderDelivery` uniquely identifies `(datasetId, roll, examDate)`. Confirmed SMTP successes are skipped on rerun. Durable run/delivery leases and short transaction-scoped advisory locking prevent workers and manual runs from simultaneously owning the same work. No network request or SMTP send holds an open database transaction. Leases last 15 minutes and are renewed every minute while active.

The selected policy **prioritises delivery**: failed transient sends and expired/uncertain claims can be retried. Three attempts total are allowed by default, with 1-minute then 5-minute backoff; permanent SMTP failures are not retried. A crash after SMTP acceptance but before the DB success write can cause a duplicate on recovery. SMTP cannot make that window atomic; a stable Message-ID helps diagnostics, but is not a provider deduplication guarantee. Failure to persist a confirmed outcome leaves the claim uncertain instead of treating it as a safe failure.

The worker resumes due retries and expired runs for active datasets on the current local date. Catch-up starts at the configured send time and ends at that day's **first configured exam start**. It stops sending when that cutoff is reached, even if some recipients remain; the summary reports the missed window. Holidays/no-exam days send no student mail and are logged/summarised. Manual `run --send --date ...` bypasses the scheduled cutoff, so an operator can deliberately recover a missed run. A manual transient failure can also be retried by rerunning that command; backoff and attempt limits still apply.

Each live invocation sends a summary to `EXAM_REMINDERS_ADMIN_EMAIL`, including source/fallback metadata, current-attempt counts, cumulative delivery statuses, skipped counts and a JSON data-quality attachment. Failed admin summaries are recorded (`adminStatus`, `adminError`) and logged. Inspect `[exams]` worker logs and `ExamReminderRun`; there is no admin UI. Bad scheduler configuration alerts at most once per day. Dry-run scheduled results are logged/stored once per date/mode without SMTP or delivery writes.

The provider throttle serialises feature runs across replicas, with configurable batches and minimum spacing between student attempts and the admin summary. Set a conservative rate because other portal features share the transporter/provider.

## Verification

```sh
npm test
npm test -- tests/exams
npx prisma validate
```

The server has no lint script; run syntax checks for changed JS and `git diff --check`. Feature tests use in-memory generated workbooks and a stateful delivery-store double; they send no real mail. They cover normalisation, changed mappings/slots/layouts, missing tabs/columns, live/cache/fallback, published CSV loading, holidays, multiple exams, room ambiguity, clashes, recipient privacy, allowlists, concurrent runs, idempotency, retry limits, expired claims and SMTP-success/DB-failure recovery.

The optional `store.integration.test.js` suite uses two real Prisma connections to check PostgreSQL claims, lease revocation, cache persistence, retry limits and end-to-end idempotency. Point `EXAM_TEST_DATABASE_URL` at a **disposable localhost database named `exam_test`** after applying the exam migration, then run `npm test -- tests/exams/store.integration.test.js`. It resets the three exam tables per test and refuses other database names/hosts. Without that variable, those seven tests are skipped. The migration and all seven checks were also verified in an isolated PostgreSQL 16 container during implementation; no portal database was modified.
