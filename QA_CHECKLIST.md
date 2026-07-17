# QA Checklist

## RESET-010 Production Sync, Scanner, Dedupe, Watermark

- [x] App startup pulls central bootstrap and central records when Apps Script is reachable
- [x] Manual Frontline refresh pulls central data and records
- [x] Network `online` event refreshes central data
- [x] Local pending work is preserved while central records are merged
- [x] Records are deduped by `date + hubCode + responsibleEmployeeCode + vehicleBarcode`
- [x] Sync success marks local record `SYNCED`; retry success clears stale pending status
- [x] Completed/synced work is not treated as active pending work
- [x] Safe local cache clear blocks when pending/failed sync exists
- [x] Backoffice Settings shows safe central diagnostics without secrets
- [x] Scanner hides normal header and bottom nav in full-screen mode
- [x] Watermark includes `สถานที่` and does not fake address data
- [x] TypeScript passes
- [x] Apps Script syntax check passes
- [ ] Live two-device central sync QA remains manual
- [ ] Physical Android scanner/photo QA remains manual

## RESET-009A Admin Settings Central Save

- [x] Apps Script router supports `upsertHub`, `deactivateHub`, `getHubs`, `upsertResponsibleStaff`, `deactivateResponsibleStaff`, `getResponsibleStaff`, `updateSetting`, `getSettings`, and `getBootstrapData`
- [x] Apps Script router supports `updateSettingsBatch`, `getPhotos`, `getHistory`, and `getRecordsByDateRange`
- [x] `Hubs` uses `hubCode | hubName | active | note`
- [x] Hub add/edit updates by `hubCode`
- [x] Hub deactivate is soft delete only and sets `active = FALSE`
- [x] `ResponsibleStaff` uses `employeeCode | employeeName | hubCode | active | note`
- [x] Responsible staff add/edit updates by exact `employeeCode + hubCode`
- [x] Responsible staff deactivate is soft delete only and sets `active = FALSE`
- [x] Bootstrap/dropdowns consume active hubs and active responsible staff
- [x] Responsible staff remains filtered by exact selected `hubCode`
- [x] Backoffice Settings saves safe settings through Apps Script when central config exists
- [x] Secret/admin keys `ADMIN_PIN_HASH`, `ADMIN_SETUP_TOKEN`, and `APP_SHARED_SECRET` are not exposed as editable settings
- [x] Admin changes write audit actions `hub_upsert`, `hub_deactivate`, `responsible_upsert`, `responsible_deactivate`, and `setting_update`
- [x] UI only shows `บันทึกลงระบบกลางแล้ว` after the Apps Script call succeeds
- [x] UI shows `บันทึกไม่สำเร็จ กรุณาลองใหม่` when the Apps Script call fails
- [x] Admin Hubs/Responsible Staff saves are blocked when central config is unavailable
- [x] Frontline has a manual `รีเฟรชข้อมูล` path for central bootstrap refresh
- [x] Frontline active work hides completed/synced records by default
- [x] Frontline can show `ประวัติวันนี้` / sent work without deleting central records
- [x] Backoffice history filters by date range, hub, responsible, barcode, and status
- [x] Backoffice filtered history can be exported
- [x] UI polish pass improves spacing, safe-area bottom nav, sticky submit, cards, focus states, and mobile admin menu behavior
- [x] TypeScript passes
- [x] Apps Script syntax check passes
- [x] `git diff --check` passes
- [ ] Live Apps Script deployment and real Google Sheet row verification remain manual
- [ ] Physical Android device QA remains manual

## RESET-008A Simple Admin PIN Login

- [x] Admin login modal asks only for Admin PIN by default
- [x] No deviceName, ownerName, Device ID, or request approval button appears in default login
- [x] Apps Script verifies central PIN with `verifyAdminAccess`
- [x] Apps Script can change PIN with `setAdminPin`
- [x] Device approval is optional and disabled by default
- [x] Frontline still hides backend URL/token/settings/export/audit
- [ ] Live Apps Script deployment with real central PIN remains manual

