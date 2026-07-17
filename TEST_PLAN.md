# Test Plan

## RESET-010 Production Sync, Scanner, Dedupe, Watermark

- Deploy the updated Apps Script before live testing.
- Submit a record in browser/device A, then tap `รีเฟรชข้อมูล` in browser/device B and confirm the record appears from central data.
- Create one barcode work round, submit it, and confirm `งานของฉัน` shows one completed/synced item only when `ดูงานที่ส่งแล้ว` is enabled.
- Start a barcode, capture a photo, leave it incomplete, scan the same barcode again, and confirm it resumes the existing work.
- Retry pending sync and confirm the local pending status clears after Apps Script success.
- Open scanner and confirm normal header/nav are hidden, camera fills the screen, and manual barcode entry remains available.
- Capture a photo and confirm the watermark includes date, time, GPS, `สถานที่`, barcode, hub, and responsible person.
- Try `ล้างแคชเครื่องนี้` while pending sync exists and confirm it is blocked.
- Run desktop/mobile/tablet layout checks for scanner, photo sticky submit, and Backoffice settings diagnostics.

## RESET-009A Admin Settings Central Save

- Deploy the updated `google-apps-script/Code.gs` as a new Apps Script Web App version.
- Confirm the sheet has `Hubs` headers `hubCode | hubName | active | note`.
- In Backoffice Hubs, add a hub and confirm a row appears in `Hubs`.
- Edit the same hub and confirm the row updates by `hubCode`, not a duplicate append.
- Deactivate the hub and confirm `active` becomes `FALSE` and the row is not hard deleted.
- Confirm the sheet has `ResponsibleStaff` headers `employeeCode | employeeName | hubCode | active | note`.
- In Backoffice Responsible Staff, add a staff row and confirm it appears in `ResponsibleStaff`.
- Edit the same staff for the same hub and confirm the row updates by `employeeCode + hubCode`.
- Deactivate the staff row and confirm `active` becomes `FALSE`.
- Refresh the app and confirm Frontline hub and responsible dropdowns show only active rows.
- Select a hub and confirm responsible staff appears only when `hubCode` matches exactly.
- In Backoffice Settings, toggle GPS/watermark and confirm safe `Settings` rows update centrally.
- Confirm `ADMIN_PIN_HASH`, `ADMIN_SETUP_TOKEN`, and `APP_SHARED_SECRET` are not shown or editable in UI settings.
- Disconnect or break Apps Script temporarily and confirm the UI shows `บันทึกไม่สำเร็จ กรุณาลองใหม่` instead of pretending success.
- Confirm `Audit` receives `hub_upsert`, `hub_deactivate`, `responsible_upsert`, `responsible_deactivate`, and `setting_update` rows with Bangkok `createdAt`.
- Confirm Backoffice refuses Hubs/Responsible Staff saves when the central backend is unavailable and shows `ต้องเชื่อมต่อระบบกลางก่อนจึงจะบันทึกได้`.
- Submit Frontline work and confirm local capture is fast, then status moves through pending/synced when Google sync is available.
- Open `งานของฉัน` and confirm completed/synced records are hidden by default.
- Tap `ดูงานที่ส่งแล้ว` and confirm today completed work appears without deleting anything from Google Sheets.
- Open Backoffice `ประวัติ`, filter by date range, hub, responsible person, barcode, and status, then export the filtered ZIP.
- Check mobile, tablet, and desktop layouts for non-overlapping menus, bottom nav, sticky submit button, photo cards, and modals.

## RESET-009 Final Polish Checks

