# Hub Vehicle Proof Capture

Mobile-first Hub vehicle proof capture app for QR intake, Flash proof workflow, checklist photos, audit history, dashboard operations, XLSX/ZIP export, and backup-safe cleanup.

RESET-008 prepares final production deployment paths:

- Android APK bundles the central Apps Script backend URL from `.env`.
- Web/PWA deploys to Vercel with `dist` output.
- Vercel URL is the actual iPhone/iPad/Desktop app URL.
- Apps Script `/exec` is API/backend only and returns a health response when opened.
- Employees never configure backend URL/token on device.
- Backoffice is protected by one central Admin PIN by default. AdminDevices approval is optional advanced security.

RESET-008A simplifies admin login:

- RESET-010 fixes the production sync path so startup/manual refresh pulls central bootstrap and central records, merges them with pending local work, and dedupes by `date + hubCode + responsibleEmployeeCode + vehicleBarcode`.
- RESET-010 makes submitted work await Apps Script sync before showing `ซิงก์แล้ว`; failed sync stays queued and visible as pending/failed instead of fake success.
- RESET-010 cleans ghost duplicate work by preferring the best record per duplicate key and hiding stale draft/in-progress copies when a completed/synced row exists.
- RESET-010 makes scanner mode hide the normal app header/nav shell, uses a full-screen dark camera view, keeps manual input fallback, and includes a safe flashlight unsupported message.
- RESET-010 watermark now includes `สถานที่` with a no-address fallback; it does not fake reverse-geocoded addresses.
- RESET-010 adds Backoffice tools for central diagnostics, pulling latest central data, retrying pending sync, and safe local cache clearing that blocks when pending sync exists.
- Admin login asks only for `Admin PIN`.
- Correct central PIN opens Backoffice.
- No deviceName, ownerName, Device ID, or approval request appears in the default login modal.
- Backoffice Settings can change the central PIN through Apps Script.
- RESET-009A makes Backoffice Hubs, Responsible Staff, and safe Settings save to Google Sheets through Apps Script instead of only local state.
- Hubs write to `Hubs` (`hubCode | hubName | active | note`) with soft deactivate by setting `active = FALSE`.
- Responsible staff write to `ResponsibleStaff` (`employeeCode | employeeName | hubCode | active | note`) with exact `employeeCode + hubCode` updates and soft deactivate.
- Safe Settings writes allow only `GPS_REQUIRED` / `GPS_MANDATORY`, `WATERMARK_ENABLED`, `REQUIRE_ADMIN_DEVICE_APPROVAL`, and `MINIMUM_APP_VERSION`; admin PIN hash, setup token, and shared secret are never exposed as editable UI settings.
- After central saves, the app refreshes bootstrap data so Frontline hub/responsible dropdowns use the latest active rows.
- RESET-009A also keeps Frontline local-first for records/photos while cleaning the active work screen: unfinished, missing-photo, pending-sync, and failed-sync work stays active; completed/synced work moves behind `ดูงานที่ส่งแล้ว`.
- Backoffice `ประวัติ` can filter local history by date range, hub, responsible person, barcode, and status, then export the filtered ZIP.
- Apps Script now includes safe action aliases for `updateSettingsBatch`, `getPhotos`, `getHistory`, and `getRecordsByDateRange`.
- UI polish tightens mobile/tablet/desktop spacing, safe-area bottom navigation, sticky submit behavior, card styling, focus states, and admin menu layout.
- RESET-009 final polish removes the photo watermark background box, uses clean Thai watermark labels, opens the scanner full-screen, groups My Work by active responsible person, and writes Google Sheets time values as Bangkok `yyyy-MM-dd HH:mm:ss` strings.
- RESET-009 one-shot backend final adds Apps Script `doGet` health, `initOrRepairStorage`, central duplicate-key lookup, and idempotent record upsert by date + hub + responsible + barcode.

RESET-006-007-FINAL-PLUS hardens the app around one central free backend:

- `VITE_APPS_SCRIPT_WEB_APP_URL` provides the central Apps Script `/exec` URL at build time.
- Frontline staff never enter or see backend URL/token settings.
- App startup bootstraps central hubs, responsible staff, app settings, admin auth status, and minimum app version, then caches data for offline use.
- Backoffice requires central Admin PIN verification by default; AdminDevices can be enabled later as an advanced restriction.
- Unapproved devices show Device ID and can request approval, but cannot self-approve.
- Full-screen scan uses a larger mobile camera viewport with Thai operational labels.
- Trailer-drop photo rules require rear main vehicle photo plus trailer photos.
- Watermarks draw clean Thai text directly on the photo with shadow/stroke only; no large background panel or black strip.

RESET-003 rebuilds the visible app again into a very simple **one APK** vehicle photo proof system:

