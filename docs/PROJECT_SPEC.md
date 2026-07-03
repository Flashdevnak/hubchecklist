# Project Specification

## MVP-015 UI/UX Polish and Staff/Admin Role Flow

MVP-015 improves the mobile-first operational UI and adds a local staff/admin mode switch. This is a UI-level operating model only: it stores the selected mode locally, does not fake secure login, and can later be replaced by Supabase Auth.

## Verified Locally

- TypeScript passes after UI/role changes.
- Staff/Admin mode is local-first and labeled as not connected to central login.
- Staff navigation hides admin-heavy tools.
- Admin navigation separates dashboard, records, export, backup, settings, and audit-oriented review.
- Responsible profile management is implemented locally.
- Scan, phone preview, Flash, checklist, dashboard, export, and backup/cleanup pages keep existing local-first behavior.

## Staff Mode

- Today / My Work summary for active responsible profile.
- Active responsible profile card.
- Today total records for the responsible person.
- Pending/complete photo counts.
- Large actions for starting scan and continuing pending photos.
- Bottom navigation limited to staff workflow.

## Admin/Supervisor Mode

- Dashboard with summaries, responsible summary, filters, alerts, and record cards.
- Export 21.6 workflow remains available.
- Backup/Cleanup Guard remains available.
- Settings/user pages remain clearly labeled as local/test or not connected to real central login.

## UI Fixes

- Removed generic Placeholder badge from implemented pages.
- Scan page uses one scan-again/reset action.
- Scan result card is compact and uses staff-friendly labels.
- Missing responsible profile warning explains why next is disabled.
- Phone preview has progress steps and advanced OCR collapse.
- Flash manual parser is advanced and does not pretend to be live automation.
- Checklist shows photo progress prominently and keeps audit history available.
- Supabase/R2 status is compact.

## Android WebView Safety Review

- Blocks navigation outside the allowed Flash proof URL.
- Validates Thai phone format before WebView automation.
- Uses timeout and error responses for network/loading/extraction failures.
- PWA/browser fallback remains honest and does not claim cross-site automation.
- Flash live automation is not marked passed until physical Android testing against the real Flash proof page is completed.

## Device QA Required

Debug APK build is complete, but real device validation is still required for the updated UI:

- Samsung S23 FE
- Galaxy Tab A7 Lite
- iPad browser fallback
- Desktop browser

See:

- `docs/ANDROID_DEVICE_TEST.md`
- `docs/FLOW_QA_CHECKLIST.md`
- `docs/DEPLOYMENT_NOTES.md`
- `docs/APK_BUILD_RESULT.md`
- `docs/REAL_DEVICE_TEST_RESULT.md`

## Safety Constraints

- No Firebase.
- No paid cloud requirement.
- No R2 secrets in frontend.
- No fake Supabase sync success.
- No fake R2 upload/delete success.
- No fake Flash extraction success.
- No business record hard delete.
- Cleanup only removes confirmed backed-up local photo payloads.

## Remaining Production Tasks

- Real Android device QA.
- Physical Android Flash WebView test against the real Flash proof page.
- Secure Supabase Auth replacing local role mode.
- Android release signing.
- App store build/release process.
- Production R2 signed upload backend.
- Production R2 delete backend.
- Production Supabase sync hardening.
- Storage billing automation or real cloud usage reporting.
