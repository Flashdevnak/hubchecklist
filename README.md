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

- Admin login asks only for `Admin PIN`.
- Correct central PIN opens Backoffice.
- No deviceName, ownerName, Device ID, or approval request appears in the default login modal.
- Backoffice Settings can change the central PIN through Apps Script.
- RESET-009 final polish removes the photo watermark background box, uses clean Thai watermark labels, opens the scanner full-screen, groups My Work by active responsible person, and writes Google Sheets time values as Bangkok `yyyy-MM-dd HH:mm:ss` strings.

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

Default mode is `Local only`; no URL or token is required to open/build the app. To enable central free storage, deploy `google-apps-script/Code.gs` as a Google Apps Script web app, set `APP_SHARED_SECRET` in Script Properties, then enter the Web App URL and shared secret in หลังบ้าน -> Settings.

RESET-009 keeps the simplified 15-column record row. Apps Script formats submitted/captured timestamps with `Asia/Bangkok` as `yyyy-MM-dd HH:mm:ss` and preserves already formatted local values.

## RESET-009 Polish

- Watermarked photos draw Thai text directly on the image with shadow/stroke only. There is no black strip or large background panel.
- Watermark labels are `วันที่`, `เวลา`, `พิกัด`, `บาร์โค้ดรถ`, `ฮับ`, `ผู้รับผิดชอบ`, and `ประเภทรูป`.
- Frontline opens with short operational Thai labels and an online/offline status pill.
- Scan opens as a full-screen camera view with close action and manual barcode fallback.
- Photo page keeps large capture/retake controls, safe bottom padding, and a sticky submit button above navigation.
- My Work lists today’s open work for the active hub/responsible person so staff can continue missing trailer/drop photos.

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
