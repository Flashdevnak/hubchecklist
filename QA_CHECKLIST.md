# QA Checklist

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
- [x] GPS unavailable watermark shows a warning and does not fake coordinates
- [x] ZIP photos use the watermarked image data
- [x] `manifest.json` includes full photo metadata
- [x] Apps Script writes to `Records_All`
- [x] Apps Script creates/updates hub-specific sheets
- [x] Apps Script sync retry updates existing rows by record id
- [x] Frontline still hides Google sync settings
- [ ] Live Google Sheets deployment with real Drive upload remains pending

## RESET-005 Required Checks

- [x] One codebase supports Android APK and Web/PWA
- [x] App opens Employee Frontline by default
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
- [x] Admin Backoffice manages hubs and responsible staff
- [x] Admin Backoffice has records/photos/export/settings/audit areas
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
