# QA Checklist

## RESET-001 Required Checks

- [x] One Android app / one APK only
- [x] Frontline mode is Today / Scan / Photos / My Work only
- [x] Backoffice mode exposes records/photos/export/backup/settings/audit-oriented tools
- [x] Central unified table template exists in `src/config/unifiedTableTemplate.ts`
- [x] Unified export sheet `21.6` uses the same 11-column header order
- [x] Column 5 `transferLoadRate` exists, is hidden from Frontline, and is editable in Backoffice
- [x] Column 9 `plannedDepartureTime` auto-fills from proof/OCR route data when possible
- [x] Column 10 `actualDepartureTime` is read-only in Frontline and captured from device time on save
- [x] QR/barcode/manual/OCR all feed one review row
- [x] OCR remains local/lazy-loaded and review-first
- [x] Multiple/uncertain phone candidates require staff selection
- [x] Sample 1 parser fixture returns `NAK1RK8Z54` / `0653762402`
- [x] Sample 2 parser fixture returns `NAK1RP4745` / `0981299480`
- [x] Frontline photo flow maps to branch photo 1, branch photo 2, outbound after release photo
- [x] No fake Flash/OCR/Supabase/R2 success added
- [ ] Physical Android device QA is still pending

## MVP-017 Required Checks

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
- [x] Staff Home can create/select active profile without leaving the Today screen
- [x] Staff bottom nav is Today / Scan / Photos / My Work
- [x] Scan page no longer shows generic Placeholder badge
- [x] Scan page opens real camera preview with `getUserMedia`
- [x] BarcodeDetector scan loop extracts QR/barcode when supported
- [x] Camera stops after successful scan
- [x] Manual QR/barcode input remains available
- [x] OCR image action is local/lazy-loaded and does not fake confidence or success
- [x] Scan page shows editable Review fields before create
- [x] Create record routes directly to Photos/checklist
- [x] Driver phone is optional; typed phone must still validate
- [x] Driver phone cache is local-first by vehicle barcode
- [x] Cached phone is offered but remains editable
- [x] Parser fixture exists for `NAK1RK8Z54`
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
- [x] No UI redesign or unrelated product feature was added

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
