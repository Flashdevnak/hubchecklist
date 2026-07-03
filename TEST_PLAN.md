# Test Plan

## MVP-015

Goal: verify the UI/UX polish and local staff/admin operating model without changing business logic or claiming secure auth/cloud/Flash production success.

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