- Open Frontline and confirm the header uses `Hub Photo Proof`, `หน้างาน`, and a short `ออนไลน์` / `ออฟไลน์` / `รอซิงก์` status.
- Tap `สแกนบาร์รถ` and confirm the scanner fills the viewport, hides the bottom nav, shows a close button, and keeps manual `กรอกบาร์รถ` fallback.
- Scan or manually enter the same barcode twice for the same date/hub/responsible person and confirm the app offers to continue existing work instead of creating an accidental duplicate.
- Capture each required photo and confirm the preview has no black strip or dark background panel.
- Confirm watermark labels are Thai only: `วันที่`, `เวลา`, `พิกัด`, `บาร์โค้ดรถ`, `ฮับ`, `ผู้รับผิดชอบ`, `ประเภทรูป`.
- Deny GPS and confirm the watermark says `พิกัด: ไม่พบตำแหน่ง` without fake coordinates.
- Submit with missing photos and confirm the warning is short Thai text and the record becomes `รอตรวจสอบ`.
- Open `งานของฉัน` and confirm it lists today’s open records for the active hub/responsible person, grouped by vehicle barcode in the list.
- Sync to Google Sheets and confirm submitted/captured values are Bangkok strings like `2026-07-17 00:34:12`, not English browser date strings.
- Export ZIP and confirm the 15-column workbook, watermarked photos, and manifest still generate.
- Open Apps Script `/exec` in a browser and confirm safe JSON health shows `version: RESET-009` and Thai ready message.
- From Backoffice Settings, tap `ตรวจสอบและซ่อมชีท` and confirm the message says the sheet structure was checked/repaired.
- Scan the same barcode on the same device and confirm unfinished work resumes.
- With Apps Script configured, scan a barcode already in `Records_All` and confirm the app warns/resumes from the central duplicate key.
- Submit/retry sync for the same record twice and confirm `Records_All` updates the existing row instead of appending a duplicate.

## RESET-008A Simple Admin PIN Login

- Deploy Apps Script with RESET-008A `Code.gs`.
- Configure central PIN using Backoffice Settings or Apps Script `ADMIN_SETUP_TOKEN` first setup path.
- Open the app and confirm Frontline loads.
- Tap Backoffice icon.
- Confirm modal shows only `Admin PIN`, cancel, and enter buttons.
- Enter wrong PIN and confirm `PIN ไม่ถูกต้อง`.
- Enter correct PIN and confirm Backoffice opens.
- In Backoffice Settings, change PIN and confirm the old PIN no longer works.
- Confirm AdminDevices approval is not required unless the advanced device approval toggle is enabled.

## RESET-008 Final Deployment

Vercel/Web/PWA:

- Confirm `npm run build` produces `dist`.
- Confirm `vercel.json` uses `npm run build` and `dist`.
- In Vercel, set `VITE_APPS_SCRIPT_WEB_APP_URL` and `VITE_APP_CLIENT_MODE=central`.
- Open the Vercel URL on iPhone Safari and Add to Home Screen.
- Confirm staff never see Google Apps Script URL/token fields.

Apps Script:

- Deploy a new Apps Script Web App version after updating `Code.gs`.
- Open `/exec` in a browser and confirm the health response says it is the backend API.
- Confirm the Vercel URL, not `/exec`, is used as the employee website.

Android:

- Create `.env` with `VITE_APPS_SCRIPT_WEB_APP_URL` and `VITE_APP_CLIENT_MODE=central`.
- Run build, Capacitor sync, and `assembleDebug`.
- Install APK and confirm Frontline opens by default.

## RESET-006-007-FINAL-PLUS

Central backend:

- Build with `VITE_APPS_SCRIPT_WEB_APP_URL` and `VITE_APP_CLIENT_MODE=central`.
- Open the app and confirm Frontline loads without asking staff for URL/token.
- Temporarily remove the backend URL and confirm the Thai contact-admin backend message appears.
- Open the Apps Script `/exec` URL in a browser and confirm it returns a health response instead of missing `doGet`.

Central admin authorization:

- Open Backoffice on a new device and confirm it cannot unlock until approved.
- Copy Device ID and submit an admin access request.
- From an already approved admin device, list AdminDevices, approve the pending device, then verify login with central PIN.
- Revoke the device and confirm Backoffice no longer unlocks.

Frontline scan/photo:

- Confirm the scan view fills most of the phone viewport and uses `สแกนบาร์รถ`, `สแกนให้เต็มกรอบ`, and `กรอกเอง`.
- Scan or manually enter a barcode, confirm locked Bangkok date is automatic, choose drop condition, and continue to photos.
- For non-trailer-drop, confirm required slots are rear vehicle and front drop.
- For trailer-drop, confirm required slots are rear main vehicle, trailer 1, trailer 2, and optional extra trailer drops.
- Attempt submit with missing photos and confirm the NEED_REVIEW warning appears.
- Capture photos and confirm watermark is large, rounded, readable, and contains date, time, GPS, barcode, hub, responsible, and photo slot.

