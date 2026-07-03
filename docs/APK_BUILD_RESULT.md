# APK Build Result

## MVP-014 Result

Date: 2026-07-03

## Java

JDK path checked:

```text
C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot
```

Java result when called directly:

```text
openjdk version "17.0.19" 2026-04-21
OpenJDK Runtime Environment Temurin-17.0.19+10 (build 17.0.19+10)
OpenJDK 64-Bit Server VM Temurin-17.0.19+10 (build 17.0.19+10, mixed mode, sharing)
```

Current shell note:

- Initial shell had no `JAVA_HOME`.
- Initial shell had no `java` on `PATH`.
- Build commands were run with `JAVA_HOME` set for the current process:

```powershell
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
```

## Android SDK

Checked paths:

```text
C:\Users\myhou\AppData\Local\Android\Sdk
C:\Android\Sdk
C:\Program Files\Android\Android Studio
C:\Program Files (x86)\Android\android-sdk
```

Result:

```text
Android SDK not found at checked paths.
```

## local.properties

`android/local.properties` was not created because the Android SDK path does not exist locally.

If Android SDK is installed at the expected path, create:

```text
android/local.properties
```

with:

```properties
sdk.dir=C:/Users/myhou/AppData/Local/Android/Sdk
```

`android/local.properties` is intentionally ignored by Git and should not be committed.

## Commands Run

```powershell
npm.cmd install
npx.cmd tsc -b
npm.cmd run build
npx.cmd cap doctor
npx.cmd cap sync android
.\android\gradlew.bat -p android assembleDebug
```

## Build Result

Passed:

- `npm.cmd install`
- `npx.cmd tsc -b`
- `npm.cmd run build`
- `npx.cmd cap doctor`
- `npx.cmd cap sync android`

Blocked:

- `.\android\gradlew.bat -p android assembleDebug`

Exact blocker:

```text
SDK location not found. Define a valid SDK location with an ANDROID_HOME environment variable or by setting the sdk.dir path in your project's local properties file at 'C:\Users\myhou\Desktop\Agent Codex\hubchecklist\android\local.properties'.
```

## APK Path

APK was not generated because Android SDK is missing.

Expected APK path after successful build:

```text
android/app/build/outputs/apk/debug/app-debug.apk
C:\Users\myhou\Desktop\Agent Codex\hubchecklist\android\app\build\outputs\apk\debug\app-debug.apk
```

## Android SDK Setup

Install Android Studio, then open:

```text
Android Studio -> File -> Settings -> Appearance & Behavior -> System Settings -> Android SDK
```

Install:

- Android SDK Platform
- Android SDK Build-Tools
- Android SDK Platform-Tools
- Android SDK Command-line Tools

Then set current-process variables or user environment variables:

```powershell
$env:ANDROID_HOME='C:\Users\myhou\AppData\Local\Android\Sdk'
$env:ANDROID_SDK_ROOT='C:\Users\myhou\AppData\Local\Android\Sdk'
```

Create `android/local.properties` with the forward-slash path shown above, then rerun:

```powershell
.\android\gradlew.bat -p android assembleDebug
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
