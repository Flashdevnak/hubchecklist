# APK Build Result

## RESET-005 Result

RESET-005 adds Admin PIN protection, Web/PWA icon assets, Android launcher icon assets, responsive hardening, and Android location permissions for GPS metadata.

Expected APK after build:

```text
C:\Users\myhou\Desktop\Agent Codex\hubchecklist\android\app\build\outputs\apk\debug\app-debug.apk
```

Icon assets updated:

```text
android/app/src/main/res/mipmap-mdpi/ic_launcher.png
android/app/src/main/res/mipmap-hdpi/ic_launcher.png
android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
```

Fresh RESET-005 verification on 2026-07-16:

```text
npm.cmd install: PASSED
npx.cmd tsc -b: PASSED
npm.cmd run build: PASSED
npx.cmd cap sync android: PASSED
.\gradlew.bat assembleDebug: PASSED
```

Android result:

```text
BUILD SUCCESSFUL in 8s
82 actionable tasks: 23 executed, 59 up-to-date
```

PWA result:

```text
dist/ generated with manifest.webmanifest and icons/
```

## RESET-004 Result

RESET-004 adds optional Google Sheets sync and keeps the same debug APK path:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Required verification commands:

```powershell
npm.cmd install
npx.cmd tsc -b
npm.cmd run build
npx.cmd cap sync android
cd android
.\gradlew.bat assembleDebug
```

Google Apps Script live sync is not part of APK build success. It must be deployed and tested separately with `APP_SHARED_SECRET`.

Fresh RESET-004 verification on 2026-07-16:

```text
npm.cmd install: PASSED
npx.cmd tsc -b: PASSED
npm.cmd run build: PASSED
npx.cmd cap sync android: PASSED
.\gradlew.bat assembleDebug: PASSED
```

Android result:

```text
BUILD SUCCESSFUL in 7s
82 actionable tasks: 23 executed, 59 up-to-date
```

APK generated:

```text
C:\Users\myhou\Desktop\Agent Codex\hubchecklist\android\app\build\outputs\apk\debug\app-debug.apk
```

## RESET-003 Result

Date: 2026-07-03

## Java

Java version:

```text
OpenJDK 17.0.19
```

`JAVA_HOME`:

```text
C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot
```

Java result:

```text
openjdk version "17.0.19" 2026-04-21
OpenJDK Runtime Environment Temurin-17.0.19+10 (build 17.0.19+10)
OpenJDK 64-Bit Server VM Temurin-17.0.19+10 (build 17.0.19+10, mixed mode, sharing)
```

## Android SDK

Android SDK path:

```text
C:\Users\myhou\AppData\Local\Android\Sdk
```

Current-process environment used for verification:

```powershell
$env:ANDROID_HOME='C:\Users\myhou\AppData\Local\Android\Sdk'
$env:ANDROID_SDK_ROOT='C:\Users\myhou\AppData\Local\Android\Sdk'
```

## local.properties

`android/local.properties` exists locally and is intentionally ignored by Git.

Content:

```properties
sdk.dir=C:/Users/myhou/AppData/Local/Android/Sdk
```

Do not commit `android/local.properties` because it is machine-specific.

## Commands Run

From project root:

```powershell
npm.cmd install
npx.cmd tsc -b
npm.cmd run build
npx.cmd cap sync android
```

From `android`:

```powershell
.\gradlew.bat assembleDebug
```

## Build Result

PASSED. RESET-003 completed TypeScript, web build, Capacitor sync, and Android `assembleDebug` on 2026-07-16. The APK remains `android/app/build/outputs/apk/debug/app-debug.apk`.

Manual build result reported after Android Studio SDK installation:

```text
BUILD SUCCESSFUL in 3m 30s
82 actionable tasks: 82 executed
```

Fresh verification in this session:

```text
RESET-001: assembleDebug completed successfully on 2026-07-06
```

Passed:

- `npm.cmd install`
- `npx.cmd tsc -b`
- `npm.cmd run build`
- `npx.cmd cap sync android`
- `.\gradlew.bat assembleDebug`

MVP-017 keeps Android camera permission for the real scanner:

```text
android.permission.CAMERA
```

## APK Path

Relative path:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Full Windows path:

```text
C:\Users\myhou\Desktop\Agent Codex\hubchecklist\android\app\build\outputs\apk\debug\app-debug.apk
```

## Android Project Checks

- Package/application ID: `com.flashops.hubchecklist`
- `FlashProofWebViewPlugin.java` exists.
- `MainActivity.java` registers `FlashProofWebViewPlugin`.
- `android.permission.INTERNET` exists in `AndroidManifest.xml`.
- Flash allowlist remains restricted to:

```text
https://api.flashexpress.com/gw/nws/web/proof/go/
```

## Not Yet Verified

The debug APK build is complete, but production readiness is not claimed. Real camera scanning and Flash live automation still require physical Android device testing against the real Flash proof page.
