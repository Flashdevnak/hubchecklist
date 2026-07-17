# Project Specification

## RESET-010 Production Sync, Scanner, Dedupe, Watermark

RESET-010 hardens the existing RESET-009A app without changing the free central backend choice.

- Google Sheets / Apps Script remains the central source of truth for master data and synced records.
- App startup and manual refresh pull both bootstrap data and central `Records_All`, then merge with local pending work.
- Local records are deduped by `date + hubCode + responsibleEmployeeCode + vehicleBarcode` unless `forceCreateNew` is explicitly used with a reason.
- Record preference for duplicate keys favors synced/complete records over stale drafts, preventing ghost pending cards after a successful submit.
- Frontline remains local-first for capture safety, but submit awaits Apps Script sync when configured and only marks `SYNCED` after central success.
- Retry sync updates local record status after success.
- The scanner route hides the normal app header/nav and presents a full-screen dark scan surface.
- Photo watermark includes `สถานที่` with a no-address fallback. The app does not fake reverse-geocoded addresses.
- Backoffice Settings exposes safe central diagnostics, pull-latest, retry pending sync, and cache clear tools. Cache clear blocks while pending/failed sync exists and never deletes central data.

## RESET-009A Admin Settings Save To Google Sheets

RESET-009A is complete as a code/build implementation. It does not claim live Google Sheet mutation QA until the updated Apps Script is deployed and manually tested.

- Backoffice Hubs saves centrally through Apps Script actions `upsertHub`, `deactivateHub`, and `getHubs`.
- The `Hubs` sheet schema is `hubCode | hubName | active | note`.
- Hub add/edit updates the row by `hubCode`; deactivate is a soft delete that sets `active = FALSE`.
- Backoffice Responsible Staff saves centrally through Apps Script actions `upsertResponsibleStaff`, `deactivateResponsibleStaff`, and `getResponsibleStaff`.
- The `ResponsibleStaff` sheet schema is `employeeCode | employeeName | hubCode | active | note`.
- Responsible staff add/edit updates by exact `employeeCode + hubCode`; deactivate is a soft delete that sets `active = FALSE`.
- Bootstrap returns active hubs and active responsible staff only, so Frontline dropdowns refresh after central saves and remain filtered by exact selected `hubCode`.
- Backoffice Settings saves safe settings through `updateSetting` and reads through `getSettings`.
- UI-editable settings are limited to `GPS_REQUIRED` / `GPS_MANDATORY`, `WATERMARK_ENABLED`, `REQUIRE_ADMIN_DEVICE_APPROVAL`, and `MINIMUM_APP_VERSION`.
- `ADMIN_PIN_HASH`, `ADMIN_SETUP_TOKEN`, and `APP_SHARED_SECRET` are not exposed as editable app settings.
- Admin mutations write Audit actions `hub_upsert`, `hub_deactivate`, `responsible_upsert`, `responsible_deactivate`, and `setting_update` with actor, message/detail JSON, and Bangkok `createdAt`.
- The UI shows `บันทึกลงระบบกลางแล้ว` only after Apps Script success and `บันทึกไม่สำเร็จ กรุณาลองใหม่` on failure.
- Admin master-data saves are central-only; if the central backend is unavailable, the app shows `ต้องเชื่อมต่อระบบกลางก่อนจึงจะบันทึกได้` and does not write local-only master data.
- Frontline remains local-first only for work records/photos/pending sync. It can capture quickly, queue sync, and continue work without waiting for Drive upload.
- Frontline active work hides completed/synced rows by default. Sent work remains available under today history and is never deleted from central Sheets by clearing the active view.
- Backoffice `ประวัติ` shows all local records and filters by date range, hub, responsible person, barcode, and status; filtered history can be exported.
- Apps Script supports safe history/action aliases: `updateSettingsBatch`, `getPhotos`, `getHistory`, and `getRecordsByDateRange`.
- RESET-009A includes UI polish for safe-area bottom navigation, sticky submit spacing, compact Backoffice menu behavior, focus states, card hierarchy, and mobile/tablet/desktop balance.

## RESET-009 Final Production Polish

RESET-009 is complete as an implementation/build polish pass. It does not claim physical device QA, Vercel deployment, or live Apps Script production verification.

