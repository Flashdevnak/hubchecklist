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
- [x] Android SDK exists at `C:\Users\myhou\AppData\Local\Android\Sdk`
- [x] Android debug APK build passes on local machine
- [x] APK path is documented
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
- [ ] Real device Flash WebView test passes
- [x] Real device Flash WebView test remains marked pending
- [x] No new product features were added

## Android SDK Result

Confirmed path:

```text
C:\Users\myhou\AppData\Local\Android\Sdk
```

Result: Android SDK was found at `C:\Users\myhou\AppData\Local\Android\Sdk`.

## Android Build Result

Local `.\gradlew.bat assembleDebug` result from `android`:

```text
BUILD SUCCESSFUL
```

APK path:

```text
C:\Users\myhou\Desktop\Agent Codex\hubchecklist\android\app\build\outputs\apk\debug\app-debug.apk
```

## Future QA gates

Every MVP must update this file before commit. If QA fails, do not mark complete.