## RESET-005B

Goal: verify employees cannot create their own Backoffice PIN on fresh installs.

- Clear local app data or install on a fresh browser/device.
- Open the app and confirm Frontline opens.
- Tap the normal Backoffice gear.
- Confirm it shows `ยังไม่ได้ตั้งค่า PIN หลังบ้าน กรุณาติดต่อผู้ดูแล`.
- Confirm there is no normal staff-visible first-time setup form.
- Configure `VITE_ADMIN_SETUP_TOKEN` for an admin build/session.
- Long-press or double-click the app title to open hidden admin setup.
- Enter wrong setup token and confirm setup is rejected.
- Enter correct setup token, set Admin PIN, and confirm Backoffice unlocks.
- In Backoffice Settings, enable `ล็อกเครื่องนี้เป็นเครื่องพนักงาน`.
- Confirm the normal Backoffice gear is hidden after locking.
- Confirm Google URL/token remain visible only inside unlocked Backoffice Settings.

## RESET-005A

Goal: verify simplified export, watermarked photo evidence, merged responsible value, and hub-based Google Sheets views.

Export checks:

- Create a record for responsible `25845 TUI`.
- Capture at least one photo with GPS allowed.
- Export ZIP.
- Open `workbook.xlsx` and confirm the Records sheet has exactly 15 headers.
- Confirm responsible appears in one column as `25845 TUI`.
- Confirm there are no separate photo timestamp/GPS columns.
- Confirm photo cells point to watermarked photo filenames.
- Open `manifest.json` and confirm full photo metadata still exists.

Watermark checks:

- Confirm preview image shows date/time, GPS, barcode, hub, responsible, and photo slot.
- Deny GPS and retake a photo.
- Confirm the watermark shows `พิกัด: ไม่พบตำแหน่ง` and no fake coordinates.

Google Sheets checks:

- Deploy the updated Apps Script.
- Submit/sync a record.
- Confirm `Records_All` receives the simplified row.
- Confirm a hub-specific sheet is created or updated.
- Retry pending sync and confirm the same record is updated, not duplicated.

## RESET-005

Goal: verify the final one-system app with หน้างาน default, PIN-protected Backoffice, Android APK, Web/PWA support, responsive layout, and app icons.

Admin lock:

- Fresh open loads หน้างาน.
- Tap the small Backoffice gear.
- If no PIN exists, confirm normal entry shows the contact-admin message instead of first-time PIN setup.
- Use the hidden admin setup token flow only on an admin-controlled device when first PIN setup is required.
- Lock Backoffice.
- Reopen Backoffice and confirm the PIN is required.
- Confirm wrong PIN is rejected.
- In Settings, change the Admin PIN and confirm the old PIN no longer unlocks.

Frontline:

- Confirm no Google URL/token, export, backup, settings, audit, or admin records are visible.
- Select hub, select responsible staff, scan/manual barcode, choose drop condition, capture photos, submit.
- Deny camera and confirm manual input fallback still completes work.
- Deny GPS and confirm warning only, no fake GPS.

Responsive:

- Test 360x740, 390x844, 412x915, 430x932, 800x1340, and 1024x768.
- Confirm no horizontal scroll.
- Confirm Backoffice navigation collapses into mobile-safe tabs/cards.
- Confirm bottom nav does not cover submit buttons.

PWA/iPhone:

- Run web build and verify `dist/manifest.webmanifest` and `dist/icons/` exist.
- Open the HTTPS web URL on iPhone Safari.
- Add to Home Screen.
- Confirm camera/GPS permission prompts appear where supported.
- Confirm manual barcode and photo input fallback works.

Icons:

- Confirm browser favicon/PWA icons are present.
- Confirm Android launcher PNGs exist in all mipmap density folders.

## RESET-004

Goal: verify optional free central storage through Google Sheets + Apps Script + Drive while preserving local-first Frontline work.

Local-only checks:

- Open หลังบ้าน -> Settings.
- Confirm Sync mode defaults to `Local only`.
- Leave Google Apps Script URL and shared secret blank.
- Submit a Frontline record and confirm the app does not crash.
- Confirm record appears in local Admin Records.
- Confirm Export ZIP still works from local data.