- **Frontline**: select hub, select responsible person, scan Barcode/QR, locked current date, choose drop condition, capture required photos with real timestamp/GPS metadata, submit.
- **หลังบ้าน**: manage hubs, responsible staff, records, photos, export ZIP/Excel, settings, backup guard, and audit.

RESET-004 adds optional **free central storage** with Google Sheets + Google Apps Script + Google Drive:

- Backoffice Settings now has Google Apps Script Web App URL, local shared secret, sync mode, Test connection, pending queue count, and Retry sync.
- Frontline still saves locally first. If Google sync is configured and fails, the record remains local and is queued with `บันทึกในเครื่องแล้ว รอซิงก์`.
- Apps Script files live in `google-apps-script/` and create `Records_All`, hub-specific sheets, `Photos`, `Hubs`, `ResponsibleStaff`, and `Audit` sheets.
- Base64 photo upload to Google Drive is implemented as best-effort and can be limited by Apps Script/Drive quotas.

RESET-005 finalizes one deployable system:

- The app opens หน้างาน by default.
- Backoffice is protected by a local device Admin PIN.
- Google Sheets URL/token/settings are visible only after Backoffice unlock.
- Android APK, Web/PWA, iPhone/iPad Safari, tablet, and desktop browser paths share the same codebase.
- PWA and Android launcher icons use the new original Hub Photo Proof icon.

RESET-005A simplifies reporting:

- Excel export now uses 15 simple columns.
- Responsible code/name are merged into one column such as `25845 TUI`.
- Photo timestamp/GPS are visible on the photo watermark instead of split across many Excel columns.
- `manifest.json` still keeps full photo metadata.
- Google Sheets writes to `Records_All` and also updates a hub-specific sheet for easier viewing.

RESET-005B protects Backoffice setup on employee devices:

- A fresh install no longer lets staff create the first Admin PIN from the normal Backoffice entry.
- If no local Admin PIN exists, the app shows `ยังไม่ได้ตั้งค่า PIN หลังบ้าน กรุณาติดต่อผู้ดูแล`.
- First PIN setup is hidden behind an admin setup token (`VITE_ADMIN_SETUP_TOKEN`).
- Backoffice Settings includes Employee Device Mode to hide the Backoffice entry before handing a phone to staff.

Frontline no longer exposes OCR proof-paper parsing, Flash WebView technical flow, Supabase/R2 warnings, placeholder cards, or debug data. OCR/Flash code may remain in the repository for previous compatibility, but it is not part of the RESET-003 Frontline workflow.

RESET-001 rebuilds the product as **one Android app / one APK** with two modes inside the same app:

- **Frontline**: Today -> full-screen Scan -> Review one unified table row -> Photos -> Done.
- **Backoffice**: Dashboard/Records -> Photos -> Export -> Backup -> Settings -> Audit/admin tools.

The app now uses a central unified table template for the 11 required columns. Column 5 `transferLoadRate` is hidden from Frontline but appears in Backoffice/export. Column 9 `plannedDepartureTime` is auto-filled from QR/barcode/OCR/Flash parser data when possible. Column 10 `actualDepartureTime` is read-only for Frontline and captured from current device time at save.

MVP-017 simplifies the staff workflow into **Home -> Scan -> Review -> Create -> Photos**, adds QR/barcode/manual intake, adds a local OCR parser foundation for proof-paper images, and rebuilds the Android debug APK. It does **not** fake driver phone extraction from QR, secure Supabase Auth, production R2 backend, app store release, or Flash live automation success.

## Current QA Result

- Web dependencies install with npm audit warnings from existing dependencies.
- TypeScript build passes.
- Production web build passes.
- Capacitor Android sync passes.
- Capacitor doctor passes.
- Java exists at `C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot` and works when set for the current process.
- Android SDK exists at `C:\Users\myhou\AppData\Local\Android\Sdk`.
- Android debug APK build passes.
- APK path: `android/app/build/outputs/apk/debug/app-debug.apk`.
- RESET-009A TypeScript check passes.
- RESET-009A Apps Script syntax check passes with stdin `node --check`.
- RESET-009A `git diff --check` passes.
- RESET-009A central settings persistence is implemented in code; live Google Sheet row verification requires deploying the updated Apps Script and testing against the real sheet.
- Staff/Admin mode is local-first and clearly labeled as not connected to central login.
- Staff navigation is simplified to Today, Scan, Photos, and My Work.
- Admin navigation keeps dashboard, records, export, backup, settings, and audit-oriented tools separate.
- Scan page opens the real camera with `getUserMedia` and BarcodeDetector when available.
- QR/barcode scan extracts vehicle barcode automatically and stops the camera after a successful scan.
- Scan now shows an editable Review card before creating the record.
- Driver phone is optional for record creation; if entered, it must be a valid Thai mobile number.
- OCR proof-paper image reading is lazy-loaded and local; staff must verify the parsed fields before saving.
- Physical device testing is still pending.

