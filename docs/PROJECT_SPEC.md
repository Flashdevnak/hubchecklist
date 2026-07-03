# Project Specification

## MVP-014 Android APK Build and Real Device QA Readiness

MVP-014 verifies local Android APK build readiness. It checks Java, searches for Android SDK on Windows, documents the correct ignored `android/local.properties` content, runs the required web and Capacitor checks, attempts the Android debug build with the correct Gradle invocation, and prepares real device QA documentation.

## Verified Locally

- Java exists at `C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot`.
- OpenJDK 17.0.19 works when called directly and when `JAVA_HOME`/`PATH` are set for the current process.
- `npm.cmd install` passes.
- `npx.cmd tsc -b` passes.
- `npm.cmd run build` passes.
- `npx.cmd cap doctor` passes.
- `npx.cmd cap sync android` passes.

## Android Build Status

Android debug APK build is blocked locally because Android SDK is not installed/configured at the expected Windows location.

Checked paths:

```text
C:\Users\myhou\AppData\Local\Android\Sdk
C:\Android\Sdk
C:\Program Files\Android\Android Studio
C:\Program Files (x86)\Android\android-sdk
```

Correct build command from project root:

```powershell
.\android\gradlew.bat -p android assembleDebug
```

Exact blocker:

```text
SDK location not found. Define a valid SDK location with an ANDROID_HOME environment variable or by setting the sdk.dir path in your project's local properties file at 'C:\Users\myhou\Desktop\Agent Codex\hubchecklist\android\local.properties'.
```

Expected ignored local config after Android SDK installation:

```properties
sdk.dir=C:/Users/myhou/AppData/Local/Android/Sdk
```

Expected APK path after successful build:

```text
android/app/build/outputs/apk/debug/app-debug.apk
C:\Users\myhou\Desktop\Agent Codex\hubchecklist\android\app\build\outputs\apk\debug\app-debug.apk
```

## Android Project Settings

- Package/application ID: `com.flashops.hubchecklist`
- Plugin: `FlashProofWebViewPlugin`
- Registered in `MainActivity`
- Permission: `android.permission.INTERNET`
- Allowed host: `api.flashexpress.com`
- Allowed path: `/gw/nws/web/proof/go/`

## Android WebView Safety Review

- Blocks navigation outside the allowed Flash proof URL.
- Validates Thai phone format before WebView automation.
- Uses timeout and error responses for network/loading/extraction failures.
- PWA/browser fallback remains honest and does not claim cross-site automation.

## Device QA Required

Real device validation is still required for:

- Samsung S23 FE
- Galaxy Tab A7 Lite
- iPad browser fallback
- Desktop browser

See:

- `docs/ANDROID_DEVICE_TEST.md`
- `docs/FLOW_QA_CHECKLIST.md`
- `docs/DEPLOYMENT_NOTES.md`
- `docs/APK_BUILD_RESULT.md`
- `docs/REAL_DEVICE_TEST_RESULT.md`

## Safety Constraints

- No Firebase.
- No paid cloud requirement.
- No R2 secrets in frontend.
- No fake Supabase sync success.
- No fake R2 upload/delete success.
- No fake Flash extraction success.
- No business record hard delete.
- Cleanup only removes confirmed backed-up local photo payloads.

## Remaining Production Tasks

- Real Android device QA.
- Android release signing.
- App store build/release process.
- Production R2 signed upload backend.
- Production R2 delete backend.
- Production Supabase sync hardening.
- Storage billing automation or real cloud usage reporting.
