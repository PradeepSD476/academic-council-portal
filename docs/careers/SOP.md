# Jobs & Internships: operating guide (SOP)

This guide is for the people who run the ACC portal's **Jobs & Internships** feature.

- **Part A** is for technical maintainers: deploy it, keep it running, and fix it.
- **Part B** is for ACC career admins: review openings and keep the data clean.

Button and page names below are written exactly as they appear in the portal.

---

## 0. What the feature does, in one minute

- Openings come from two places:
  - **company job boards** (Greenhouse, Lever, Ashby, SmartRecruiters, Workable), fetched on a schedule;
  - **links that students share**.
- Every opening waits for an **ACC career admin to approve it**. Nothing reaches students on its own.
- Students see approved openings under **Career Vault → Jobs & Internships**, next to seniors' experiences for the same company.
- The whole feature is **hidden from students until an admin switches it on**. While it is off, the rest of the portal behaves exactly as before.
- It runs as **two processes from the same code**:
  - the existing **API** (`backend-acc`);
  - a separate **worker** (`fetcher-acc`) that does all fetching and emailing on a timer.

---

# Part A: for technical maintainers

## A1. How it runs

| Piece | What it is | Notes |
|---|---|---|
| API | `backend-acc` (existing) | Serves the pages. It never fetches job boards itself. |
| Worker | `fetcher-acc`, container `acc-fetcher`: same image, runs `node worker.js` | Does all scheduled work. It serves no web traffic. |
| Database | existing Postgres | Holds the feature's tables (21 `careers_*` migrations). |

The API and the worker never call each other. They talk only through the database (the `AppSetting` table):

- **"Fetch now":** when an admin clicks it, the API writes a request; the worker picks it up within about 10 seconds.
- **Heartbeat:** the worker writes one every minute, and the Operations page reads it.

**Worker schedule** (India time by default; change with `CAREERS_TZ`):

| When | Job | What it does |
|---|---|---|
| 02:00, 08:00, 14:00, 20:00 | `ingestAll` | Fetches every enabled job board. New openings go to the review queue. |
| 05:30 | `recheckLiveness` | Rechecks manual and student-link openings, and expires openings whose deadline passed. |
| 09:00 | `alerts` | Sends students' job-alert emails. Only runs if switched on. |
| 10:00 | `reviewReminder` | Emails career admins when openings have waited over 24 h. Only runs if switched on. |
| every 10 min | `linksAndExtraction` | Processes links students shared (and the AI step, if on). |
| every 10 s | `runRequests` | Runs a "Fetch now" request, if there is one. |
| every minute | `heartbeat` | Writes "I'm alive". |

Two copies of the same job never run at once (database lock), so a manual run and a scheduled run can't clash.

## A2. First deploy

Run in `server-acc/` on the server:

1. `npm ci`
2. `npx prisma migrate deploy`: applies the 21 `careers_*` migrations. They only **add** tables and columns; nothing existing is changed or dropped.
3. `npm run careers:seed`: inserts default settings, the starter company list and a starter set of job boards. It only adds what is missing, so it is safe to run again.
4. From the repo root, run `docker compose up -d --build backend-acc fetcher-acc`.
5. Log in as a career admin and open **Sources & Ops** in the sidebar (this is the **Operations** page). Check:
   - the **Worker** card says **Running**;
   - there are no red alerts.
6. Click **Sources** (top of Operations), add any further job boards, then **Fetch all now**.
7. Open **Jobs Review** and approve a first batch of openings.
8. Back on Operations, switch on **Show Jobs & Internships to students** (it asks you to confirm). We recommend about one week of admin-only use first.

## A3. Environment variables (`server-acc/.env`)

The API and the worker share the same `.env` file. Never put real values in git.

| Variable | Needed? | What for |
|---|---|---|
| `CAREERS_TZ` | optional | Time zone for the schedule (default `Asia/Kolkata`). |
| `LLM_PROVIDER` | optional | AI step for student links: `ollama`, `groq` or `gemini` (default `ollama`). |
| `OLLAMA_URL` | only for ollama | Default `http://localhost:11434`. |
| `CAREERS_LLM_FAST_MODEL` | optional | Model name. Leave empty for the provider's default. |
| `CAREERS_LLM_STRONG_MODEL` | optional | Second, stronger model for unsure results (Gemini only). Leave empty to skip. |
| `GEMINI_API_KEY` / `GROQ_API_KEY` | only for that provider | **Server-side only.** Never a `VITE_*` variable, never in the browser. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | for emails | Job-alert and review-reminder emails need these (existing variables). |
| `CLIENT_URL` | for emails | Used to build the links inside emails (existing). |
| `SECRET_KEY` | yes (existing) | Also used to count weekly visitors without storing who they are. |
| `POSTGRES_DATABASE_URL` | yes (existing) | The worker needs the database too. |
| `DEV_SEED_PASSWORD` | **local only** | For the developers' demo accounts. Not used on the server. |

