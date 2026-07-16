# Test Plan

## RESET-003

Goal: verify the simplified Frontline + Admin Backoffice photo proof app in one APK.

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

Admin Backoffice:

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
