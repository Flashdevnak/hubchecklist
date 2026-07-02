# Test Plan

## MVP-013

Goal: prepare the app for real mobile testing and Android readiness without faking Android build success or cloud integrations.

## Commands Run

```bash
npm install
npx tsc -b
npm run build
npx cap sync android
npx cap doctor
.\android\gradlew.bat assembleDebug
```

## Results

- `npm install`: passed, with npm audit warnings.
- `npx tsc -b`: passed.
- `npm run build`: passed, with known Vite large chunk warning from XLSX/ZIP libraries.
- `npx cap sync android`: passed.
- `npx cap doctor`: passed.
- `.\android\gradlew.bat assembleDebug`: blocked because `JAVA_HOME` is not set and `java` is not on `PATH`.

## Route Render Checklist

All routes are registered in `src/App.tsx`:

- LoginPage
- ResponsibleProfilePage
- FullScreenScanPage
- ScanPreviewPage
- FlashSearchPage
- VehicleChecklistPage
- EditRecordPage
- TodayDashboardPage
- ExportPage
- BackupCleanupPage
- AdminSettingsPage
- UserManagementPage

Expected behavior:

- Missing Supabase env should not crash.
- Missing R2 endpoint should not crash.
- No responsible profile should show an actionable empty/error state.
- No vehicle records/photos/audit history should show empty states, not crashes.

## Local End-To-End Flow

Use [FLOW_QA_CHECKLIST.md](docs/FLOW_QA_CHECKLIST.md) for step-by-step validation with:

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

Use [ANDROID_DEVICE_TEST.md](docs/ANDROID_DEVICE_TEST.md). Real device validation remains required after Java/Android SDK are installed.

## Safety Review

- No Firebase added.
- No paid cloud required.
- No R2 secrets exposed in frontend.
- No fake Supabase sync success.
- No fake R2 upload/delete success.
- No fake Flash extraction success.
- Business records are not hard-deleted.
- Cleanup only removes confirmed backed-up local photo payloads.