## MVP Status

| MVP | Status | Notes |
| --- | --- | --- |
| MVP-001 Project skeleton + Capacitor | Complete | PWA/mobile foundation exists |
| MVP-002 Supabase schema/auth/RLS draft | Complete | App still works without Supabase keys |
| MVP-003 Responsible profile | Complete | Local active profile flow |
| MVP-004 Full-screen QR scan UI | Complete | Manual fallback remains honest |
| MVP-005 OCR phone preview/edit | Complete | OCR foundation/manual text flow |
| MVP-006 Android WebView Flash foundation | Complete | Requires physical Android validation |
| MVP-007 Vehicle records + duplicates | Complete | Local-first records |
| MVP-008 Checklist photos + compression + R2 foundation | Complete | R2 upload not faked when endpoint missing |
| MVP-009 Edit/redo/void/audit | Complete | Local audit history |
| MVP-010 Dashboard hardening | Complete | Search/filter/sort/alerts |
| MVP-011 XLSX/ZIP exact 21.6 export | Complete | Browser ZIP/export works locally |
| MVP-012 Backup Reminder + Cleanup Guard | Complete | Cleanup only confirmed backed-up local payloads |
| MVP-013 Android QA readiness | Complete | Docs/checklists added; APK build needs Java/Android SDK |
| MVP-014 Android APK build readiness | Complete | Debug APK build passed; real device QA pending |
| MVP-015 UI/UX polish + role flow | Complete | Local staff/admin mode, cleaner mobile workflow |
| MVP-016 Real camera scan + fast staff flow | Complete | Camera scanner and one-screen phone flow implemented |
| MVP-017 Simple staff scan/review/create flow | Complete | QR/barcode/manual/OCR parser foundation; real device QA still pending |
| RESET-001 Frontline/Backoffice unified table rebuild | Complete | One APK, mode separation, unified table export, real device QA still pending |
| RESET-003 Simple hub barcode photo proof app | Complete | Frontline hub/responsible/barcode/photo submit; Admin backoffice/export; device QA pending |
| RESET-004 Free Google Sheets storage sync | Complete | Optional Apps Script sync, Drive photo upload, pending queue; live Sheet setup/test still manual |
| RESET-005 Final PWA/admin lock/responsive/icon pass | Complete | Admin PIN, PWA docs/icons, Android icon, responsive hardening; real device QA still pending |
| RESET-009 final production UI scan photo watermark time polish | Complete | UI/watermark/scan/photo/time polish implemented; physical device QA and live Apps Script verification still pending |
| RESET-009A Central sync history cleanup and final UI polish | Complete | Central admin saves, clean Frontline active/history split, Backoffice filters, Apps Script history aliases, and UI polish implemented; live sheet/device QA pending |
| RESET-010 Central sync dedupe fullscreen scanner watermark UI | Complete | Central pull/merge, duplicate hiding, fullscreen scanner shell, safe cache tools, and watermark location fallback implemented; live deployment/device QA pending |
| RESET-011 Full rebuild central-first Hub Photo Proof | Complete | React app, central API service, Apps Script router, scanner, photo flow, Backoffice, cache tools, and docs rebuilt around Google Sheets as source of truth; live deployment/device QA pending |
| RESET-012 Central photo previews and submit success flow | Complete | Photo slot metadata, Drive thumbnail formulas, Records_All photo linking, stricter central sync success, and Thai submit success screen implemented; live Sheet/device QA pending |

## Key Docs

- [Android device test guide](docs/ANDROID_DEVICE_TEST.md)
- [Flow QA checklist](docs/FLOW_QA_CHECKLIST.md)
- [Deployment notes](docs/DEPLOYMENT_NOTES.md)
- [APK build result](docs/APK_BUILD_RESULT.md)
- [Real device test result](docs/REAL_DEVICE_TEST_RESULT.md)
- [Project spec](docs/PROJECT_SPEC.md)
- [Google Sheets storage setup](docs/GOOGLE_SHEETS_STORAGE_SETUP.md)
- [Web/PWA deployment](docs/WEB_PWA_DEPLOYMENT.md)
- [iPhone user guide](docs/IPHONE_USER_GUIDE.md)
- [Employee device setup](docs/EMPLOYEE_DEVICE_SETUP.md)
- [App icon](docs/APP_ICON.md)

## Google Sheets Sync

RESET-011 is central-first. Google Sheets + Apps Script + Google Drive are the free central backend and source of truth for hubs, responsible staff, settings, submitted records, photo metadata, audit, and history.

