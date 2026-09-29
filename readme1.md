# Research Vault

Research Vault is an authenticated module in the ACC Portal for discovering faculty research, reading student experiences, discussing research questions, and finding preparation resources and openings. It uses the portal's existing React, Express, PostgreSQL, Prisma, cookie/JWT authentication, and shared `User` table.

## Contents

- [Routes](#routes)
- [Student features](#student-features)
- [Administration](#administration)
- [Backend API](#backend-api)
- [Data model and migrations](#data-model-and-migrations)
- [Local development](#local-development)
- [Demo data](#demo-data)
- [Validation](#validation)
- [Recent updates (Discussion tab)](#recent-updates-discussion-tab)
- [Recent updates (Following tab & avatar initials)](#recent-updates-following-tab--avatar-initials)
- [Recent updates (Resources tab)](#recent-updates-resources-tab)
- [Recent updates (Open Positions, Experiences & Faculty tabs)](#recent-updates-open-positions-experiences--faculty-tabs)

## Routes

| Page | Route | Access |
| --- | --- | --- |
| Research Vault home | `/dashboard/research-vault` | Signed-in portal user |
| Position detail | `/dashboard/research-vault/positions/:positionId` | Signed-in portal user |
| Experience detail | `/dashboard/research-vault/experiences/:experienceId` | Signed-in portal user |
| Faculty profile | `/dashboard/research-vault/faculty/:facultyId` | Signed-in portal user |
| Discussion question list | `/dashboard/research-vault/questions` | Signed-in portal user |
| Question detail | `/dashboard/research-vault/questions/:questionId` | Signed-in portal user |
| Research Vault administration | `/admin/research-vault` | `RESEARCH_ADMIN`, `FACULTY`, or `SUPER_ADMIN` |

The backend router is mounted at `/api/v1/vault` in `server-acc/server.js`. Authenticated requests use the portal's existing `token` cookie and `checkAuth` middleware.

## Student features

The Research Vault home is integrated with the dashboard and contains Faculty, Experiences, Discussion, Resources, Open Positions, and Following sections.

- **Faculty directory:** search by name or research area; filter by department, area, and current openings (computed-open rule, not stored flags). Faculty cards show an open-position count and open a full profile page (`FacultyDetail`) with bio, office location, profile links (email, lab/dept site, personal site, Google Scholar, LinkedIn — hidden per field when null), and a structured openings section (open first, closed below a divider).
- **Research matching:** submit any combination of department, topic, and project type. The API ranks up to five faculty by weighted department, research-area, and active-opening matches and returns match reasons. Only computed-OPEN openings count toward the project-type signal; profiles with nothing open are deprioritized, never excluded.
- **Following:** follow/unfollow faculty and research areas. The **Following** tab aggregates recent published experiences, open positions, discussions, and resources related to those follows. This is an in-app feed, not push or email notifications. **Multi-select filters:** click faculty cards or research-area tags to toggle them as active filters; the feed updates to show only activity matching the selected faculty/areas (supports multiple simultaneous selections). A filter indicator above the feed shows all active filters with individual remove buttons and a "Clear all" option.
- **Experiences:** browse `APPROVED` student experiences; submissions start as `PENDING_REVIEW` and appear in the admin moderation queue. A guide is either an internal FacultyProfile link **or** external free-text details (name + affiliation), mutually exclusive. Cards show summary/author/lab/duration/outcome/tags; each experience opens its own detail page with the full narrative and a flat comment thread (chat-style bubbles: own = right/blue, others = left/green; input box below the list; authors soft-delete own comments after confirmation into `[deleted]` placeholders). "My Submissions" shows pending/approved/rejected with reviewer notes and replaces the feed while active.
- **Discussion:** compact question list with search, research-area/status filters, and sorting by newest, reply count, or upvotes. The list requests 20 questions at a time using a cursor and does not render reply bodies.
- **Question detail:** displays the question and up to three initial replies, supports Top/New/Oldest reply sorting, and loads additional replies in batches of 20. Sticky navigation links to the previous/next question and back to the list. The question author or a Research Vault admin can accept one reply; accepting it marks the question resolved. Replies remain open after resolution.
- **Votes:** discussion and reply votes toggle per user. Counts and current-user vote state come from the API.
- **Resources and openings:** browse approved resources with category pills, format/sort dropdowns, search, and pagination. File resources stream from MinIO; views are counted once per user per resource. Students can submit link-only resources for review and manage them under **My Submissions**.
- **Open positions:** a dedicated tab with searchable research-area dropdown, type filter, sort (deadline/newest/department), a "Show closed positions" client-side toggle (no refetch), and a one-click "Saved (N)" view for bookmarked positions. Expired postings are hidden by default and shown dimmed when "Show closed" is on. Each position opens a detail page with description, eligibility, application instructions, faculty deep-link (scroll + highlight), and Save/bookmark.
- **Author identity:** discussions, replies, resources, and experiences show display name and roll number ("Name · Roll Number"). The signed-in user's messages are blue/right-aligned; other users' replies are sage/left-aligned. Clicking the already-active tab pill is a no-op (no refetch, no state loss); Save/bookmark toggles are optimistic with zero list refetches and revert only on API failure.

## Recent updates (Discussion tab)

The Discussion tab (`/dashboard/research-vault/questions`) has been completely refactored to match the visual design system of the other five tabs (Faculty, Experiences, Resources, Open positions, Following):

### Visual consistency
- **Persistent header:** Now uses the same accent bar + icon + "Research Vault" title as other tabs. The page-specific title ("Discussion — Questions and answers from the research community.") appears as a secondary heading below it.
- **Tab navigation:** Full pill-style tab bar (Faculty, Experiences, Discussion, Resources, Open positions, Following) is present with Discussion highlighted. Tabs navigate via `?section=` query params for deep linking.
- **Filter row styling:** Reuses the `vault-toolbar` component with identical input/dropdown styling (rounded-xl, border-slate-200, bg-white/90, focus:border-[var(--color-secondary)]).
- **Extended sort options:** Newest, Oldest, Most replies, Most upvoted, **Unanswered first** (Discussion-specific).
- **Clear filters button:** Appears automatically when any filter differs from defaults (search, tag, status, or sort). Resets all filters to defaults on click.

### New features
- **Ask a question button** in header (matches "Share an experience" pattern from Experiences tab).
- **Modal form** with title, Markdown-supported content, optional research area dropdown, and "Post Question" submit. On success, the list auto-refreshes via `refreshVersion` state.

### Comment/answer card redesign (standard chat UI)
- **Author header** (top-left): Bold name, secondary rollNo, timestamp, optional "Verified faculty" badge.
- **Content** (primary focus): Left-aligned, full-width, readable `text-sm leading-6`.
- **Footer** (below content): Like button + count, Reply button, optional "Mark as answer" (for question author).
- **Alignment by ownership:**
  - Own replies: right-aligned (`ml-auto`), blue border/background, `text-right`
  - Others' replies: left-aligned (`mr-auto`), emerald border/background, `text-left`
- Applied to both `DiscussionItem` (list view) and `ResearchQuestionDetail` (detail view).

### Technical improvements
- Email validation bypass for testing (`TEST_EMAIL_BYPASS=true` in `.env` allows any email format).
- Docker Compose updated to use LocalStack for S3-compatible storage (MinIO replacement).
- Mock discussion seeded from user Sahil (2501CT20) with research areas: Machine Learning, Computer Vision, NLP.
- `refreshVersion` state triggers list re-fetch after posting a question.

## Administration

The Research Vault admin page provides:

- Analytics for faculty, published/pending experiences, discussions, unanswered questions, popular faculty/resources, and activity by area.
- An experience moderation queue with publish and reject actions.
- Faculty profile creation and archival.
- Research area taxonomy management.
- Resource curation and removal.
- Open-position creation and removal.

Resource moderation contract for admins: set `status` (`APPROVED`/`REJECTED`), `rejection_reason`, `approvedById`, and `reviewedAt` on `ResearchResource`. For hosted files, store objects in the `MINIO_BUCKET_NAME` bucket and set `filePath`, `fileSize`, `mimeType`, and `format`; the download endpoint streams from MinIO using `filePath` as the object key. `sourceType` (`FILE` vs `EXTERNAL_LINK`) is derived server-side from `filePath`/`url` and is never accepted from clients. User-submitted custom research areas land in `CustomResearchArea` with `status='PENDING'`; an admin should rename/merge them into `ResearchArea` (or reject them) before they become filterable app-wide — the admin UI for this queue is not built yet.

`checkResearchAdmin` permits `RESEARCH_ADMIN`, `FACULTY`, and `SUPER_ADMIN`. Students can browse, post experiences/questions/replies, vote, follow, and submit interest matches, but cannot use admin endpoints.

## Backend API

Base URL: `/api/v1/vault`

### Browse and pagination

| Method and path | Purpose |
| --- | --- |
| `GET /faculty` | Search/filter faculty (`search`, `department`, `area`, `openings`, `page`, `limit`); responses include `openOpeningsCount` (computed) and the new link fields |
| `GET /faculty/:id` | Faculty profile by ID or slug with openings array (each carrying computed `computedStatus`); records profile views |
| `GET /faculty/openings/:id` | Standalone computed-openings list for a faculty profile |
| `GET /experiences` | Published experiences (`facultyId`, `department`, `areaId`, `search`, `page`, `limit`) |
| `GET /experiences/:id` | Published experience detail |
| `GET /questions` | Authenticated cursor-paginated question list |
| `GET /questions/:id` | Authenticated question detail with initial replies and neighboring question IDs |
| `GET /questions/:id/replies` | Authenticated cursor-paginated reply list |
| `GET /resources` | Approved resources with `category`, `format`, `search`, `areaId` filters, `sort=newest|most_viewed|most_downloaded`, and `page`/`limit` pagination |
| `GET /areas` | Research area taxonomy; optional `search` matches names and descriptions |
| `GET /positions` | Open positions; default view = active with deadline not passed; `includeClosed=true` returns all. Filters: `search`, `department`, `areaId`, `positionType`, `facultyId`; `sort=deadline\|newest\|department`; per-user `bookmarked` flag via optional auth |
| `GET /positions/:id` | Position detail (200 for expired rows; used by "Show closed" / detail page) |
| `GET/POST/DELETE /positions/bookmarks` | Per-user position bookmarks (bookmarks routes declared before `/positions/:id`) |
| `GET /experiences/mine` | The current user's experiences in all statuses (declared before `/experiences/:id`) |
| `GET/POST/DELETE /experiences/:id/comments` | Flat experience comment thread; writes require auth; DELETE own (soft delete) |
| `POST /resources/:id/view` | Record a unique per-user view on an approved resource; returns the updated count |
| `GET /resources/:id/download` | Authenticated; stream a file resource from MinIO with attachment headers and increment the download count |
| `POST /resources/:id/download` | Legacy download counter (kept for admin panel compatibility) |

Question list parameters include `cursor`, `limit` (default 20, maximum 50), `sort=newest|replies|upvoted|oldest|unanswered`, `tag=<area-slug>`, `search`, `unanswered=true`, and `resolved=true`. The response includes `items`, `total`, `has_more`, and `next_cursor`.

Reply pagination accepts `cursor`, `limit` (default 20, maximum 50), and `sort=top|newest|oldest`. Question detail returns up to three top replies for initial rendering. Cursor values are opaque and tied to their sort order; start again without a cursor when changing sort.

### Authenticated student actions

| Method and path | Purpose |
| --- | --- |
| `POST /experiences` | Submit an experience for moderation |
| `POST /discussions` | Create a question |
| `POST /discussions/:id/replies` | Reply to a question or reply |
| `POST /discussions/:id/vote` | Toggle a question vote |
| `POST /discussions/:id/replies/:replyId/vote` | Toggle a reply vote |
| `POST /discussions/:id/replies/:replyId/accept` | Accept an answer; question author/admin only |
| `POST /interest-matching` | Save interests and retrieve ranked faculty matches |
| `POST /resources/submit` | Submit a link-only resource for review; enforces a pending cap of 10 and returns duplicate-URL warnings without blocking |
| `GET /resources/mine` | List the current user's resource submissions in all statuses |
| `PATCH /resources/mine/:id` | Edit the user's own pending submission |
| `DELETE /resources/mine/:id` | Withdraw the user's own pending submission |
| `GET /follow` | Read the current user's faculty/area follows |
| `GET /follow/updates` | Read recent activity for followed faculty/areas. Optional: `facultyIds=1,2,3` and `areaIds=4,5` comma-separated query params to filter by specific faculty/research areas. When `facultyIds` is provided without `areaIds`, the faculty's research areas are automatically included. |
| `POST /follow/faculty`, `DELETE /follow/faculty/:id` | Follow/unfollow faculty |
| `POST /follow/area`, `DELETE /follow/area/:id` | Follow/unfollow research areas |

### Admin actions

| Method and path | Purpose |
| --- | --- |
| `POST /faculty`, `PUT /faculty/:id`, `DELETE /faculty/:id` | Create, edit, or archive a faculty profile |
| `POST /areas` | Add a research area |
| `GET /admin/experiences` | Read `PENDING_REVIEW` experiences awaiting moderation |
| `PATCH /admin/experiences/:id/status` | Approve/reject/reset an experience; body `{ status, reviewNote? }`; re-editing by the author re-enters moderation |
| `PUT /experiences/:id`, `DELETE /experiences/:id` | Edit (admin; author edits of approved/rejected re-enter moderation) or delete an experience |
| `DELETE /discussions/:id` | Remove a discussion |
| `POST /resources`, `PUT /resources/:id`, `DELETE /resources/:id` | Manage curated resources |
| `POST /positions`, `PUT /positions/:id`, `DELETE /positions/:id` | Manage openings |
| `GET /admin/analytics` | Read Research Vault analytics |

## Data model and migrations

Research Vault-owned tables live in PostgreSQL schema `research_vault`. Existing portal tables and enums stay in `public`. Vault records reference `public.User` for identity; user records are not copied into the Vault schema.

Core models include `FacultyProfile`, `ResearchArea`, `StudentResearchExperience`, `ResearchDiscussion`, threaded `ResearchDiscussionReply`, votes, resources, open positions, interests, and faculty/area follows. Many-to-many tables associate research areas with faculty, experiences, discussions, and resources. Resources carry moderation `status`, `sourceType` (`FILE`/`EXTERNAL_LINK`), and per-user views via `ResourceView`; `CustomResearchArea` holds user-submitted areas pending admin review.

Relevant migrations:

- `20260926180000_research_vault`: creates the Vault schema, tables, relations, and `RESEARCH_ADMIN` role.
- `20260927100000_add_accepted_research_answer`: adds the accepted-reply flag.
- `20260927120000_research_discussion_indexes`: indexes discussion chronology/status, tag lookup, and reply pagination.
- `20260929000000_resource_status_and_views`: adds the `ResourceStatus` enum (`PENDING`/`APPROVED`/`REJECTED`), resource status/moderation fields, view/download counters, and the per-user `ResourceView` table.
- `20260930000000_resource_source_type_and_custom_areas`: adds `sourceType` (`FILE`/`EXTERNAL_LINK`, backfilled from `filePath`/`url`) and the `CustomResearchArea` review table.
- `20260930000000_experience_moderation_and_comments`: renames experience statuses to the `ExperienceStatus` enum (`PENDING_REVIEW`/`APPROVED`/`REJECTED`; existing PUBLISHED→APPROVED), adds `summary`/`department`/`experienceType`/`reviewNote`, drops `guideName`, and creates the soft-deleting `ResearchExperienceComment` table.
- `2026093001000000_external_experience_guides`: adds `externalGuideName`/`externalGuideAffiliation` (mutually exclusive with the internal faculty link, enforced in the controller).
- `20261001000000_position_bookmarks_and_areas`: adds `applicationInstructions` on positions, the position↔research-area join table, and `ResearchOpenPositionBookmark` (`@@unique([positionId, userId])`).
- `2026100112000000_faculty_profile_links_and_openings`: adds `FacultyProfile` link fields (`googleScholarUrl`, `linkedinUrl`, `personalWebsiteUrl`, `officeLocation`) and structured openings fields on `ResearchOpenPosition` (`requirements`, `positionsAvailable`, `positionsFilled`, `status` (`OpeningStatus` OPEN/CLOSED), `howToApply`).

After pulling, apply migrations and regenerate Prisma Client before running the backend:

```powershell
cd server-acc
npx prisma migrate deploy
npx prisma generate
npx prisma migrate status
```

## Local development

The portal uses PostgreSQL. A contributor does not need access to the shared project database; use a local database. Docker example:

```powershell
docker run --name acc-vault-postgres `
  -e POSTGRES_USER=acc `
  -e POSTGRES_PASSWORD=local_dev_only `
  -e POSTGRES_DB=acc_dev `
  -p 5433:5432 `
  -d postgres:16
```

Set the local database URL in the same shell used to run Prisma/backend commands. In Command Prompt (`cmd`):

```cmd
set "POSTGRES_DATABASE_URL=postgresql://acc:local_dev_only@localhost:5433/acc_dev?schema=public"
```

In PowerShell:

```powershell
$env:POSTGRES_DATABASE_URL = "postgresql://acc:local_dev_only@localhost:5433/acc_dev?schema=public"
```

Apply migrations, then start the backend:

```text
cd server-acc
npx prisma migrate deploy
npx prisma generate
npm run dev
```

In another terminal, create `client-acc/.env` with the API root **without** the version suffix (the client appends `/v1`):

```dotenv
VITE_API_URL=http://localhost:3000/api
```

Then run:

```text
cd client-acc
npm install
npm run dev
```

Open `http://localhost:5173`. Sign in or create a local account. If SMTP credentials are unavailable, a local-only `DEV_OTP_MODE=true` setting logs registration OTPs in the backend terminal; the server explicitly disables this behavior when `NODE_ENV=production`. Keep local `.env` files uncommitted.

To test the admin page with a local account, promote that account in the local database only:

```sql
UPDATE "User" SET "role" = 'RESEARCH_ADMIN' WHERE "email" = 'your-local-email';
```

Sign out and back in so the role refreshes in the session.

## Demo data

From `server-acc`, run:

```text
npm run seed:research-vault
```

The script is idempotent and refuses to run unless `POSTGRES_DATABASE_URL` points to `localhost` or `127.0.0.1` and database `acc_dev`. It creates broad sample area tags, three faculty profiles, published and pending experiences, resources, openings, and discussions/replies from the local contributor and a mock `Sahil · 2501CT20` account. The mock account has a random, unusable password and cannot sign in. Sample discussion content is normalized in place; the seed removes the known `hello` placeholder reply.

Resources demo seed (idempotent; upserts by title and targets the local Docker database, e.g. `iitp_db` on `localhost:5432`):

```text
cd server-acc
set POSTGRES_DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<db>
node prisma/seedResources.js
```

It creates 12 `APPROVED` demo resources — 5 backed by real PDF/DOCX objects uploaded to MinIO via `prisma/seed-resources.make-files.py`, 7 external links — links them to research areas, seeds deterministic view rows, ensures 22 cross-department research areas in the shared taxonomy, and queues two demo `CustomResearchArea` entries for the admin review flow. Re-running updates rows in place rather than duplicating them.

For the admin preview, open `/admin/research-vault`. For the student experience, open `/dashboard/research-vault`; choose **Discussion** to reach the paged question list.

## Validation

The implementation was checked with:

```text
client-acc: npx eslint src/App.jsx src/api/researchVaultApi.js src/pages/ResearchVault/index.jsx src/pages/ResearchVault/ResearchQuestionList.jsx src/pages/ResearchVault/ResearchQuestionDetail.jsx
client-acc: npm run build
server-acc: node --check controllers/researchVault.js
server-acc: npx prisma validate
server-acc: npx prisma migrate status
server-acc: npm test  # unit tests for the openings computed-status rule (tests/openingStatus.test.mjs)
```

Cursor sorting, question navigation, reply batches, vote toggles, accepted-answer permissions, and local seed content were also exercised against the local PostgreSQL database.

The Resources tab work was additionally verified with `npx eslint src/pages/ResearchVault/index.jsx --rule '{"no-undef":"error"}'` (clean), `node --check` on the changed server files, `npx prisma validate`, both new migrations applied via `prisma migrate deploy`, and live API checks (browse filters/sort/pagination, authenticated download of MinIO-hosted PDF/DOCX bytes, unique view counting, custom-area persistence). An automated headless-Chrome (CDP) pass clicked **Open PDF** on a rendered card and confirmed the on-card view counter incremented immediately without a refetch, audited computed border-radii of chips/pills/badges (no non-rounded chips left in the vault UI), and screenshot-verified the Submit modal (23 area pills including the dashed **Other** pill revealing a custom input). The nginx 502 self-heal was proven by recreating the backend container and observing 502 → 200 within one resolver TTL without restarting nginx.

## Recent updates (Following tab & avatar initials)

### Following tab — multi-select activity filters

The **Following** tab now supports interactive filtering of the "Recent Activity" feed:

- **Click to select:** Clicking a faculty card or research-area tag toggles it as an active filter. Multiple items can be selected simultaneously.
- **Multi-select:** Combine any number of faculty members and research areas. The feed shows activity matching **all selected filters** (OR logic within each group, AND across groups).
- **Visual feedback:** Active filters are highlighted with a colored ring/border and show a "Selected" badge.
- **Filter indicator:** A pill above the activity list displays all active filters with individual ✕ remove buttons and a "Clear all" button.
- **Re-click to deselect:** Clicking a selected faculty/tag removes it from the filter.
- **Backend support:** `GET /follow/updates` now accepts `facultyIds` and `areaIds` as comma-separated query parameters. When faculty filters are applied, the backend automatically includes those faculty's research areas in the area filter, so discussions/resources tagged with those areas also appear.

### Avatar initials — consistent name parsing across the app

A shared `getInitials(name, fallback)` utility (`client-acc/src/lib/utils.js`) now computes avatar initials consistently:

- **Strips common titles:** `Dr.`, `Prof.`, `Mr.`, `Ms.`, `Mrs.`, `Miss`, `Mx.` (case-insensitive) before computing initials.
- **First + last name:** "Neha Agarwal" → **NA**, "Vikram Singh Rathore" → **VR** (first word + last word).
- **Single name fallback:** Uses first letter of the only name part.
- **Applied everywhere:** Research Vault Following tab, Navbar user avatar, DashboardLayout sidebar avatar, Admin ManageUsers table/cards.

## Recent updates (Resources tab)

### Browse experience

- **Filter row:** category pills (All, Guide, SOP Writing, LOR, Cold Email, PhD Apps, Grant Writing, Template, General), a format dropdown (External Link/PDF/DOCX), and a sort dropdown (Newest, Most Viewed, Most Downloaded) sit alongside the shared `vault-toolbar`; pagination (12 per page) appears when results exceed one page.
- **Header alignment:** "Submit Resource" moved into the same top-right header slot as "Share an experience"/"Ask a question"; the competing "Curated Resources" heading block was removed. **My Submissions** is a secondary toggle in the filter row, not a second header button.
- **Pill styling:** tab pills, category pills, chips, badges, modal controls, and card action buttons share the fully-rounded (`rounded-full`) style used across the vault.

### Resource cards

- **Honest actions by `sourceType`:** `EXTERNAL_LINK` resources show **Open Link** (opens in a new tab with `rel="noopener noreferrer nofollow"`) plus an "Opens externally ↗" cue; `FILE` resources show **Open PDF** (inline) and/or **Download**. `sourceType` is derived and persisted server-side, never guessed from URL or filename on the client.
- **Optimistic counters:** the view/download count shown on a card updates immediately on click, then reconciles monotonically against the server response (`Math.max`), so counts never flash back down when a repeat view returns an unchanged unique count.
- **Author line:** resource and experience cards use the same "Name · Roll Number" format as Discussion.

### Submit Resource modal

- Link-only submissions with per-field validation, a consent checkbox, and a success state; duplicate-URL warnings are surfaced without blocking.
- Research areas come from the shared `/vault/areas` list (22 cross-department areas seeded, not just the original CS/EE eight); a dashed **Other** pill reveals a free-text input. Custom areas are stored in `CustomResearchArea` flagged `PENDING` for admin review/normalization and never auto-enter the shared taxonomy.

### My Submissions

- A toggle in the filter row lists the user's submissions with status badges (Pending/Approved/Rejected). Pending items can be edited or withdrawn; rejected items show `rejection_reason` and offer "Resubmit as new".

### Backend and data model

- The browse endpoint serves `APPROVED` resources only, with category/format/search/area filters, three sort orders, and a paginated envelope.
- `POST /resources/:id/view` records one view per user per resource via `ResourceView`; `GET /resources/:id/download` streams from MinIO with attachment headers and increments `downloadCount` server-side.
- Submissions enforce a pending cap of 10, http/https-only URL validation, ownership-scoped 404s, and pending-only edits/withdrawals.
- Migrations: `20260929000000_resource_status_and_views` and `20260930000000_resource_source_type_and_custom_areas` (see [Data model and migrations](#data-model-and-migrations)).

### File storage: uploads and downloads

Resource files live in **S3-compatible object storage, not on the backend's local disk**. The `acc-minio` container runs LocalStack in S3-emulation mode, reachable as `minio-acc:4566` inside the Docker network (port `4566` is published to the host). Objects are stored in the auto-created `acc-media` bucket (see `server-acc/config/minio.js`, which creates it at boot when missing), and bytes persist in the named Docker volume `academic-council-portal_minio_data`, so files survive container restarts.

**Upload path (presigned PUT — the browser uploads directly to storage; the backend never proxies file bytes):**

1. Client asks the backend for an upload URL: `POST /api/v1/upload/get-upload-url` (mounted in `server-acc/server.js` from `routes/signedURL.js`, `checkAuth`-protected) with `{ filename, contentType, folder }`.
2. `utils/signedUrl.js#getUploadSignedUrl` calls `storage.presignedPutObject(...)` and returns `{ signedUrl, filePath }`, where `filePath` is the object key — e.g. `research-vault/1727635941023-sop-guide.pdf` (`folder/Date.now()-filename`).
3. The client helper `client-acc/src/lib/getFilePath.js` `PUT`s the raw `File` to the signed URL with the matching `Content-Type`, then returns `{ filePath }` for the caller to save on the record.
4. Creating/updating a resource with a `filePath` is enough: the backend derives `sourceType='FILE'` server-side from `filePath`/`url` (clients cannot set `sourceType` directly).

This is the same flow already used by Announcements (`ManageAnnouncement.jsx`), Forum posts (`Editor.jsx`), roadmaps (`RoadmapEditor.jsx`), and course resources (`ManageResources.jsx`, folder `resources/`).

**Download path (what "Open PDF" / "Download" actually resolve to):**

- A card builds its action URL as `${API_URL}/v1/vault/resources/:id/download` (plus `?inline=1` for **Open PDF**).
- `downloadResearchResourceHandler` (`server-acc/controllers/researchVault.js`) looks the resource up by id (approved only), increments `downloadCount`, then calls `storage.getObject(bucketName /* 'acc-media' */, resource.filePath)` and **streams the object straight to the response** with `Content-Disposition: attachment` (or `inline` for the PDF view), a sanitized filename, and `X-Content-Type-Options: nosniff`.
- So a `filePath` of `research-vault/research-email-guide.pdf` resolves to the S3 object `acc-media/research-vault/research-email-guide.pdf` — verified live: the endpoint returned the exact byte count stored in the bucket, body beginning with `%PDF`.

**Current status:** the storage layer and both paths are real and working, but the Research Vault admin page does not yet use the presigned-PUT flow — its resource form (`ResearchVaultAdmin.jsx`) has a plain "Stored file path" text input, so `filePath` values are pasted manually (or created via API). The seeded demo files are not placeholders: `prisma/seed-resources.make-files.py` generates valid PDF/DOCX bytes and uploads them into `acc-media/research-vault/` with `awslocal s3api put-object`, and `seedResources.js` records matching `filePath`/`fileSize`/`mimeType`/`format` values. Wiring the file picker into the admin form is the remaining piece.

### Deployment fixes

- `nginx-acc/conf.d/default.conf` now resolves upstreams through Docker's embedded DNS (`resolver 127.0.0.11 valid=10s`) via variables, so recreating `backend-acc` no longer leaves nginx proxying to a stale IP. Previously every `--force-recreate` of the backend caused 502s until nginx was manually restarted; now it self-heals within one resolver TTL. Verified empirically: backend recreated, 502 → 200 in ~12s with no nginx restart.
- `backend-acc` gained a `/health` healthcheck (busybox `wget`, since the node:20-alpine image has no curl) and `nginx-acc` now uses `depends_on: condition: service_healthy` for the backend.
- The client's nginx sends `Cache-Control: no-cache` for `index.html` and immutable caching for hashed `/assets/`, preventing stale-bundle deployments after rebuilds.
- Removed the dead `VITE_USE_MOCK_RESOURCES` Docker build arg from `client-acc/Dockerfile` and `docker-compose.yml`.

## Recent updates (Open Positions, Experiences & Faculty tabs)

### Open Positions tab

- **Filters:** custom dropdowns (searchable area list with type-ahead + keyboard navigation, arrow-key support in all dropdowns), type filter, sort (deadline/newest/department), and a **Saved (N)** toggle that shows only bookmarked positions. The area dropdown ends with an **Other** option (client-side complement: positions tagged only with non-standard areas remain findable).
- **Show closed positions** is a pure client-side toggle: the tab always fetches open + closed in one request (`includeClosed=true`) and filters locally via the same rule the server uses — toggling costs zero network requests and cannot flash. Self-clicking the active tab pill is also a no-op (no wipe, no reload, no state loss).
- **Bookmarks:** Save/Unsave is optimistic — state flips instantly, the API fires in the background, and the UI reverts only on failure. Bookmarking a position surfaces it under **Saved Positions** on the Following tab and in the Recent Activity feed (deep-linkable).
- **Legacy type labels** map to readable names (Summer Research, Thesis Slot, PhD Position, Research Assistantship, Reading Project) instead of falling through to raw enum text.

### Experiences tab

- **Moderation lifecycle:** `PENDING_REVIEW → APPROVED/REJECTED` via `PATCH /admin/experiences/:id/status` (`checkResearchAdmin`, optional `reviewNote`). Public feed = APPROVED only; authors see all their own statuses in "My Submissions" (status pills + reviewer notes), which replaces the feed while active — no duplicate cards. Editing an approved/rejected experience re-enters moderation; `status`/`reviewNote` are never client-settable.
- **Schema:** required title/lab/duration/summary/narrative; optional prerequisites, key learnings, outcome; multi-select research-area pills; `experienceType` (Internship/Thesis/RA/Independent Project/Course Project/Other). Free-text `guideName` was dropped: the guide is either an internal faculty link (auto-fills department, deep-links to the faculty profile) **or** external free-text details (name required, affiliation) — mutually exclusive, enforced client- and server-side; search covers external guide name/affiliation.
- **Detail page** (`/dashboard/research-vault/experiences/:experienceId`): full narrative, prerequisites, key learnings, outcome callout, area pills, reviewer note for rejected, faculty deep-link. The comment thread is flat and unmoderated (only the article is moderated): chat-style bubbles matching the Discussion tab (own = right/blue `ml-auto bg-blue-50/80 text-right`, others = left/green `mr-auto bg-emerald-50/40 text-left`), input box anchored below the list, author line "Name · Roll", date, own-comment Delete (with confirmation dialog) soft-deleting into a `[deleted]` placeholder; the heading count excludes tombstones.

### Faculty tab (structured openings + profile links)

- **Computed open status:** a position is OPEN ⇔ stored `status = 'OPEN'` ∧ `positionsFilled < positionsAvailable` ∧ (`deadline` null ∨ `deadline ≥ today`). Computed on every read in the shared pure helper `server-acc/utils/openingStatus.js` (`isOpenOpening`, `openingComputedStatus`, `deadlineLabel`); the stored `status` column is only the admin's early-close switch and is never trusted on the user side. Unit-tested in `tests/openingStatus.test.mjs` (8 tests: filled, expired, explicit-closed, boundary at deadline == now, label formats).
- **Cards:** show "N open positions — view profile" or "No open positions — view profile" (computed only; fully-closed faculty stay browseable), and the whole card opens the profile.
- **Profile page** (`/dashboard/research-vault/faculty/:facultyId`): header with office location, About, icon+label links row (email, lab/dept website, personal website, Google Scholar, LinkedIn — each hidden individually when null, all external links `rel="noopener noreferrer nofollow"`), and the openings section: open openings first (soonest deadline first), then closed ones below a "Closed positions" divider. Each opening shows Open/Closed badge, type + area badges, deadline chip ("Closes in N days" / "Deadline passed"), seats ("1 of 2 filled"), labeled Eligibility and Requirements blocks, description, and a "How to apply" callout (URL → "Apply now" link). Loading/empty/error states included.
- **Search/filter:** the "Current openings" checkbox filters to faculty with ≥1 computed-OPEN opening (raw-SQL id prequery, since Prisma cannot compare two columns in a `where`). "Find a research match" counts only computed-OPEN positions toward the project-type signal and deprioritizes (×0.5, never excludes) profiles with nothing open.
- **Endpoints:** `GET /faculty` (adds `openOpeningsCount` + link fields), `GET /faculty/:id` (openings annotated with `computedStatus`), `GET /faculty/openings/:id` (standalone list; declared before `/:id`). No write endpoints — see `adminreadme.md` for the admin-side contract.

### Cross-cutting fixes in this cycle

- **Following-feed 500:** `getFollowingUpdates` still queried the removed `'PUBLISHED'` enum value after the experience-status rename → Prisma threw on every call. Fixed to `'APPROVED'` (and the analytics counters to `'APPROVED'`/`'PENDING_REVIEW'`); verified the feed serializes all four content types (positions/experience/resource/discussion) post-migration.
- **Optimistic UI everywhere:** position Save, "Show closed", tab self-clicks, and "My Submissions" toggles never refetch the list; bookmark state loads on mount and survives tab navigation.
- **Seed:** `seedResources.js` now also seeds faculty profile links (Scholar/LinkedIn/personal/office for 3 demo profiles) and two extra closed-state demos (explicitly `CLOSED`, and fully filled) plus the earlier expired demo, covering every computed-status branch; idempotent as before.