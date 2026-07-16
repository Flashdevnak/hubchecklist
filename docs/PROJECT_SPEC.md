# Project Specification

## RESET-004 Free Central Storage

RESET-004 adds optional free central storage using Google Sheets, Google Apps Script, and Google Drive. It does not add Firebase, Supabase, R2, or paid storage.

Behavior:

- Default mode remains `Local only`.
- Admin Backoffice Settings stores the Google Apps Script Web App URL and `APP_SHARED_SECRET` locally.
- Test connection calls Apps Script `healthCheck`.
- Frontline submits local records first, then attempts Google sync.
- Failed sync does not block staff. The app queues the payload locally and shows `บันทึกในเครื่องแล้ว รอซิงก์`.
- Retry sync is available from Backoffice Settings.
- Apps Script validates the shared secret before any action.
- Google Sheets stores records, photo metadata, hubs, responsible staff, and audit.
- Google Drive receives base64 photo uploads when Apps Script request/runtime limits allow it.

Apps Script files:

- `google-apps-script/Code.gs`
- `google-apps-script/README.md`
- `google-apps-script/SHEET_SCHEMA.md`

Live Google deployment and real device sync testing remain manual QA steps.

## RESET-003 Simple Hub Barcode Photo Proof App

RESET-003 replaces the visible app workflow with a simple local-first photo proof system in one APK.

Frontline:

- Select hub.
- Select responsible staff filtered by hub.
- Scan Barcode/QR or use manual vehicle barcode input.
- Date is locked to current device date.
- Choose drop condition.
- Capture required photos.
- Store real timestamp and GPS metadata when available.
- Warn before submitting with missing photos.
- Submit as `COMPLETE` or `NEED_REVIEW`.

Admin Backoffice:

- Manage hubs and responsible staff.
- Review records/photos/timestamp/GPS/missing-photo warnings.
- Export Excel/ZIP with `workbook.xlsx`, `photos/`, and `manifest.json`.
- Manage settings and audit.

No fake GPS, timestamp, photo, export, cloud sync, OCR, or Flash success is added. Frontline does not show OCR proof-paper parsing, Flash technical UI, Supabase/R2 warnings, or debug cards.

## RESET-001 Frontline / Backoffice Unified Table Rebuild

RESET-001 defines the app as one Android app / one APK with two clearly separated modes:

- Frontline collects data only: Today -> full-screen Scan -> Review one unified row -> Photos -> Done.
- Backoffice manages system/data: Dashboard/Records -> Photos -> Export -> Backup -> Settings -> Audit/admin tools.

The operational table is centralized in `src/config/unifiedTableTemplate.ts` and contains the 11 required Chinese/Thai headers. Frontline sees only the fields needed to collect a row. Backoffice can review/edit hidden fields, OCR candidates, raw details, photos, export, backup, and audit.

Important field behavior:

- Column 5 `transferLoadRate` exists in the model/export and is hidden from Frontline.
- Column 9 `plannedDepartureTime` is filled from proof QR/barcode/OCR/Flash parser data where possible and remains editable for correction.
- Column 10 `actualDepartureTime` is read-only in Frontline and captured from the current device time at save; `actualDepartureDateTime` stores the ISO timestamp.
- Photo columns map to branch photo 1, branch photo 2, and outbound after release photo.

OCR is local/lazy-loaded and review-first. It must not fake phone, route, or Flash data. Physical device QA is still pending.

## MVP-017 Simple Staff UI and Auto Scan Fill Flow

MVP-017 is complete as a local-first staff workflow update. The primary path is **Home -> Scan -> Review -> Create -> Photos**. Staff can set `25845 Tui / BNAK` from the Today screen, scan QR/barcodes with the camera where supported, paste/manual-enter Flash proof URLs or vehicle barcodes, optionally run local OCR on a proof-paper image, review editable fields, create a vehicle record, and move directly to checklist photos.

MVP-017 does not claim Flash live automation success, production Supabase Auth, production R2 upload, app-store release, or physical device QA completion.

## MVP-016 Real Camera Scan and Fast Staff Flow

MVP-016 makes the staff scan path real-operation ready. The Scan page opens the device camera, detects QR codes with browser APIs when supported, extracts the vehicle barcode, stops the camera after success, and keeps phone entry on the same screen when the Flash QR does not contain a driver phone.

## Verified Locally

- TypeScript passes after UI/role changes.
- `navigator.mediaDevices.getUserMedia` camera path is implemented.
- BarcodeDetector QR scan loop is implemented when the browser/WebView supports it.
- Android `CAMERA` permission is declared.
- Camera permission errors show a Thai fallback message.
- Driver phone cache is local-first and keyed by vehicle barcode.
- Staff/Admin mode is local-first and labeled as not connected to central login.
- Staff navigation hides admin-heavy tools.
- Admin navigation separates dashboard, records, export, backup, settings, and audit-oriented review.
- Responsible profile management is implemented locally.
- Scan, phone preview, Flash, checklist, dashboard, export, and backup/cleanup pages keep existing local-first behavior.
- MVP-017 TypeScript verification passes for the simplified staff scan/review/create flow.
- MVP-017 parser fixture covers `NAK1RK8Z54`, `0643042911`, `DOLLARSOUND`, `131KM`, and `2h15min`.

## Staff Mode

- Today / My Work summary for active responsible profile.
- Active responsible profile card.
- Today total records for the responsible person.
- Pending/complete photo counts.
- Large actions for starting scan and continuing pending photos.
- Bottom navigation limited to staff workflow.
- Scan page is one screen: profile, camera/manual input, barcode result, phone input, and sticky continue action.
- QR is treated as barcode/proof link only; phone is never faked from QR.
- Cached phone can speed up repeat work but remains editable.

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
- Scanner test-mode warning is removed.
- Camera preview replaces the inactive scanner box after tapping camera.
- Sticky scan action is lifted above bottom nav.
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
- Real camera scan validation on Samsung S23 FE and Galaxy Tab A7 Lite.
- Physical Android Flash WebView test against the real Flash proof page.
- Secure Supabase Auth replacing local role mode.
- Android release signing.
- App store build/release process.
- Production R2 signed upload backend.
- Production R2 delete backend.
- Production Supabase sync hardening.
- Storage billing automation or real cloud usage reporting.