Set `VITE_APPS_SCRIPT_WEB_APP_URL` at build/deploy time so every device talks to the same Apps Script `/exec` URL. Staff devices must not enter or see `APP_SHARED_SECRET`, Admin PIN hash, or script secrets in the frontend.

If the URL is missing or the network is offline, Frontline still opens for capture safety and clearly marks submitted work as `รอซิงก์` or `ซิงก์ไม่สำเร็จ`. The app only shows `ซิงก์แล้ว` after Apps Script returns `ok=true`.

Apps Script formats readable Sheet times with `Asia/Bangkok` as `yyyy-MM-dd HH:mm:ss`.

## RESET-011 Rebuild

- Replaced the main React flow with four Frontline tabs only: `วันนี้`, `สแกน`, `รูป`, and `งานของฉัน`.
- Rebuilt Backoffice with `ภาพรวม`, `ฮับ`, `ผู้รับผิดชอบ`, `รายการ`, `รูปภาพ`, `ประวัติ`, `ส่งออก`, `ตั้งค่า`, and `ระบบกลาง`.
- Rebuilt `src/services/reset003.ts` as a central-first API service with bootstrap, central pull, record upsert, pending retry, duplicate merge, safe cache clear, and watermark helpers.
- Rebuilt `google-apps-script/Code.gs` with the required actions and `{ ok, message, data }` response envelope.
- Duplicate key is `date + hubCode + responsibleEmployeeCode + vehicleBarcode`; central sync upserts by this key and the UI hides stale local drafts behind the most complete/latest record.
- Scanner is fullscreen with dark overlay, yellow scan frame, close button, manual input bottom sheet, and no normal app chrome.
- Watermark draws direct text with shadow/stroke and includes date, time, GPS, location fallback, barcode, hub, responsible staff, and photo type. It does not fake an address.
- Safe cache clear only removes local display/cache preferences and refuses to run while pending sync exists. It never deletes Google Sheet rows or Drive files.

## RESET-012 Central Photo Sync Fix

- Frontend now sends complete photo slot metadata for every captured photo: `slotId`, `slotType`, and `labelThai`.
- Apps Script rejects photo rows with missing slot metadata using Thai error text instead of writing blank slot cells.
- Drive uploads are shared with anyone-with-link view when possible.
- Apps Script stores `driveUrl`, `imagePreviewUrl`, and `imageFormula`.
- `Photos` sheet receives an `imagePreview` formula cell.
- `Records_All` photo columns are updated from the matching `Photos` rows by `recordId` or `duplicateKey`.
- Complete central saves return `ซิงก์แล้ว`; the app does not show the success screen unless central sync returns OK.
- After successful submit, staff see `ส่งข้อมูลแล้ว` with actions for scanning the next vehicle, viewing My Work, or opening details.
- Cross-device refresh uses central `getRecords` and local dedupe by duplicate key so another device can see submitted records after pulling latest data.

## RESET-009 Polish

- Watermarked photos draw Thai text directly on the image with shadow/stroke only. There is no black strip or large background panel.
- Watermark labels are `วันที่`, `เวลา`, `พิกัด`, `บาร์โค้ดรถ`, `ฮับ`, `ผู้รับผิดชอบ`, and `ประเภทรูป`.
- Frontline opens with short operational Thai labels and an online/offline status pill.
- Scan opens as a full-screen camera view with close action and manual barcode fallback.
- Photo page keeps large capture/retake controls, safe bottom padding, and a sticky submit button above navigation.
- My Work lists today’s open work for the active hub/responsible person so staff can continue missing trailer/drop photos.
- Scanning a duplicate barcode first checks same-device records, then checks Apps Script online when configured. Existing unfinished work resumes; submitted work warns before duplicate creation and requires a reason.
- Backoffice Settings includes `ตรวจสอบและซ่อมชีท` for `initOrRepairStorage`.

The app sends submitted records and photo metadata to Apps Script. If the request fails, it queues the payload locally and staff can continue work.

## Commands

```bash
npm install
npx tsc -b
npm run build
npx cap sync android
npx cap doctor
```

Rebuild Android debug APK from the project root:

```bash
.\android\gradlew.bat -p android assembleDebug
```

Expected SDK local config after Android SDK install:

```properties
sdk.dir=C:/Users/myhou/AppData/Local/Android/Sdk
```

Manual APK install after enabling USB debugging on the Android device:

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Remaining Production Work

- Real Android device QA on Samsung S23 FE and Galaxy Tab A7 Lite.
- iPad browser fallback QA.
- Physical Android Flash live automation validation.
- Real camera permission/scan validation on physical Android devices.
- Android release signing/app store packaging.
- Production R2 signed upload backend.
- Production R2 delete backend.
- Production Supabase sync hardening.
- Secure Supabase Auth replacing the local MVP mode switch.
- Storage billing automation or live cloud usage metrics.