## RESET-008 Final Deployment Checks

- [x] `vercel.json` exists with Vite build, `dist` output, and SPA fallback
- [x] `docs/VERCEL_DEPLOYMENT.md` explains Vercel app URL vs Apps Script API URL
- [x] Apps Script `doGet` health says `/exec` is backend API and POST is for app actions
- [x] Backoffice nav uses Thai production labels
- [x] Frontline staff do not configure backend URL/token
- [x] Android/Web builds use `VITE_APPS_SCRIPT_WEB_APP_URL`
- [x] Mojibake scan passes across src/docs/Apps Script
- [x] RESET-009 watermark has no large dark background box or black strip
- [x] RESET-009 watermark uses clean Thai labels and removes `old mixed watermark wording`
- [x] RESET-009 scan opens as a full-screen camera view with manual barcode fallback
- [x] RESET-009 My Work filters today’s records by active hub/responsible person
- [x] RESET-009 submit saves locally first and leaves sync as background/queued work
- [x] RESET-009 Apps Script formats submitted/captured time in `Asia/Bangkok` as `yyyy-MM-dd HH:mm:ss`
- [x] RESET-009 Apps Script `doGet` returns safe health JSON
- [x] RESET-009 Apps Script `initOrRepairStorage` creates missing sheets and appends missing headers without deleting data
- [x] RESET-009 duplicate key is date + hub + responsible + barcode
- [x] RESET-009 retry/upsert updates existing `Records_All` rows by record id or duplicate key
- [x] RESET-009 Backoffice Settings has storage repair action
- [ ] Vercel deployment itself remains manual and is not claimed complete
- [ ] Physical Android/iPhone/iPad QA remains manual and is not claimed complete

## RESET-006-007-FINAL-PLUS Required Checks

- [x] `doGet` exists so Apps Script `/exec` opens with a health response
- [x] App reads central backend URL from `VITE_APPS_SCRIPT_WEB_APP_URL`
- [x] Missing backend URL shows Thai contact-admin message
- [x] Frontline does not expose backend URL/token fields
- [x] Bootstrap fetches/caches hubs, responsible staff, settings, and admin auth status
- [x] Backoffice requires central approved device and central Admin PIN
- [x] Unapproved devices cannot enter Backoffice and can show/copy Device ID
- [x] AdminDevices sheet/action draft supports request, list, approve, revoke
- [x] Full-screen scan uses large mobile camera viewport
- [x] Trailer-drop requires rear main vehicle photo plus trailer photos
- [x] Missing required photos trigger NEED_REVIEW confirmation
- [x] Watermark uses larger rounded overlay with no black strip
- [x] Bangkok date/time formatting is used for locked date, capture metadata, and watermark
- [x] Mobile scan/photo/admin layouts avoid horizontal overflow
- [ ] Live Apps Script deployment and physical-device Flash flow remain pending

## RESET-005B Required Checks

- [x] Fresh install does not expose normal first-time Admin PIN setup
- [x] If no Admin PIN exists, Backoffice shows contact-admin message
- [x] Hidden setup requires `VITE_ADMIN_SETUP_TOKEN`
- [x] Employee Device Mode hides the normal Backoffice entry
- [x] Backoffice remains available on admin devices with an existing PIN
- [x] Google Apps Script URL and token remain hidden from Frontline
- [x] Apps Script reserves `ADMIN_PIN_ENABLED` and `ADMIN_PIN_HASH` settings keys
- [ ] Central Google Sheets PIN verification is reserved for a later hardening pass

## RESET-005A Required Checks

- [x] Excel export uses simplified 15 columns
- [x] Responsible is exported as one value, for example `25845 TUI`
- [x] Separate Excel photo timestamp/GPS columns are removed
- [x] Photo watermark includes date/time, GPS/permission state, barcode, hub, responsible, and slot label
- [x] กรณีไม่พบ GPS shows a warning and does not fake coordinates
- [x] ZIP photos use the watermarked image data
- [x] `manifest.json` includes full photo metadata
- [x] Apps Script writes to `Records_All`
- [x] Apps Script creates/updates hub-specific sheets
- [x] Apps Script sync retry updates existing rows by record id
- [x] Frontline still hides Google sync settings
- [ ] Live Google Sheets deployment with real Drive upload remains pending

