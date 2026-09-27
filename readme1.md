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

## Routes

| Page | Route | Access |
| --- | --- | --- |
| Research Vault home | `/dashboard/research-vault` | Signed-in portal user |
| Discussion question list | `/dashboard/research-vault/questions` | Signed-in portal user |
| Question detail | `/dashboard/research-vault/questions/:questionId` | Signed-in portal user |
| Research Vault administration | `/admin/research-vault` | `RESEARCH_ADMIN`, `FACULTY`, or `SUPER_ADMIN` |

The backend router is mounted at `/api/v1/vault` in `server-acc/server.js`. Authenticated requests use the portal's existing `token` cookie and `checkAuth` middleware.

## Student features

The Research Vault home is integrated with the dashboard and contains Faculty, Experiences, Discussion, Resources, Open Positions, and Following sections.

- **Faculty directory:** search by name or research area; filter by department, area, and current openings. Faculty cards link to contact details, publications, areas, and openings.
- **Research matching:** submit any combination of department, topic, and project type. The API ranks up to five faculty by weighted department, research-area, and active-opening matches and returns match reasons.
- **Following:** follow/unfollow faculty and research areas. The **Following** tab aggregates recent published experiences, open positions, discussions, and resources related to those follows. This is an in-app feed, not push or email notifications.
- **Experiences:** browse published student experiences and submit structured experiences. Student submissions start as drafts and appear in the admin moderation queue.
- **Discussion:** compact question list with search, research-area/status filters, and sorting by newest, reply count, or upvotes. The list requests 20 questions at a time using a cursor and does not render reply bodies.
- **Question detail:** displays the question and up to three initial replies, supports Top/New/Oldest reply sorting, and loads additional replies in batches of 20. Sticky navigation links to the previous/next question and back to the list. The question author or a Research Vault admin can accept one reply; accepting it marks the question resolved. Replies remain open after resolution.
- **Votes:** discussion and reply votes toggle per user. Counts and current-user vote state come from the API.
- **Resources and openings:** browse admin-curated resources and active research positions. Resource opens are counted for admin analytics.
- **Author identity:** discussions and replies show display name and roll number. The signed-in user's messages are blue/right-aligned; other users' replies are sage/left-aligned.

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

`checkResearchAdmin` permits `RESEARCH_ADMIN`, `FACULTY`, and `SUPER_ADMIN`. Students can browse, post experiences/questions/replies, vote, follow, and submit interest matches, but cannot use admin endpoints.

## Backend API

Base URL: `/api/v1/vault`

### Browse and pagination

| Method and path | Purpose |
| --- | --- |
| `GET /faculty` | Search/filter faculty (`search`, `department`, `area`, `openings`, `page`, `limit`) |
| `GET /faculty/:id` | Faculty profile by ID or slug; records profile views |
| `GET /experiences` | Published experiences (`facultyId`, `department`, `areaId`, `search`, `page`, `limit`) |
| `GET /experiences/:id` | Published experience detail |
| `GET /questions` | Authenticated cursor-paginated question list |
| `GET /questions/:id` | Authenticated question detail with initial replies and neighboring question IDs |
| `GET /questions/:id/replies` | Authenticated cursor-paginated reply list |
| `GET /resources` | Search and filter curated resources |
| `GET /areas` | Research area taxonomy; optional `search` matches names and descriptions |
| `GET /positions` | Active open positions |
| `POST /resources/:id/view` | Increment resource view count |
| `POST /resources/:id/download` | Increment resource download count |

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
| `GET /follow` | Read the current user's faculty/area follows |
| `GET /follow/updates` | Read recent activity for followed faculty/areas |
| `POST /follow/faculty`, `DELETE /follow/faculty/:id` | Follow/unfollow faculty |
| `POST /follow/area`, `DELETE /follow/area/:id` | Follow/unfollow research areas |

### Admin actions

| Method and path | Purpose |
| --- | --- |
| `POST /faculty`, `PUT /faculty/:id`, `DELETE /faculty/:id` | Create, edit, or archive a faculty profile |
| `POST /areas` | Add a research area |
| `GET /admin/experiences` | Read draft experiences awaiting moderation |
| `PUT /experiences/:id`, `DELETE /experiences/:id` | Publish/edit or reject/delete an experience |
| `DELETE /discussions/:id` | Remove a discussion |
| `POST /resources`, `PUT /resources/:id`, `DELETE /resources/:id` | Manage curated resources |
| `POST /positions`, `PUT /positions/:id`, `DELETE /positions/:id` | Manage openings |
| `GET /admin/analytics` | Read Research Vault analytics |

## Data model and migrations

Research Vault-owned tables live in PostgreSQL schema `research_vault`. Existing portal tables and enums stay in `public`. Vault records reference `public.User` for identity; user records are not copied into the Vault schema.

Core models include `FacultyProfile`, `ResearchArea`, `StudentResearchExperience`, `ResearchDiscussion`, threaded `ResearchDiscussionReply`, votes, resources, open positions, interests, and faculty/area follows. Many-to-many tables associate research areas with faculty, experiences, discussions, and resources.

Relevant migrations:

- `20260926180000_research_vault`: creates the Vault schema, tables, relations, and `RESEARCH_ADMIN` role.
- `20260927100000_add_accepted_research_answer`: adds the accepted-reply flag.
- `20260927120000_research_discussion_indexes`: indexes discussion chronology/status, tag lookup, and reply pagination.

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

For the admin preview, open `/admin/research-vault`. For the student experience, open `/dashboard/research-vault`; choose **Discussion** to reach the paged question list.

## Validation

The implementation was checked with:

```text
client-acc: npx eslint src/App.jsx src/api/researchVaultApi.js src/pages/ResearchVault/index.jsx src/pages/ResearchVault/ResearchQuestionList.jsx src/pages/ResearchVault/ResearchQuestionDetail.jsx
client-acc: npm run build
server-acc: node --check controllers/researchVault.js
server-acc: npx prisma validate
server-acc: npx prisma migrate status
```

Cursor sorting, question navigation, reply batches, vote toggles, accepted-answer permissions, and local seed content were also exercised against the local PostgreSQL database.