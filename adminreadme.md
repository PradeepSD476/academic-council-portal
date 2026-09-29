# Research Vault — Admin Panel Build Guide

This document is the contract and build guide for the **admin panel** that manages Research Vault content. The student-facing side is complete and read-only with respect to everything described here — it computes what it displays on every read, so the admin panel's job is simply to write correct data. **Do not change field names, enum values, or the computed-status rule** without updating `server-acc/utils/openingStatus.js`, `server-acc/controllers/researchVault.js`, and the student UI in the same change.

Related reading: `readme1.md` (student features, API, data model), `server-acc/utils/openingStatus.js` (the status rule), `server-acc/prisma/schema.prisma` (exact fields).

## Contents

- [Ground rules](#ground-rules)
- [What already exists (reuse it)](#what-already-exists-reuse-it)
- [Module 1: Experience moderation](#module-1-experience-moderation)
- [Module 2: Open positions & structured openings](#module-2-open-positions--structured-openings)
- [Module 3: Faculty profiles & profile links](#module-3-faculty-profiles--profile-links)
- [Module 4: Resource moderation & custom areas](#module-4-resource-moderation--custom-areas)
- [Module 5: Analytics & queues](#module-5-analytics--queues)
- [The computed-status contract (critical)](#the-computed-status-contract-critical)
- [Testing checklist](#testing-checklist)

## Ground rules

1. **Auth:** every admin route must sit behind `checkAuth` + `checkResearchAdmin` (permits `RESEARCH_ADMIN`, `FACULTY`, `SUPER_ADMIN`). This middleware pair is already used by the existing admin routes in `server-acc/routes/researchVault.js` — copy those declarations.
2. **No new auth, no new tables.** Everything below writes to existing Prisma models in the `research_vault` schema (see `schema.prisma`). New columns/tables require a new migration under `server-acc/prisma/migrations/` — follow the naming pattern `YYYYMMDDHHMMSS_description/migration.sql`.
3. **Never trust client-set moderation fields on student routes.** The student controllers already `delete` `status`, `reviewNote`, `uploadedById`, etc. from request bodies. Keep it that way; the admin panel writes them only through admin routes.
4. **Suggested page location:** there is an existing admin page shell at `/admin/research-vault` (`client-acc/src/pages/ResearchVault/ResearchVaultAdmin.jsx`, route registered in `App.jsx`). Either extend it with tabs or create sibling pages under `/admin/research-vault/...` reusing the same route guard.
5. **UI conventions:** blue accent `var(--color-secondary)`, fully-rounded pills (`rounded-full`), `rounded-2xl` cards with `border-slate-200 bg-white/95 shadow-sm`, modal pattern from the Submit Resource / confirmation dialogs in `client-acc/src/pages/ResearchVault/index.jsx`. No new color schemes.

## What already exists (reuse it)

| Piece | Where | Notes |
| --- | --- | --- |
| Admin route guard | `server-acc/middlewares/` (`checkAuth`, `checkResearchAdmin`) | Chain as `checkAuth, checkResearchAdmin` |
| Admin page shell | `/admin/research-vault`, `ResearchVaultAdmin.jsx` | Has analytics + a moderation queue stub |
| Analytics endpoint | `GET /api/v1/vault/admin/analytics` | Counts experiences by status, top resources/faculty, per-area activity |
| Experience moderation queue read | `GET /api/v1/vault/admin/experiences` | Returns `PENDING_REVIEW` experiences with author + areas |
| Experience status decision | `PATCH /api/v1/vault/admin/experiences/:id/status` | Body `{ status: 'APPROVED'\|'REJECTED'\|'PENDING_REVIEW', reviewNote? }` |
| Faculty create/edit/archive | `POST /faculty`, `PUT /faculty/:id`, `DELETE /faculty/:id` | Admin-guarded already |
| Research areas | `POST /api/v1/vault/areas` | Add to shared taxonomy |
| Resources CRUD | `POST /resources`, `PUT /resources/:id`, `DELETE /resources/:id` | Admin-guarded already |
| Positions CRUD | `POST /positions`, `PUT /positions/:id`, `DELETE /positions/:id` | Admin-guarded already |
| File upload (presigned PUT) | `POST /api/v1/upload/get-upload-url` → PUT bytes to `signedUrl` | Same flow as Announcements/Forum; object key returned as `filePath` |

## Module 1: Experience moderation

**Queue:** call `GET /admin/experiences`. Each item includes `uploadedBy` (`displayName`, `rollNo`), `researchAreas`, `experienceType`, `summary`, `description`, `faculty` (internal link) or `externalGuideName`/`externalGuideAffiliation`, `labName`, `duration`, `department`.

**Decide:** `PATCH /admin/experiences/:id/status` with:
- `status`: `APPROVED` (publish), `REJECTED`, or `PENDING_REVIEW` (send back)
- `reviewNote` (optional, shown to the author on REJECTED — e.g. why it was rejected)

**Rules you must respect:**
- The public feed shows `APPROVED` only; authors always see their own submissions in "My Submissions". Rejection is not deletion.
- When an **author** edits their approved/rejected experience via `PUT /experiences/:id`, the controller automatically sets it back to `PENDING_REVIEW` (unless the editor is an admin). The queue will repopulate — build the UI to expect that.
- Suggested UX: two-pane queue (content left, decision panel right) with Approve / Reject (asks for `reviewNote`) / flag-for-changes buttons.

## Module 2: Open positions & structured openings

**Create/edit** via `POST /positions` / `PUT /positions/:id` with these exact fields (model `research_vault.ResearchOpenPosition`):

| Field | Type | Notes |
| --- | --- | --- |
| `title` | String (required) | |
| `description` | Text | What the student will do |
| `positionType` | String | `SUMMER_RESEARCH` \| `THESIS` \| `READING_PROJECT` \| `RA_SHIP` \| `PHD_ASSIST`. **Extend this exact vocabulary if a new category is needed — never introduce a second enum.** |
| `eligibility` | Text, nullable | e.g. "2nd/3rd year, ML coursework preferred" |
| `requirements` | Text, nullable | Skills/tools; plain text with `-` bullets (UI renders pre-wrap) |
| `positionsAvailable` | Int, default 1 | |
| `positionsFilled` | Int, default 0 | Increment as seats are taken outside the app |
| `status` | `OpeningStatus` enum: `OPEN` \| `CLOSED`, default `OPEN` | The **explicit early-close switch** only — see [contract](#the-computed-status-contract-critical) |
| `deadline` | DateTime, nullable | Past deadline ⇒ computes CLOSED ("Deadline passed"). To accept late applications, **extend the deadline**, don't flip flags |
| `applicationUrl` | String, nullable | Form/application link |
| `applicationInstructions` | Text, nullable | Longer instructions text |
| `howToApply` | String, nullable | Short instruction or a URL (student UI auto-detects URLs → "Apply now" link) |
| `facultyId` | Int, nullable | Link to `FacultyProfile` |
| `isActive` | Boolean, default true | Soft-hide switch |
| `researchAreaIds` | Int[] | Links via the join table (`ResearchOpenPositionResearchArea`) |

**Admin UI checklist for positions:**
- Fields for all of the above; a "Filled: N of M" stepper that writes `positionsFilled`/`positionsAvailable`.
- A **Close opening** action that sets `status = 'CLOSED'` (with confirm dialog), and **Reopen** that sets `'OPEN'`.
- A preview line showing the **computed** status (fetch `GET /faculty/openings/:facultyId` or re-run the rule client-side) so admins can see what students will see — the stored `status` alone is not the truth.
- Delete = `DELETE /positions/:id` (hard delete; bookmark rows cascade).

## Module 3: Faculty profiles & profile links

**Create/edit** via `POST /faculty` / `PUT /faculty/:id`. In addition to the existing fields (`name`, `slug` unique, `designation`, `department`, `email`, `phone`, `photoURL`, `website`, `biography`, `publications`, `isActive`, `researchAreaIds`), the admin form should now expose:

| Field | Type | Notes |
| --- | --- | --- |
| `googleScholarUrl` | String, nullable | Full URL; student UI hides the chip when null |
| `linkedinUrl` | String, nullable | |
| `personalWebsiteUrl` | String, nullable | The professor's own page — `website` remains the **lab/dept** site; keep them distinct |
| `officeLocation` | String, nullable | Free text, e.g. "Block C, Room 214" |

Validate URLs client-side (http/https) and store full URLs — the student UI renders them as `target="_blank" rel="noopener noreferrer nofollow"` chips per field, individually hidden when null.

**Archive, don't delete:** `DELETE /faculty/:id` archives (`isActive = false`); archived faculty vanish from the student directory. `profileViewCount` is maintained server-side; do not write it.

## Module 4: Resource moderation & custom areas

**Moderation contract (unchanged):** set on `ResearchResource`:
- `status`: `PENDING` → `APPROVED` | `REJECTED` (`ResourceStatus` enum)
- `rejection_reason`, `approvedById`, `reviewedAt` on decision
- For hosted files: object already lives in MinIO bucket `MINIO_BUCKET_NAME` (`acc-media`); set `filePath` (object key), `fileSize`, `mimeType`, `format`. `sourceType` (`FILE`/`EXTERNAL_LINK`) is **derived server-side** from `filePath`/`url` — never accept it from a client.

**Wire the file picker (known gap):** the current admin form has a plain "Stored file path" text input. Replace it with the presigned-PUT flow used everywhere else:
1. `POST /api/v1/upload/get-upload-url` with `{ filename, contentType, folder: 'research-vault' }` → `{ signedUrl, filePath }`
2. `PUT` the raw file to `signedUrl` with the matching `Content-Type` (helper: `client-acc/src/lib/getFilePath.js`)
3. Submit `filePath` (plus size/mime/format) with the resource form.

**Custom research areas queue:** user submissions land in `CustomResearchArea` with `status='PENDING'` (one per resource, `resourceId` unique). Build a review list where an admin can:
- **Approve/normalize:** create (or match an existing) `ResearchArea` by `slug`, link it to the resource, set the custom row `status='APPROVED'`
- **Reject:** set `status='REJECTED'`
Until processed, custom areas are invisible to student filters (the Open Positions area dropdown carries an "Other" client-side complement so nothing becomes unfindable).

## Module 5: Analytics & queues

`GET /admin/analytics` already returns: `facultyCount`, `experienceCount` (APPROVED), `pendingExperiences` (PENDING_REVIEW), `discussionCount`, `unansweredDiscussions`, `topResources`, `topFaculty` (by profile views), per-area activity counts. Surface these on the dashboard, and deep-link the pending-experiences count to the Module 1 queue.

## The computed-status contract (critical)

A position is **shown as OPEN to students** if and only if **all three** hold (implemented in `server-acc/utils/openingStatus.js`, mirrored in the faculty "Current openings" filter SQL, and applied on every read of `GET /faculty`, `GET /faculty/:id`, `GET /faculty/openings/:id`):

```
status = 'OPEN'                       (explicit admin switch)
AND positionsFilled < positionsAvailable
AND (deadline IS NULL OR deadline >= today)
```

Consequences for the admin panel:

1. Setting `status = 'OPEN'` on a **filled** or **expired** row will still display as Closed. Fix the data (`positionsFilled` or `deadline`), not the flag.
2. To close early (seat taken outside the app), set `status = 'CLOSED'`. To reopen, set `'OPEN'` **and** ensure seats remain and the deadline hasn't passed.
3. Deadline-passed openings show "Deadline passed" and count as closed everywhere (cards, filters, matching) even with seats remaining. If a professor wants late applicants, **extend `deadline`** — the app never silently ignores it.
4. Never write a "computed status" column or try to pre-bake it — there is exactly one source of truth: `utils/openingStatus.js`. If you add a read path that shows positions, run rows through `isOpenOpening`/`openingComputedStatus`.
5. `positionType` values feed "Find a research match" alias matching (`positionTypeAliases` in `controllers/researchVault.js`). Adding a new type requires adding it to `POSITION_TYPES` in `utils/openingStatus.js` and an alias entry so the matcher can see it.

## Testing checklist

- Backend unit tests: `cd server-acc && npm test` (computed-status rule: filled, expired, explicit-closed, boundary at deadline == now, label formats). Extend this file when touching the rule.
- Schema changes: `npx prisma validate`, `npx prisma migrate deploy`, `npx prisma generate` (host-side commands need the local `POSTGRES_DATABASE_URL` prefix — see readme1.md).
- Syntax/lint: `node --check` changed server files; `npx eslint <changed client files> --rule '{"no-undef":"error"}'` from `client-acc`.
- Live smoke (Docker): rebuild `backend-acc`/`frontend-acc`, `docker compose up -d`, `docker restart acc-nginx`; verify as admin: approve an experience (appears in public feed), close a position (student card shows "No open positions"/Closed badge), increment `positionsFilled` to capacity (computes Closed), set an expired-deadline row back inside its window by extending the deadline (computes Open), create a faculty profile with all four link fields (chips render; null field → no chip).
- Admin guard: admin endpoints must 401/403 for a plain student token.