## RESET-005 Required Checks

- [x] One codebase supports Android APK and Web/PWA
- [x] App opens หน้างาน by default
- [x] Backoffice requires local Admin PIN
- [x] First Backoffice entry shows contact-admin lockout when no PIN exists
- [x] First PIN setup is hidden behind admin-only setup token flow
- [x] Backoffice can be locked again
- [x] Admin PIN can be changed in Backoffice Settings
- [x] Google Apps Script URL/token settings are hidden from Frontline
- [x] Frontline bottom nav remains Today / Scan / Photos / My Work
- [x] Responsive CSS hardening prevents fixed desktop layout on phones
- [x] PWA manifest and icons exist
- [x] iPhone/iPad Safari PWA docs exist
- [x] Android launcher icon assets are generated
- [x] Android CAMERA, coarse location, and fine location permissions are declared
- [x] Visible RESET app files have no mojibake byte patterns
- [x] Google Sheets sync remains optional and local-first
- [ ] Physical Android/iPhone/iPad responsive QA is still pending

## RESET-004 Required Checks

- [x] No Firebase, Supabase, R2, or paid storage added for RESET-004
- [x] Google Apps Script files exist in `google-apps-script/`
- [x] Apps Script supports `createRecord`, `uploadPhotoMetadata`, `syncRecord`, `getHubs`, `getResponsibleStaff`, `getRecords`, `appendAudit`, and `healthCheck`
- [x] Apps Script validates `APP_SHARED_SECRET`
- [x] App defaults to local-only mode and builds without Google settings
- [x] Backoffice Settings includes Web App URL, shared secret, sync mode, Test connection, queue status, and Retry sync
- [x] Frontline submit saves locally first
- [x] Failed Google sync queues pending payload and shows `บันทึกในเครื่องแล้ว รอซิงก์`
- [x] Base64 photo upload to Google Drive is implemented as best-effort
- [ ] Live Google Sheet deployment and real device sync test are pending manual setup
- [ ] Google Drive photo upload quota/runtime behavior must be validated with real photos

## RESET-003 Required Checks

- [x] One Android app / one APK only
- [x] Frontline has no OCR proof-paper page, Flash technical flow, debug cards, or Supabase/R2 warnings
- [x] Frontline selects hub first and responsible staff second
- [x] Responsible staff list is filtered by selected hub
- [x] If only one responsible exists for a hub, the app auto-selects that person
- [x] Active hub/responsible context is stored locally
- [x] Barcode/QR scanner captures vehicle barcode with manual fallback
- [x] Date is current device date and read-only for Frontline
- [x] Drop condition controls required photo slots
- [x] Non-drop requires rear vehicle photo and front drop photo
- [x] Drop requires rear drop photo 1 and 2, with extra drop slots supported
- [x] Every captured photo stores real capturedAt timestamp
- [x] GPS is requested and stored when available
- [x] GPS denied/unavailable is stored as warning; GPS is not faked
- [x] Missing photo warning appears before submit
- [x] Submit saves COMPLETE or NEED_REVIEW record locally
- [x] หลังบ้าน manages hubs and responsible staff
- [x] หลังบ้าน has records/photos/export/settings/audit areas
- [x] Excel/ZIP export creates `workbook.xlsx`, `photos/`, and `manifest.json`
- [x] Rendered RESET-003 UI files have no mojibake patterns
- [ ] Physical Android device QA is still pending

## RESET-001 Required Checks

