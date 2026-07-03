# Test Plan

## MVP-014

Goal: verify Android APK build readiness, record the successful debug APK build, and define the remaining real device checks without claiming Flash live automation before physical testing.

## Commands Run

```powershell
java -version
Write-Output "JAVA_HOME=$env:JAVA_HOME"
& "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot\bin\java.exe" -version
npm.cmd install
npx.cmd tsc -b
npm.cmd run build
npx.cmd cap sync android
cd android
.\gradlew.bat assembleDebug
```

## Results

- Java at `C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot`: passed with OpenJDK 17.0.19.
- Android SDK at `C:\Users\myhou\AppData\Local\Android\Sdk`: present.
- `android/local.properties`: present locally with `sdk.dir=C:/Users/myhou/AppData/Local/Android/Sdk`; ignored by Git.
- `npm.cmd install`: passed, with npm audit warnings.
- `npx.cmd tsc -b`: passed.
- `npm.cmd run build`: passed, with known Vite large chunk warning from XLSX/ZIP libraries.
- `npx.cmd cap sync android`: passed.
- `.\gradlew.bat assembleDebug`: passed from the `android` folder.
- APK generated at `android/app/build/outputs/apk/debug/app-debug.apk`.

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