The AI step is optional. With it off, links that can't be read automatically wait for an admin, under **Student links → Needs attention**.

## A4. Is the worker healthy?

- Run `docker ps`. The `acc-fetcher` container shows **healthy** or **unhealthy**.
  - It turns **unhealthy** when the worker has not written its heartbeat for **5 minutes**.
  - **Unhealthy does not restart anything.** Docker restarts the container only if the process exits (`restart: unless-stopped`). You must act.
- On the **Operations** page, a red alert ("The worker has not reported for N minutes…") appears after **20 minutes** without a heartbeat.
- **What to do:**
  1. `docker logs --tail 200 acc-fetcher`: look for `[careers]` lines and errors.
  2. `docker compose restart fetcher-acc`
  3. If it says it can't reach the database, check Postgres first.
  4. Check by hand: `docker compose exec fetcher-acc node scripts/careers/workerHealth.js`. Exit code 0 means healthy.

## A5. Switches (Operations page, switches card)

| Switch | Default | Effect |
|---|---|---|
| **Show Jobs & Internships to students** | off | The master switch. Off means students see nothing new. |
| **Fetch job boards** | on | Off pauses scheduled fetches and "Fetch now". |
| **Automatic extraction for student links** | off | The AI step for links that aren't job-board links. |
| **Gemini key is billed** | off | Turns on the monthly budget limit for a paid Gemini key. |
| **Email job alerts to students** | off | Daily or weekly digests for students who saved an alert. |
| **Remind career admins by email** | off | Daily email to CAREER_ADMIN users when the queue has waited over 24 h. |

There are also number limits, saved with **Save limits**:
- monthly LLM budget;
- cloud AI calls per day;
- "Flag below confidence";
- company-name match threshold;
- links per student per day.

Changes take effect within about **30 seconds** (settings are cached). The AI step can take about **1.5 minutes** to notice a change.

## A6. Operations alerts: what they mean and what to do

| Alert says | Means | Do this |
|---|---|---|
| The worker has not reported for N minutes / has never reported | Worker stopped or stuck | See A4. |
| *Board* is failing: … | That job board returned an error | Open **Sources**, check the board. Test the token with `verifyBoard.js` (A7). Archive the board if it is gone. |
| *Board* returned 0 jobs on its last run | Board is empty or moved | Check the company's careers page; fix or archive the board. |
| LLM extraction is on but … is not usable | AI provider down or key wrong | Fix the key or provider in `.env` and restart, or switch the AI step off. |
| The monthly LLM budget is used up / N% used | Paid key near or at its cap | Raise the budget, or wait for next month. |
| N postings are waiting in Flagged | Review backlog | Admins: **Jobs Review → Flagged**. |
| N student link(s) failed to process | Links that need a retry or a decision | Admins: **Jobs Review → Student links → Needs attention**. |
| N student link(s) have waited more than 48 hours | Links nobody has handled | Same place: create a posting or dismiss. |
| N live posting(s) were reported by several students | Students flagged a problem | Admins: **All postings**, check, then **Mark as handled**. |
| N job alert(s) could not be emailed | Mail failing | Check `SMTP_*` and `CLIENT_URL`, then the API log. |
| N posting(s) have waited more than 48 hours for review | Queue not reviewed | Admins: do the daily review (B2). |
| The review reminder email was not sent on … | Reminder mail failed | Check SMTP settings. |

## A7. Command-line tools

Run in `server-acc/`, or with `docker compose exec fetcher-acc …`:

| Command | Use |
|---|---|
| `npm run careers:job -- ingest` / `ingest <sourceId>` | Fetch all boards, or one, now. Prints a table per board. |
| `npm run careers:job -- links` | Process waiting student links now. |
| `npm run careers:job -- liveness` / `alerts` / `reminder` | Run that job once. |
| `npm run careers:job -- cleanup` | **Lists** test data (dry run). `cleanup --yes` deletes it. Refuses to run when `NODE_ENV=production`. |
| `node scripts/careers/verifyBoard.js <kind> <token>` | Check that a job board token works before adding it. `kind` = greenhouse, lever, ashby, smartrecruiters, workable. |
| `node scripts/careers/scanBoards.js` | Scan the candidate board list (read-only). Prints lines to paste into **Add boards in bulk**. |
| `npm run careers:seed` | Insert missing defaults. Safe to repeat. |
| `node scripts/careers/workerHealth.js` | Health check. Exit code 0 means OK. |

