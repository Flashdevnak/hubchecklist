# QA Checklist

## MVP-016 Required Checks

- [x] `npm install` passes
- [x] `npx tsc -b` passes
- [x] `npm run build` passes
- [x] `npx cap sync android` passes
- [x] Java 17 is installed at `C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot`
- [x] Java works when `JAVA_HOME` and `PATH` are set for the current process
- [x] Android SDK exists at `C:\Users\myhou\AppData\Local\Android\Sdk`
- [x] Android debug APK build passes on local machine
- [x] APK path is documented
- [x] `android/local.properties` was not committed
- [x] Android camera permission exists
- [x] Package name is `com.flashops.hubchecklist`
- [x] Android WebView plugin file exists
- [x] `FlashProofWebViewPlugin` is registered in `MainActivity`
- [x] `android.permission.INTERNET` exists
- [x] Flash WebView allowlist remains restricted to `https://api.flashexpress.com/gw/nws/web/proof/go/`
- [x] App works without Supabase env keys
- [x] App works without R2 signed upload endpoint
- [x] Scan page no longer shows generic Placeholder badge
- [x] Scan page opens real camera preview with `getUserMedia`
- [x] BarcodeDetector scan loop extracts QR/barcode when supported
- [x] Camera stops after successful scan
- [x] Test-mode camera warning was removed
- [x] Scan page has one scan-again/reset action
- [x] Missing responsible profile reason is visible before next step
- [x] Phone input appears on Scan page when QR has no driver phone
- [x] Driver phone cache is local-first by vehicle barcode
- [x] Cached phone is offered but remains editable
- [x] Responsible profile create/select/edit/delete flow is local-first
- [x] Staff navigation is simplified
- [x] Admin navigation is separate
- [x] Phone preview flow is clearer and advanced OCR is collapsible
- [x] Flash fallback/manual parser remains honest and advanced
- [x] Vehicle checklist photo progress is clearer
- [x] Export keeps exact 21.6 ZIP path and clearer steps
- [x] Backup/Cleanup guard remains intact
- [x] Supabase/R2 status is compact
- [x] No fake secure login was added
- [x] No fake driver phone extraction from QR was added
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