- [x] One Android app / one APK only
- [x] Frontline mode is Today / Scan / Photos / My Work only
- [x] Backoffice mode exposes records/photos/export/backup/settings/audit-oriented tools
- [x] Central unified table template exists in `src/config/unifiedTableTemplate.ts`
- [x] Unified export sheet `21.6` uses the same 11-column header order
- [x] Column 5 `transferLoadRate` exists, is hidden from Frontline, and is editable in Backoffice
- [x] Column 9 `plannedDepartureTime` auto-fills from proof/OCR route data when possible
- [x] Column 10 `actualDepartureTime` is read-only in Frontline and captured from device time on save
- [x] QR/barcode/manual/OCR all feed one review row
- [x] OCR remains local/lazy-loaded and review-first
- [x] Multiple/uncertain phone candidates require staff selection
- [x] Sample 1 parser fixture returns `NAK1RK8Z54` / `0653762402`
- [x] Sample 2 parser fixture returns `NAK1RP4745` / `0981299480`
- [x] Frontline photo flow maps to branch photo 1, branch photo 2, outbound after release photo
- [x] No fake Flash/OCR/Supabase/R2 success added
- [ ] Physical Android device QA is still pending

## MVP-017 Required Checks

- [x] `npm install` passes
- [x] `npx tsc -b` passes
- [x] `npm run build` passes
- [x] `npx cap sync android` passes
- [x] Java 17 is installed at `C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot`
- [x] Java works when `JAVA_HOME` and `PATH` are set for the current process
- [x] Android SDK exists at `C:\Users\myhou\AppData\Local\Android\Sdk`
- [x] Android debug APK build passes on local machine
- [x] APK path is documented
- [x] `android/local.properties` was not committed
- [x] Android camera permission exists
- [x] Package name is `com.flashops.hubchecklist`
- [x] Android WebView plugin file exists
- [x] `FlashProofWebViewPlugin` is registered in `MainActivity`
- [x] `android.permission.INTERNET` exists
- [x] Flash WebView allowlist remains restricted to `https://api.flashexpress.com/gw/nws/web/proof/go/`
- [x] App works without Supabase env keys
- [x] App works without R2 signed upload endpoint
- [x] Staff Home can create/select active profile without leaving the Today screen
- [x] Staff bottom nav is Today / Scan / Photos / My Work
- [x] Scan page no longer shows generic Placeholder badge
- [x] Scan page opens real camera preview with `getUserMedia`
- [x] BarcodeDetector scan loop extracts QR/barcode when supported
- [x] Camera stops after successful scan
- [x] Manual QR/barcode input remains available
- [x] OCR image action is local/lazy-loaded and does not fake confidence or success
- [x] Scan page shows editable Review fields before create
- [x] Create record routes directly to Photos/checklist
- [x] Driver phone is optional; typed phone must still validate
- [x] Driver phone cache is local-first by vehicle barcode
- [x] Cached phone is offered but remains editable
- [x] Parser fixture exists for `NAK1RK8Z54`
- [x] Responsible profile create/select/edit/delete flow is local-first
- [x] Staff navigation is simplified
- [x] Admin navigation is separate
- [x] Phone preview flow is clearer and advanced OCR is collapsible
- [x] Flash fallback/manual parser remains honest and advanced
- [x] Vehicle checklist photo progress is clearer
- [x] Export keeps exact 21.6 ZIP path and clearer steps
- [x] Backup/Cleanup guard remains intact
- [x] Supabase/R2 status is compact
- [x] No fake secure login was added
- [x] No fake driver phone extraction from QR was added
- [ ] Real device Flash WebView test passes
- [x] Real device Flash WebView test remains marked pending
- [x] No UI redesign or unrelated product feature was added

## Android SDK Result

Confirmed path:

```text
C:\Users\myhou\AppData\Local\Android\Sdk
```

Result: Android SDK was found at `C:\Users\myhou\AppData\Local\Android\Sdk`.

## Android Build Result

Local `.\gradlew.bat assembleDebug` result from `android`:

```text
BUILD SUCCESSFUL
```

APK path:

```text
C:\Users\myhou\Desktop\Agent Codex\hubchecklist\android\app\build\outputs\apk\debug\app-debug.apk
```

## Future QA gates

Every MVP must update this file before commit. If QA fails, do not mark complete.