## A8. Turning it off or rolling back

None of this needs a redeploy:

1. **Hide it from students:** Operations → switch off **Show Jobs & Internships to students**.
2. **Stop all background work** (fetching, emails): `docker compose stop fetcher-acc`.
3. **Remove the code:** the migrations only added tables and columns, so they can stay. The older code simply ignores them.

## A9. After every pull or upgrade

1. `npx prisma migrate status`. If it lists pending migrations, run `npx prisma migrate deploy`.
   - A database behind the code shows up as errors like *"column … does not exist"*.
2. Restart both: `docker compose up -d --build backend-acc fetcher-acc`.
3. **Never** use `prisma db push` or `prisma migrate reset` on the server.

## A10. Before you ship a UI change: the 10-minute browser check

Automated tests don't catch layout bugs. Before merging any change to these pages, open them in a browser at **desktop width and at phone width (375 px)**. For every dropdown, menu and dialog you touched:

- [ ] Open it near the **bottom** and near the **right edge** of the window. Is it fully visible, not cut off, and not drawn under the next card or a sticky bar?
- [ ] It closes on a **click outside**, on **Escape**, and when you **Tab** away.
- [ ] With a dialog opened from another dialog, **one Escape closes only the top one**.
- [ ] At 375 px nothing scrolls sideways, and long names and links are cut with "…" rather than overflowing.
- [ ] Scroll the page while it's open: it follows its field, or closes once the field is hidden.
- [ ] **Look at the page yourself.** A quick script saying "visible" once missed a menu half-covered by the next card.

Testing safety:
- Use throwaway test data and remove it afterwards (`cleanup` in A7 helps).
- **Never click Publish Post on a test Career Vault experience.** The existing portal emails *every user* when an experience is published.

---

# Part B: for ACC career admins

## B1. Who can use it, and where

- Roles: **CAREER_ADMIN**, **SUPER_ADMIN** and **FACULTY** can use the admin pages. Everyone else gets "Access Denied".
- Sidebar entries:
  - **Jobs Review**: the number shows what's waiting;
  - **Companies**;
  - **Sources & Ops**: opens the Operations page.
- Reached from inside those pages:
  - **All postings** and **Add posting** (top of Jobs review);
  - **Sources** and **Activity log** (top of Operations);
  - **Link experiences** (top of Companies).

## B2. Your daily routine (about 10 minutes)

1. **Sources & Ops → Operations:** read the alerts at the top. Amber means "do something soon"; red means "something is broken" (tell the technical maintainers).
2. **Jobs Review**, tab by tab:
   1. **Pending**: new openings to approve or reject.
   2. **Flagged**: openings the system is unsure about (low confidence, unknown company). Check the marked fields first.
   3. **Candidate companies**: new company names that need a decision (see B6).
   4. **Student links → Needs attention**: links that failed or can't be read automatically (see B5).
3. Done. Students only see what you approved, so a daily look keeps the list fresh.

## B3. Reviewing an opening

1. Click an opening in **Pending** or **Flagged**. The editor opens:
   - **left:** the original text from the source;
   - **right:** the fields students will see.
2. Fields marked **Check** were unsure. Compare them with the source text and correct them.
   - Pay or eligibility that the source doesn't state stays "Undisclosed" or "Eligibility not stated". Never guess.
3. Choose one:
   - **Approve & publish**: students can see it.
   - **Save**: keep your edits, decide later.
   - **Reject**: pick a reason. Rejected openings never reach students and can be reopened from All postings.
4. **Escape** or the ✕ closes the editor.

Many at once: tick openings (or **Select page**) → **Approve N selected postings**, **Reject…** or **Mark expired**. A bulk approve can be undone for 30 seconds from the message that appears.

## B4. Fixing an opening that is already live (All postings)

- **Take down**: hides it from students. Use when it's closed, wrong or a duplicate. It can be reopened.
- **Reopen**: brings a taken-down or rejected opening back to review.
- **Merge into…**: two entries for the same job. Students' saves and statuses move to the one you keep.
- **Delete permanently…**: **only for spam or test data.**
  - You must take it down first and type its number to confirm.
  - An audit line is kept in the Activity log.
  - If the job board still lists it, the next fetch brings it back for review, so reject it instead.