Configured sync checks:

- Deploy `google-apps-script/Code.gs` from a Google Sheet.
- Set Script Property `APP_SHARED_SECRET`.
- Enter the Web App URL and shared secret in Settings.
- Tap Test connection and confirm success.
- Submit a Frontline record with photos.
- Confirm `Records_All`, the hub-specific sheet, and `Photos` rows appear in Google Sheets.
- Confirm Drive folder `HubChecklist Photos/<date>/<vehicleBarcode>/` contains uploaded image files when payload size permits.

Failure/retry checks:

- Configure a wrong shared secret.
- Submit a record.
- Confirm staff sees `บันทึกในเครื่องแล้ว รอซิงก์`.
- Confirm pending sync queue count increases.
- Fix the shared secret.
- Tap Retry sync.
- Confirm queue count decreases after successful sync.

Safety checks:

- Do not add Firebase, Supabase, R2, or paid cloud services.
- Do not claim live Google sync success until the user's Web App URL is deployed and tested.

## RESET-003

Goal: verify the simplified Frontline + หลังบ้าน photo proof app in one APK.

Frontline:

- Select hub `26NAK_BHUB-นครราชสีมา`.
- Confirm responsible list only shows staff for that hub.
- Confirm `25845 TUI` auto-selects when it is the only active responsible person for the hub.
- Scan Barcode/QR or type a manual vehicle barcode.
- Confirm date shows as read-only `YYYY-MM-DD`.
- Select `ไม่พ่วงดรอป`; confirm required slots are rear vehicle photo and front drop photo.
- Select `พ่วงดรอป`; confirm required slots are drop rear 1 and drop rear 2.
- Add an extra drop and confirm another required photo slot appears.
- Capture/retake photos and confirm timestamp appears.
- Deny GPS and confirm GPS warning appears without fake coordinates.
- Submit with all photos and confirm status becomes `COMPLETE`.
- Submit with missing photos only after warning confirmation and confirm status becomes `NEED_REVIEW`.

หลังบ้าน:

- Add/edit/delete hubs.
- Add/edit/delete responsible staff and assign each to one hub.
- Review records, missing photos, timestamp/GPS metadata, and audit.
- Export ZIP and confirm `workbook.xlsx`, `photos/`, and `manifest.json` exist.
- Confirm Frontline does not show export/backoffice menus.
- Confirm physical device QA remains pending until tested on real hardware.

## RESET-001

Goal: verify one APK with separated Frontline and Backoffice modes, one unified table, full-screen scan/review/photo capture, export mapping, and Android debug APK build.

Checks:

- Start in Frontline mode and confirm bottom nav has only Today, Scan, Photos, My Work.
- Save responsible profile `25845 Tui / BNAK` from Today if missing.
- Scan or paste Flash URL/barcode; Review shows one row, not debug cards.
- Confirm planned departure auto-fills from route text such as `LH-6W7.2-BNAK-NE1-20:00-BD-1-RO`.
- Confirm actual departure time is read-only, updates live, and saves current device `HH:mm`.
- Use OCR fixture/sample 1 and sample 2; phone values must be `0653762402` and `0981299480`.
- If multiple phone candidates are detected, choose from chips before Create is enabled.
- Save row and confirm Photos opens directly.
- Capture branch photo 1, branch photo 2, and outbound after release photo.
- Switch to Backoffice and confirm Settings shows the unified header template.
- Backoffice Edit can edit `transferLoadRate`, `actualDepartureTime`, `actualDepartureDateTime`, and `smallParcelPriority` with audit reason.
- Export ZIP and verify workbook `21.6` has the 11 unified headers in order.
- Backup/Cleanup guard remains blocked unless backup is confirmed.
- Do not mark physical device Flash/WebView QA passed until tested on Samsung S23 FE or Galaxy Tab A7 Lite.

## MVP-017

Goal: verify the simple staff workflow **Home -> Scan -> Review -> Create -> Photos** with QR/barcode/manual intake, local OCR parser foundation, and Android APK rebuild, without faking driver phone extraction, secure auth, cloud upload, or Flash live success.

## Commands Run

```powershell
java -version
Write-Output "JAVA_HOME=$env:JAVA_HOME"
npm.cmd install
npx.cmd tsc -b
npm.cmd run build
npx.cmd cap sync android
cd android
.\gradlew.bat assembleDebug
```

