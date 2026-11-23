# My Profile

Signed-in users open **My Profile** from the navbar account menu or mobile navigation. The page at `/profile` shows the user's name, optional photo, roll number, email, branch, and the same course list as **My Courses**. Only name and photo are editable. Accounts without academic metadata have an empty course list.

The existing `User.photoURL` database column stores the permanent MinIO **object path**, for example `profile-photos/7/<timestamp>-<uuid>.png`. It is deliberately not renamed and needs no migration. API responses resolve that stored value to a one-hour signed viewing URL. Existing HTTP/HTTPS photo values remain readable; new writes must use an owned uploaded object path. Signing failures fall back to the initial avatar instead of breaking unrelated profile fields or author responses.

Uploads use the existing bucket, credentials, public `/media` proxy and signed PUT/GET utilities. No new environment variables are required. Supported photos are JPEG, PNG and WebP, up to 5 MB. SVG and GIF are not accepted. The server checks ownership, actual object size, MIME type, extension and image signature before updating the user. Replaced/removed owned objects are cleaned up after a successful database update; cleanup errors are logged without reverting the saved profile.

## API

All routes require the existing cookie authentication.

| Route | Behaviour |
|---|---|
| `GET /api/v1/getuser/me` | Explicit safe profile fields, with resolved `photoURL`; no password/private academic fields. |
| `POST /api/v1/profile/photo/upload-url` | Body `{ contentType, size }`; returns `{ success, signedUrl, filePath }`. Upload the file with PUT to `signedUrl`. |
| `PATCH /api/v1/profile` | Body may contain only `displayName` and `photoURL`. The latter is the uploaded `filePath`, not the signed URL. Omit it to keep the photo; use `null` to remove it. |
| `GET /api/v1/users/:id/photo` | Returns a fresh `{ success, data: { photoURL } }` for the owner, `SUPER_ADMIN`, or `FACULTY`. Used when opening the photo viewer. |

Names are trimmed and must contain 1–100 characters. Updates always target the authenticated user's ID. Existing initial roll verification remains available through `POST /api/v1/profile` only when the account has no assigned roll; the conditional database update prevents reassignment races.

The existing `photoURL` field in authentication, Manage Users and nested author responses remains a usable viewing URL. Shared response helpers resolve nested author/reply fields without changing separate faculty `photoUrl` fields, dates, or Prisma decimals.

## Email notification settings

The profile's **Settings → Email notifications** card contains four switches: resources, Career Vault experiences, jobs/internships and announcements. All default to enabled. Each change saves automatically and is independent of unsaved name/photo edits. Failed saves restore the previous switch value.

Preferences live in the separate one-to-one `UserNotificationSettings` table. A missing row means all enabled; the first update creates a row. Existing/new users need no backfill or signup change. Accounts can read/update only their own settings through `GET`/`PATCH /api/v1/profile/notification-settings`. PATCH accepts a nonempty subset of `resourcesEnabled`, `careerVaultExperiencesEnabled`, `jobsInternshipsEnabled`, and `announcementsEnabled`, with boolean values only.

Resources keep their existing course targeting and publisher notification checkbox. Career Vault preferences affect new experience-publication emails. Jobs/internships preferences affect opening-publication announcements and existing saved-search digests; individual saved-search unsubscribe settings still apply. Announcement preferences are saved for future use; no announcement email integration is added. Security/OTP, exam reminders, comment/reply and operational admin emails are unaffected.

See [notification operations](notifications.md) for queue behaviour and deployment. Unlike the initial name/photo feature, these settings and the job-email queue require an additive database migration.

## Verification

Run `npm test -- tests/profile` and the full server test suite from `server-acc`. From `client-acc`, run `npm run build` and lint the changed profile, avatar, modal, navbar, auth-context and Manage Users files. Backend tests mock storage/database operations; they do not upload to production.

After deployment, check the actual MinIO flow with your own account: update/cancel a name change; add, replace, cancel and remove a photo; confirm navbar updates; verify course links and read-only fields; open desktop/mobile Manage Users photos; close the viewer with Escape, the close button and the backdrop; confirm keyboard focus returns to its trigger. Also verify an account without a photo retains its initial avatar.
