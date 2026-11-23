# Email notifications

## Profile preferences

**My Profile → Settings → Email notifications** contains four independent switches, enabled by default. Changes save immediately. Preferences live in `UserNotificationSettings`, keyed by `userId` with cascading account deletion. Only the relation is added to `User`; the four booleans are in their own table.

`GET /api/v1/profile/notification-settings` returns the four effective booleans. Missing rows return all-enabled defaults without inserting anything. `PATCH` accepts only a nonempty subset of boolean fields and upserts that account's row; concurrent partial updates preserve unrelated preferences. Authentication supplies the user ID, never the request body.

| Field | Emails controlled |
|---|---|
| `resourcesEnabled` | Existing resource-update emails. Existing course targeting and publisher `notifyUsers` behaviour remain in effect. |
| `careerVaultExperiencesEnabled` | Existing Career Vault experience-publication emails. |
| `jobsInternshipsEnabled` | New job-opening publication announcements and any existing saved-search digests. |
| `announcementsEnabled` | Stored preference only; announcement emails are not implemented yet. |

OTP/security, exam reminders, comments/replies and operational admin notifications are separate. Opting out of jobs does not delete saved searches or change their individual unsubscribe state. While opted out, a due digest's window advances without sending, so reenabling does not accumulate digests from the disabled period.

Mail senders filter recipients and check the current preference again just before sending. A missing row means enabled; a database failure defers/fails the send instead of treating unreadable preferences as enabled. Disabling notifications stops remaining queued messages; already delivered messages cannot be recalled. Completed/skipped publication deliveries are not replayed on reenabling.

## New job-opening emails

The job announcement template is `server-acc/templates/jobPublishedTemplate.js`. It follows the existing Career Vault email styling and contains a short publication notice, the opening's title and a **View Opening** link to `${CLIENT_URL}/dashboard/career-vault/jobs/:id`. It contains neither publisher identity nor the job description. HTML values are escaped and there is a plain-text version.

Individual approval, bulk approval and manually creating an immediately published opening enqueue one `JobPublicationNotification` in the same transaction as publication. Failed transactions do not queue mail. Only newly published openings while Jobs & Internships is visible to students create announcements. No existing live openings are backfilled. Edits, reopening and republishing do not create a second event for the same posting.

The existing worker checks the queue every ten seconds under a PostgreSQL advisory job lock. It builds the audience in pages of 100, selecting all registered accounts that existed when the opening was published, with valid email addresses and the jobs preference enabled. Roles/eligibility do not restrict this broadcast. Opted-out and invalid-address records are marked skipped. Accounts registered afterward do not receive historical announcements.

`JobPublicationDelivery` is unique per posting/user. Each batch claims at most 25 deliveries, spaces SMTP attempts by at least 300 ms and stops starting more work after a 30-second budget. Pending audiences/retries remain for the next tick. Actual delivery also checks the latest preference and that the opening remains live at an active company. Taking an opening offline cancels unsent messages; hiding the entire Jobs & Internships feature pauses the queue.

Confirmed successes are not resent. Transient failures retry after 1 minute, then 5 minutes, with three total attempts. Permanent SMTP rejection/authentication failures stop retrying. Claims expire after 15 minutes for restart recovery. A process crash or DB failure after SMTP acceptance can leave an uncertain outcome; recovery prioritises delivery and may duplicate that message. Stable database keys suppress ordinary reruns, but SMTP and a database commit cannot form one atomic operation.

The worker logs `[careers] Publication emails` sent/failed/skipped/claimed counts. Queue states are in `JobPublicationNotification` (`PENDING`, `COMPLETE`, `CANCELLED`) and delivery states in `JobPublicationDelivery` (`PENDING`, `SENDING`, `SENT`, `FAILED`, `SKIPPED_OPT_OUT`, `SKIPPED_INVALID_EMAIL`, `CANCELLED`). No admin UI or new email provider is introduced.

## Deployment

Use the existing `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` and `CLIENT_URL`. There are **no new environment variables**. The existing student-visibility setting still gates job announcements; saved-search digests also retain their existing separate feature switch.

Apply `20261123000000_notification_settings_and_publication_mail` before starting the updated API/worker. It only adds the settings and queue tables, indexes and cascading foreign keys. No preference backfill is needed. The Docker deployment workflow now pulls the new images, runs `prisma migrate deploy` with a one-off `backend-acc` service container, and then starts the new application containers. It assumes the production Compose backend service is named `backend-acc`, as in the repository definition. Keep the database running for the one-off migration.

After deployment, check migration status, open My Profile, change a preference and reload to confirm persistence. For publication testing, use a staging/disposable database and non-delivering mail transport. Publishing a real opening in production starts a broadcast to opted-in registered users automatically.

## Tests

From `server-acc`, run `npm test -- tests/notifications` and `npm test`. From `client-acc`, run the production build and lint the changed profile/settings files. Unit tests cover defaults, account isolation, strict validation, sender opt-outs and the template.

The optional PostgreSQL suite uses two real connections for concurrent updates plus actual publication services and the dispatcher. It covers all publication paths, rollback, duplicate suppression, queued opt-outs, retries, restart recovery, hidden/offline openings, cascade deletion and digest integration. It requires `NOTIFICATIONS_TEST_DATABASE_URL` pointing to a **disposable localhost database named `notifications_test`**, with the schema/migration applied. The suite resets test tables and refuses other database names/hosts. Run `npm test -- tests/notifications/postgres.integration.test.js`; otherwise those tests are skipped.

The migration and all 20 PostgreSQL tests were verified against an isolated PostgreSQL 16 container during implementation, with SMTP mocked and no production data accessed.