## Results

- `npm.cmd install`: must pass, with existing npm audit warnings acceptable.
- `npx.cmd tsc -b`: must pass.
- `npm.cmd run build`: must pass, with known Vite large chunk warning from XLSX/ZIP libraries acceptable.
- `npx.cmd cap sync android`: must pass.
- `.\gradlew.bat assembleDebug`: must pass from the `android` folder when SDK is available.

## MVP-015 UX Checks

- Switch between Staff mode and Admin mode; mode persists in localStorage.
- Confirm header shows current mode and local-login notice.
- Confirm Supabase/R2 status is compact and does not dominate operational pages.
- Staff mode bottom nav shows only today, responsible profile, scan, photos, and own work.
- Admin mode bottom nav shows dashboard, records, export, backup, and settings.
- Responsible profile page can create/select/edit/delete `25845 Tui / BNAK`.
- Scan page has no generic Placeholder badge.
- Scan page has one scan-again/reset action.
- Scan page explains why next is disabled when no responsible profile exists.
- Scan preview has progress steps and a large phone input.
- OCR/manual raw text controls are under advanced options.
- Flash page clearly separates Android WebView action from Web/PWA fallback.
- Vehicle checklist shows a large photo progress banner and keeps audit collapsible.
- Dashboard remains card-based and usable on mobile.
- Export page keeps exact 21.6 ZIP behavior and adds simple steps.
- Backup/Cleanup still requires confirmed backup and the exact confirmation phrase.

## MVP-017 Staff Scan/Review/Create Checks

- Staff Home with no active profile shows inline setup for `25845 Tui / BNAK`.
- Staff bottom nav shows Today, Scan, Photos, and My Work.
- Tap camera scan; real camera preview appears.
- Deny camera permission; clear Thai message appears and manual input remains available.
- Scan or paste Flash proof URL `https://api.flashexpress.com/gw/nws/web/proof/go/NAK1RH9A274`.
- Confirm vehicle barcode becomes `NAK1RH9A274`.
- Confirm camera stops after successful scan.
- Confirm no test-mode scanner warning appears.
- Confirm QR does not claim to include driver phone.
- Review card appears with editable vehicle barcode, driver phone, origin, destination, route, departure, arrival, distance, duration, and company fields.
- Leave phone blank and confirm record creation is allowed.
- Enter invalid phone and confirm creation is blocked.
- Enter `0643042911`, create record, and confirm app opens Photos/checklist for that record.
- Repeat same vehicle barcode; cached phone option appears and remains editable.
- Confirm bottom sticky action is not hidden by bottom navigation.
- Confirm raw vehicle barcode manual fallback works.
- Use OCR image/text action and confirm parsed values must be reviewed before saving.
- Parser sample `NAK1RK8Z54` should extract barcode `NAK1RK8Z54`, phone `0643042911`, company `DOLLARSOUND`, distance `131KM`, and duration `2h15min`.

## MVP-016 Camera And Staff Flow Checks

- Tap `เปิดกล้องสแกน QR`; real camera preview appears.
- Deny camera permission; clear Thai message appears and manual input remains available.
- Scan Flash proof URL `https://api.flashexpress.com/gw/nws/web/proof/go/NAK1RH9A274`.
- Confirm vehicle barcode becomes `NAK1RH9A274`.
- Confirm camera stops after successful scan.
- Confirm no test-mode scanner warning appears.
- Confirm QR does not claim to include driver phone.
- If no cached phone exists, phone input appears on Scan page.
- Enter `0643042911`, confirm, and continue to Flash page.
- Repeat same vehicle barcode; cached phone option appears and remains editable.
- Confirm bottom sticky action is not hidden by bottom navigation.
- Confirm raw vehicle barcode manual fallback works.

## Android Project Checks

- Package/application ID: `com.flashops.hubchecklist`
- Android WebView plugin file: exists
- `FlashProofWebViewPlugin` registration: exists in `MainActivity`
- `android.permission.INTERNET`: exists
- Flash allowlist: restricted to `https://api.flashexpress.com/gw/nws/web/proof/go/`

## APK Install Steps

