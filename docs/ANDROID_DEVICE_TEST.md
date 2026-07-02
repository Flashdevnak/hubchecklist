# Android Device Test Guide

## Purpose

Use this guide for real-device validation of the HubChecklist Android app. Local web QA passes, but APK build and device testing require a Windows Android toolchain.

## Current Local Toolchain Result

- `npx cap sync android`: passed.
- `npx cap doctor`: passed for Capacitor Android project checks.
- `android/gradlew.bat assembleDebug`: blocked locally because `JAVA_HOME` is not set and `java` is not on `PATH`.

## Prerequisites

- Windows 10 or 11
- Android Studio
- Android SDK Platform for a modern API level
- Android SDK Platform-Tools
- JDK 17 or newer
- USB cable for device testing
- Test phone/tablet:
  - Samsung S23 FE
  - Galaxy Tab A7 Lite
  - iPad browser fallback for PWA behavior

## Android Studio Setup

1. Install Android Studio from the official Android developer site.
2. Open Android Studio.
3. Install the Android SDK, SDK Platform-Tools, and Gradle components prompted by Android Studio.
4. Open the project folder `android/`.
5. Let Android Studio run Gradle sync.

## JDK and JAVA_HOME

1. Install JDK 17 or newer.
2. Set `JAVA_HOME` to the JDK install directory, for example:

```powershell
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-17", "User")
```

3. Add `%JAVA_HOME%\bin` to the user `Path`.
4. Restart PowerShell and verify:

```powershell
java -version
echo $env:JAVA_HOME
```

## Build Commands

From the repository root:

```powershell
npm install
npm run build
npx cap sync android
.\android\gradlew.bat assembleDebug
```

If Gradle build succeeds, the debug APK is normally under:

```text
android/app/build/outputs/apk/debug/
```

## Connect Phone

1. Enable Developer Options on Android.
2. Enable USB debugging.
3. Connect the phone by USB.
4. Accept the trust prompt on the phone.
5. In Android Studio, select the device and run the app.

## Flash WebView Test

1. Create/select responsible profile:
   - employeeCode: `25845`
   - displayName: `Tui`
   - branch: `BNAK`
2. Scan or enter:
   - `https://api.flashexpress.com/gw/nws/web/proof/go/NAK1R7XJ45`
3. Confirm preview with phone:
   - `0643042911`
4. Open FlashSearchPage.
5. On Android app mode, test WebView auto-fill.
6. Confirm only `https://api.flashexpress.com/gw/nws/web/proof/go/` is allowed.
7. Confirm errors are shown clearly for invalid URL, invalid phone, timeout, or network failure.

## Known Limitations

- PWA/browser mode cannot auto-fill a cross-site Flash page; it must show the manual fallback.
- Real Flash extraction requires live site behavior and real Android device validation.
- Production R2 backend and cloud delete are not implemented.
- App store release signing is not part of MVP-013.
