# Project Specification

## MVP-014 Android APK Build and Real Device QA Readiness

MVP-014 verifies local Android APK build readiness. It checks Java, confirms Android SDK on Windows, documents the ignored `android/local.properties` content, runs the required web and Capacitor checks, builds the Android debug APK, and prepares real device QA documentation.

## Verified Locally

- Java exists at `C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot`.
- OpenJDK 17.0.19 works when called directly and when `JAVA_HOME`/`PATH` are set for the current process.
- Android SDK exists at `C:\Users\myhou\AppData\Local\Android\Sdk`.
- `android/local.properties` exists locally with `sdk.dir=C:/Users/myhou/AppData/Local/Android/Sdk` and is not committed.
- `npm.cmd install` passes.
- `npx.cmd tsc -b` passes.
- `npm.cmd run build` passes.
- `npx.cmd cap sync android` passes.
- `.\gradlew.bat assembleDebug` passes from the `android` folder.

## Android Build Status

Android debug APK build passes.

```text
BUILD SUCCESSFUL
```

Manual build result reported after Android Studio SDK installation:

```text
BUILD SUCCESSFUL in 3m 30s
82 actionable tasks: 82 executed
```

Fresh verification in this session:

```text
BUILD SUCCESSFUL in 11s
82 actionable tasks: 20 executed, 62 up-to-date
```

Correct build command from project root:

```powershell
.\android\gradlew.bat -p android assembleDebug
```

APK path:

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
- Flash live automation is not marked passed until physical Android testing against the real Flash proof page is completed.

## Device QA Required

Debug APK build is complete, but real device validation is still required for:

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
- Physical Android Flash WebView test against the real Flash proof page.
- Android release signing.
- App store build/release process.
- Production R2 signed upload backend.
- Production R2 delete backend.
- Production Supabase sync hardening.
- Storage billing automation or real cloud usage reporting.