1. Connect Android device by USB.
2. Enable Developer Options and USB debugging.
3. Trust the development computer on the device.
4. Install with Android Studio or `adb install android/app/build/outputs/apk/debug/app-debug.apk`.
5. Open the app and confirm it does not crash.

## Real Device Flow

Use [REAL_DEVICE_TEST_RESULT.md](docs/REAL_DEVICE_TEST_RESULT.md) and [FLOW_QA_CHECKLIST.md](docs/FLOW_QA_CHECKLIST.md) for step-by-step validation with:

- employeeCode: `25845`
- displayName: `Tui`
- branch: `BNAK`
- QR URL: `https://api.flashexpress.com/gw/nws/web/proof/go/NAK1R7XJ45`
- vehicleBarcode: `NAK1R7XJ45`
- phone: `0643042911`

## Device Targets

- Samsung S23 FE
- Galaxy Tab A7 Lite
- iPad browser fallback
- Desktop browser

## Android Testing

Use [ANDROID_DEVICE_TEST.md](docs/ANDROID_DEVICE_TEST.md). Real device validation remains required after APK installation.

Do not mark Flash live automation passed until a physical Android device has loaded the real Flash proof page and completed the flow.

## Safety Review

- No Firebase added.
- No paid cloud required.
- No R2 secrets exposed in frontend.
- No fake Supabase sync success.
- No fake R2 upload/delete success.
- No fake Flash extraction success.
- Business records are not hard-deleted.
- Cleanup only removes confirmed backed-up local photo payloads.

## RESET-011 Central-First Rebuild Test Plan

1. Fresh open with `VITE_APPS_SCRIPT_WEB_APP_URL` configured.
   - Confirm the app pulls active `Hubs` and `ResponsibleStaff`.
   - Confirm Frontline shows Thai labels only.

2. Frontline context.
   - Select hub `26NAK_BHUB`.
   - Select responsible staff `25845 Tui`.
   - Tap `บันทึกและเริ่มงาน`.

3. Scanner.
   - Confirm scanner fills the whole screen.
   - Confirm header and bottom nav are hidden.
   - Confirm yellow scan frame, close button, hub code, and instruction are visible.
   - Use manual bottom sheet and submit barcode `NAK1R7XJ45`.

4. Duplicate behavior.
   - Repeat the same barcode on the same date/hub/responsible staff.
   - Confirm unfinished work resumes instead of creating a ghost duplicate.
   - Submit the work, then scan again.
   - Confirm the app warns that the work was already submitted.

5. Photos and watermark.
   - Choose `ไม่พ่วงดรอป` and capture required photos.
   - Confirm no bottom navigation overlap.
   - Confirm preview fits the screen.
   - Confirm watermark includes date, time, GPS or `พิกัด ไม่พบตำแหน่ง`, location or `สถานที่ ไม่พบชื่อสถานที่`, barcode, hub, and responsible staff.

6. Submit/sync.
   - Submit with all required photos.
   - Confirm status becomes `ซิงก์แล้ว` only after Apps Script returns success.
   - Disable network and submit another record.
   - Confirm status is `รอซิงก์` or `ซิงก์ไม่สำเร็จ`, not fake success.
   - Restore network and run `ซิงก์งานค้างตอนนี้`.

7. Two-device central check.
   - Device A submits a record.
   - Device B presses `รีเฟรชข้อมูล`.
   - Confirm Device B sees the same central record.
   - This remains pending until live deployment/device testing is performed.

8. Backoffice.
   - Unlock with central Admin PIN.
   - Add/edit/deactivate hub and confirm rows update in `Hubs`.
   - Add/edit/deactivate responsible staff and confirm rows update in `ResponsibleStaff`.
   - Save safe settings and confirm rows update in `Settings`.
   - Confirm secrets such as Admin PIN hash and shared secret are not shown in Frontline.

9. Cache tools.
   - With pending sync, try `ล้างแคชเครื่องนี้`; confirm it is blocked.
   - With no pending sync, clear cache and confirm central rows and Drive files are not deleted.

10. Build gates.
    - `npm.cmd install`
    - `npx.cmd tsc -b`
    - `npm.cmd run build`
    - `npx.cmd cap sync android`
    - `.\gradlew.bat assembleDebug` from `android`
    - Apps Script syntax check
    - mojibake scan
