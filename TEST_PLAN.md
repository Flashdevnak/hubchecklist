# Test Plan

## MVP-014

Goal: verify Android APK build readiness, detect local Java/Android SDK setup, run the required web and Capacitor checks, attempt the correct Gradle build, and document the exact result without faking APK success.

## Commands Run

```powershell
java -version
Write-Output "JAVA_HOME=$env:JAVA_HOME"
& "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot\bin\java.exe" -version
npm.cmd install
npx.cmd tsc -b
npm.cmd run build
npx.cmd cap doctor
npx.cmd cap sync android
.\android\gradlew.bat -p android assembleDebug
```

## Results

- Initial shell `java -version`: failed because `java` was not on `PATH`.
- Initial shell `JAVA_HOME`: empty.
- Direct Java check at `C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot`: passed with OpenJDK 17.0.19.
- `npm.cmd install`: passed, with npm audit warnings.
- `npx.cmd tsc -b`: passed.
- `npm.cmd run build`: passed, with known Vite large chunk warning from XLSX/ZIP libraries.
- `npx.cmd cap doctor`: passed.
- `npx.cmd cap sync android`: passed.
- `.\android\gradlew.bat -p android assembleDebug`: blocked because Android SDK is not installed/configured.

## Android Project Checks

- Package/application ID: `com.flashops.hubchecklist`
- Android WebView plugin file: exists
- `FlashProofWebViewPlugin` registration: exists in `MainActivity`
- `android.permission.INTERNET`: exists
- Flash allowlist: restricted to `https://api.flashexpress.com/gw/nws/web/proof/go/`

## Exact Android Blocker

```text
SDK location not found. Define a valid SDK location with an ANDROID_HOME environment variable or by setting the sdk.dir path in your project's local properties file at 'C:\Users\myhou\Desktop\Agent Codex\hubchecklist\android\local.properties'.
```

Expected ignored local config after Android SDK installation:

```properties
sdk.dir=C:/Users/myhou/AppData/Local/Android/Sdk
```

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

Use [ANDROID_DEVICE_TEST.md](docs/ANDROID_DEVICE_TEST.md). Real device validation remains required after Android SDK is installed and the APK is generated.

## Safety Review

- No Firebase added.
- No paid cloud required.
- No R2 secrets exposed in frontend.
- No fake Supabase sync success.
- No fake R2 upload/delete success.
- No fake Flash extraction success.
- Business records are not hard-deleted.
- Cleanup only removes confirmed backed-up local photo payloads.