- Frontline remains the default and uses short Thai operational labels.
- Backoffice remains protected by central Admin PIN.
- The scan view opens full-screen, hides bottom navigation, starts the camera automatically where supported, and keeps manual barcode entry.
- Same date/hub/responsible/barcode scans detect existing work and default to continuing photo capture.
- My Work lists today’s active responsible-person work so missing trailer/drop photos can be continued.
- Photo slot labels are clean Thai labels without `old mixed watermark wording`.
- Watermarked photos draw text directly on the photo with subtle shadow/stroke only. No black strip or large dark background panel is used.
- Google Sheets record rows stay on the simplified 15-column layout. Apps Script writes submitted/captured timestamps as Bangkok `yyyy-MM-dd HH:mm:ss` strings.
- Export ZIP continues to use watermarked photos and the simplified workbook.
- Apps Script `doGet` returns safe health JSON for `/exec`.
- Apps Script `initOrRepairStorage` creates required sheets and appends missing headers without deleting old data.
- `Records_All` remains the source of truth. Its first 15 columns are the simplified user-facing report; internal columns to the right support record id, duplicate key, internal status, sync, and audit-safe retry.
- Duplicate key is `วันที่ + hubCode + responsibleEmployeeCode + vehicleBarcode`. Online scans call `findRecordByKey`; sync writes update by `recordId` or duplicate key.

## RESET-008A Simple Admin PIN Login

Backoffice access is simplified for production usability:

- Admin login asks only for one central Admin PIN.
- Apps Script verifies the PIN server-side.
- AdminDevices approval is disabled by default and remains optional advanced security.
- Backoffice Settings can change the central PIN through Apps Script.
- Frontline remains employee-only and does not show backend URL/token/admin settings.

## RESET-008 Final Production Deployment Fix

RESET-008 keeps one app with two delivery paths:

- Android APK for staff Android phones/tablets.
- Vercel Web/PWA for iPhone, iPad, and desktop.

Google Apps Script `/exec` is backend API only. It now returns a clear `doGet` health response and should not be used as the employee app URL.

Vercel deployment uses `npm run build`, output `dist`, and environment variables `VITE_APPS_SCRIPT_WEB_APP_URL` and `VITE_APP_CLIENT_MODE=central`.

Backoffice stays centrally protected by AdminDevices and central Admin PIN. Employees do not configure backend URL/token or approve devices.

## RESET-006-007-FINAL-PLUS Central Backend and Flow Hardening

Status: implemented in code and ready for build verification.

The app remains one APK and one Web/PWA. Google Sheets + Apps Script is the central free backend. Firebase, Supabase, R2, and paid storage are not used for this reset.

Central configuration:

- `VITE_APPS_SCRIPT_WEB_APP_URL` is the build-time central backend URL.
- `VITE_APP_CLIENT_MODE=central` documents central mode.
- Frontline never shows backend URL/token fields.
- Bootstrap fetches central settings, hubs, responsible staff, admin auth status, and minimum version, then caches for offline use.

Central Backoffice authorization:

- Backoffice requires an approved AdminDevices row and a valid central Admin PIN.
- Unapproved devices can request approval and copy Device ID.
- Employees cannot approve themselves.

Flow/UI hardening:

- Frontline opens by default and uses only Today, Scan, Photo, and My Work.
- Scan view is full-screen oriented with a large live camera area.
- Trailer-drop requires rear main vehicle photo plus trailer rear photos.
- Missing required photos can only submit as NEED_REVIEW after a clear warning.
- Watermark uses accurate Bangkok capture date/time and a larger rounded overlay.

## RESET-005B Employee Device Admin PIN Protection

RESET-005B changes first PIN setup so employees cannot create their own Backoffice PIN on a fresh install.

Rules:

- Frontline opens by default.
- Normal Backoffice entry never creates the first PIN.
- If no local Admin PIN exists, the normal Backoffice entry shows `ยังไม่ได้ตั้งค่า PIN หลังบ้าน กรุณาติดต่อผู้ดูแล`.
- Hidden setup requires `VITE_ADMIN_SETUP_TOKEN`.
- Backoffice Settings can lock the current device into Employee Device Mode.
- Employee Device Mode hides the normal Backoffice entry and keeps the phone Frontline-only.
- Existing admin devices with a local PIN can still unlock Backoffice offline.

Google Apps Script reserves central settings keys:

- `ADMIN_PIN_ENABLED`
- `ADMIN_PIN_HASH`

Central PIN verification is reserved for later hardening. RESET-005B enforces the local MVP protection path and documents that it is not enterprise security.

## RESET-005A Export And Watermark Simplification

RESET-005A simplifies user-facing exports while keeping complete metadata internally.

Excel export uses 15 columns:

1. วันที่
2. ฮับ
3. ผู้รับผิดชอบ
4. บาร์โค้ดรถ
5. พ่วงดรอปหรือไม่
6. จำนวนดรอป
7. สถานะ
8. รูปหลังรถ
9. รูปหน้าดรอป
10. รูปหลังรถพ่วงที่ 1
11. รูปหลังรถพ่วงที่ 2
12. รูปหลังรถพ่วงเพิ่มเติม
13. รายการรูปที่ขาด
14. เวลาส่งข้อมูล
15. หมายเหตุ