- **Reports from students**: on the opening, read the reports, fix or take down, then **Mark as handled**.

**When unsure, take down rather than delete.**

## B5. Links shared by students (Jobs Review → Student links)

**Filters:**
- **Needs attention**: your to-do list, and the number on the tab.
- **In progress**: still being read automatically; nothing to do.
- **Done**: an opening was made, it was already listed, or it was dismissed or withdrawn.
- **All**

**Badges on each link:** **Failed**, **Needs a person**, **Processing**, **Posting made**, **Already listed**.

**Actions:**
- **Retry** (failed links): tries again on the next run, within 10 minutes.
- **Create posting from this link**: opens **Add a posting** with the link filled in. **Fill from link** can fill the form for you. Save it, and the student sees it once it's live.
- **Dismiss**: choose a reason, e.g. "Not a job page". **The student sees this reason**, so keep it polite.

## B6. Companies

Every opening and Career Vault experience points to one company record, so "Google India", "Google LLC" and "google" are the same company.

- **Candidates:** new names found in openings, listed under **Jobs Review → Candidate companies** (also the **Candidates** tab on Companies).
  - **Approve** if it's a real employer.
  - **Reject…** if it's noise, such as a job website's name. Rejected candidates are hidden, not deleted; see **Show rejected → Restore**.
- **Merge into…:** two records for one company. **Split…** undoes a wrong grouping. Every merge and split can be undone under **History → Undo**.
- **Aliases:** other spellings that should point to this company. Use **Add an alias**.
- **Move back to candidates…:** takes a company out of the approved list (students stop seeing it).
  - The dialog tells you if live openings, job boards or linked experiences still use it.
  - If they do, merge it into the right company instead.
- **Link experiences:** connect older Career Vault experiences to companies. Nothing changes until you click **Link N selected**.
- **Company on a Career Vault experience:** sidebar **Career Vault** → Edit an experience → **Company** field.
  - It shows the student's choice; you can change or clear it.
  - Only approved companies can be picked. Add a new one under **Companies → Add company** first.

## B7. Job boards (Sources & Ops → Sources)

- **Add board**: pick the board type, enter its token (from the company's careers page address) and the company. It is checked before it's saved.
- **Add boards in bulk**: one board per line, as `kind token Company name`. For example:

  ```
  # boards from the placement cell
  greenhouse stripe Stripe
  lever paytm Paytm
  ```

  - Up to 30 boards at a time.
  - `#` starts a comment.
  - Each line gets its own result: added, already there (it says if the board is archived), or failed with the reason.
- **Edit** a board:
  - **Drop titles containing** / **Only keep titles containing** words, to cut noise from big boards;
  - **Archive board** when the company stops using it (**Show archived → Restore** brings it back).
- **Fetch now** (one board) / **Fetch all now**: fetch immediately instead of waiting for the schedule. This needs the worker running.
- **Runs**: the history of each board's fetches.

## B8. Switches career admins look after

On the Operations page (see A5 for the full list):

- **Show Jobs & Internships to students**: switch on only after the first review round. Switch off at any time to hide the feature.
- **Email job alerts to students** and **Remind career admins by email**: only once email works (ask the maintainers).
- **Links per student per day** (a number limit): raise it if students hit the limit with real openings.

## B9. Activity log

Operations → **Activity log** shows who approved, rejected, edited, merged or deleted what, and when. Filter by admin or by action. It is read-only.

## B10. Good habits

- Review **daily**. A queue that sits for 2 days triggers alerts, and students see stale lists.
- Reject with a clear reason. Dismiss student links with a reason they will understand.
- **Never publish a test Career Vault experience** (it emails everyone).
- Don't approve an opening whose company is still a candidate. Decide the company first.
- Prefer **Take down** over **Delete permanently**.
- If something looks broken (red alert, pages not loading), tell the technical maintainers. Don't work around it.

---

## Quick reference: pages

| Page | Address |
|---|---|
| Jobs review | `/admin/careers/review` |
| All postings | `/admin/careers/postings` |
| Add a posting | `/admin/careers/new` |
| Companies | `/admin/careers/companies` |
| Link experiences | `/admin/careers/backfill` |
| Sources | `/admin/careers/sources` |
| Operations | `/admin/careers/ops` |
| Activity log | `/admin/careers/activity` |
| Students: Jobs & Internships | `/dashboard/career-vault/jobs` |
| Students: Companies / Saved | `/dashboard/career-vault/companies`, `/dashboard/career-vault/saved` |
