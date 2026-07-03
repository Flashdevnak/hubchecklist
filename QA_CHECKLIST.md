# QA Checklist

## MVP-014 Required Checks

- [x] `npm install` passes
- [x] `npx tsc -b` passes
- [x] `npm run build` passes
- [x] `npx cap sync android` passes
- [x] `npx cap doctor` passes
- [x] Java 17 is installed at `C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot`
- [x] Java works when `JAVA_HOME` and `PATH` are set for the current process
- [x] Android SDK common paths were checked
- [ ] Android debug APK build passes on local machine
- [x] Android SDK build blocker is documented exactly
- [x] `android/local.properties` was not committed
- [x] Expected `android/local.properties` content is documented
- [x] Package name is `com.flashops.hubchecklist`
- [x] Android WebView plugin file exists
- [x] `FlashProofWebViewPlugin` is registered in `MainActivity`
- [x] `android.permission.INTERNET` exists
- [x] Flash WebView allowlist remains restricted to `https://api.flashexpress.com/gw/nws/web/proof/go/`
- [x] App works without Supabase env keys
- [x] App works without R2 signed upload endpoint
- [x] Real device QA checklist is updated
- [x] APK build result is documented
- [x] No fake APK success was added
- [x] No new product features were added

## Android SDK Result

Checked paths:

```text
C:\Users\myhou\AppData\Local\Android\Sdk
C:\Android\Sdk
C:\Program Files\Android\Android Studio
C:\Program Files (x86)\Android\android-sdk
```

Result: Android SDK was not found, so `android/local.properties` was not created.

## Android Build Blocker

Local `.\android\gradlew.bat -p android assembleDebug` result:

```text
SDK location not found. Define a valid SDK location with an ANDROID_HOME environment variable or by setting the sdk.dir path in your project's local properties file at 'C:\Users\myhou\Desktop\Agent Codex\hubchecklist\android\local.properties'.
```

Install Android Studio and Android SDK packages, then create ignored local config:

```properties
sdk.dir=C:/Users/myhou/AppData/Local/Android/Sdk
```

## Future QA gates

Every MVP must update this file before commit. If QA fails, do not mark complete.