Responsible is shown as one value, such as `25845 TUI`.

Photo evidence:

- Timestamp and GPS are rendered directly on each watermarked photo.
- GPS denied/unavailable is shown as a warning, never fake coordinates.
- `manifest.json` still stores full metadata for each photo.

Google Sheets:

- `Records_All` is the master sheet and source of truth.
- Hub-specific sheets are created/updated automatically as views/copies.
- Retry sync updates existing rows by record id.

## RESET-005 Final One-System Pass

RESET-005 keeps one codebase, one Android APK, and one Web/PWA. Android users install the APK; iPhone/iPad users use the HTTPS Web/PWA link; desktop/admin users use a web browser.

Protected modes:

- หน้างาน is the default launch mode.
- Backoffice requires a local device Admin PIN.
- First Backoffice entry creates the PIN when none exists.
- Admin can lock Backoffice and change the PIN in Settings.
- This is local device PIN protection only, not enterprise identity/security.

Frontline remains simple:

- Hub selection
- Responsible staff selection filtered by hub
- QR/barcode scan or manual input
- Locked current date
- Drop condition
- Photo capture with timestamp/GPS metadata
- Submit local-first with optional Google sync

Backoffice contains dashboard, hubs, responsible staff, records, photos, export, backup, Google Sheets Sync settings, settings, and audit. Google Apps Script URL/token are never shown in Frontline.

PWA/icon support:

- `public/manifest.webmanifest`
- PWA icons under `public/icons/`
- Android launcher icons under `android/app/src/main/res/mipmap-*`
- Source icon at `src/assets/app-icon.svg`

Responsive rules are hardened for Android phones/tablets, iPhone/iPad Safari, and desktop browser.

## RESET-004 Free Central Storage

RESET-004 adds optional free central storage using Google Sheets, Google Apps Script, and Google Drive. It does not add Firebase, Supabase, R2, or paid storage.

Behavior:

- Default mode remains `Local only`.
- หลังบ้าน Settings stores the Google Apps Script Web App URL and `APP_SHARED_SECRET` locally.
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

หลังบ้าน:

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

## RESET-011 Full Rebuild Status

Status: complete in code, pending live deployment and physical device QA.

RESET-011 rebuilds Hub Photo Proof as a central-first app using Google Sheets, Apps Script, and Google Drive as the free source of truth. Local storage is only a temporary capture/cache layer for offline work, pending sync, and display preferences.

Core product flow:

- Staff selects hub and responsible staff from central bootstrap data.
- Staff scans or manually enters vehicle barcode.
- Staff selects drop type and captures required photos.
- Photos receive a clean watermark with date, time, GPS/location fallback, barcode, hub, responsible staff, and photo type.
- Submission writes to Apps Script and shows `ซิงก์แล้ว` only after central success.
- Offline or failed submissions remain `รอซิงก์` or `ซิงก์ไม่สำเร็จ`.
- Every device can pull the same central records after refresh once the Apps Script deployment is live.

Duplicate model:

- `duplicateKey = date + hubCode + responsibleEmployeeCode + vehicleBarcode`.
- Local UI and central sync both prefer one main record per duplicate key.
- Status priority favors synced/complete records over stale drafts.
- Stale drafts are hidden from active `งานของฉัน` when a completed/synced record exists.

Backoffice:

- Admin access uses central Admin PIN verification through Apps Script.
- Hubs, responsible staff, and safe settings are saved centrally only.
- Staff cannot see or edit central secrets.
- `ระบบกลาง` provides health check, pull latest, retry pending sync, and safe cache clear.

Apps Script:

- Required sheets: `Hubs`, `ResponsibleStaff`, `Records_All`, `Photos`, `Settings`, and `Audit`.
- Required actions are present for health, bootstrap, hub/staff/settings management, admin PIN status/verification, record upsert, batch sync, history, photos, and audit.
- Responses use `{ ok, message, data }`.
- Readable times use Bangkok format `yyyy-MM-dd HH:mm:ss`.

Still manual:

- Deploy updated Apps Script as a Web App.
- Configure `VITE_APPS_SCRIPT_WEB_APP_URL` for production web/APK builds.
- Run real two-device sync test.
- Run Samsung S23 FE, Galaxy Tab A7 Lite, iPad browser fallback, and desktop browser QA.
- Confirm real camera scanning and photo capture on physical devices.
