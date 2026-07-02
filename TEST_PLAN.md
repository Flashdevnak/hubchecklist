# Test Plan

## MVP-001

Goal: prove the project foundation can install, build, and render placeholder pages clearly.

Commands:

```bash
npm install
npm run build
npm run dev
```

Manual checks:

- Open Dashboard page.
- Navigate to all placeholder pages.
- Resize to mobile width.
- Confirm no horizontal overflow.
- Confirm placeholders do not pretend to work.

## MVP-002

Goal: prove the Supabase database/auth foundation exists without turning future workflows into fake completed features.

Commands:

```bash
npm install
npm run build
```

Static checks:

- Confirm `supabase/migrations/202606230001_mvp002_schema_auth_roles_rls.sql` exists.
- Confirm the migration creates all MVP-002 tables.
- Confirm role enum includes `staff`, `supervisor`, and `admin`.
- Confirm RLS is enabled and policies cover staff own records, supervisor branch records, and admin manage-all access.
- Confirm `.env.example` includes Supabase frontend variables and server-only placeholders.

Manual checks:

- Run the app without Supabase env values.
- Confirm the UI shows `Supabase ยังไม่ได้ตั้งค่า`.
- Confirm the app does not crash or claim login success.
- Confirm Android WebView, R2 upload, photo upload, export, backup, and cleanup remain placeholders.

## MVP-004

Goal: prove the QR scan mobile UI foundation can parse Flash proof URLs and raw barcodes without claiming real camera scanning, Flash automation, uploads, export, backup, or cleanup are complete.

Commands:

```bash
npm install
npx tsc -b
npm run build
```

Manual checks:

- Open the Scan page.
- Confirm the scan frame is visually large and mobile-first.
- Enter `https://api.flashexpress.com/gw/nws/web/proof/go/NAK1R7XJ45`.
- Confirm `vehicleBarcode` displays `NAK1R7XJ45`.
- Enter raw barcode `NAK1R7XJ45`.
- Confirm it is accepted as `vehicleBarcode`.
- Confirm a valid scan draft persists after refresh.
- Continue to ScanPreviewPage.
- Confirm camera QR scanning is described as a prepared integration, not a completed scanner.

## MVP-005

Goal: prove the preview/edit screen can extract Thai mobile phone numbers from OCR/raw text, allow manual correction, and persist a confirmed preview draft without opening Flash or claiming WebView automation is complete.

Commands:

```bash
npm install
npx tsc -b
npm run build
```

Manual checks:

- Open ScanPreviewPage with no scan draft and confirm it warns the user and links back to Scan.
- Create or load a scan draft from the Scan page.
- Confirm ScanPreviewPage shows `vehicleBarcode`, `sourceUrl`, and responsible profile.
- Edit `vehicleBarcode` and `sourceUrl`.
- Choose/take an image in the OCR file input.
- Confirm the page says OCR engine is unavailable / not production-ready and does not fake success.
- Paste:

```text
บาร์โค้ดประจำตัวรถ: NAK1R7XJ45
เบอร์โทรศัพท์ของคนขับรถ: 0643042911
```

- Click `ดึงเบอร์จากข้อความ`.
- Confirm `driverPhone = 0643042911`.
- Paste `เบอร์โทร 064-304-2911` and confirm it extracts `0643042911`.
- Paste `โทร 064 304 2911 / สำรอง 0891234567`.
- Confirm candidates include `0643042911` and `0891234567`.
- Select one candidate and confirm it fills `driverPhone`.
- Enter an invalid phone and confirm a Thai validation error appears.
- Confirm the preview button is disabled while phone is invalid.
- Confirm a valid preview draft persists after refresh.
- Confirm the page says Flash auto-fill is MVP-006.
- Resize to Samsung S23 FE, Galaxy Tab A7 Lite, iPad browser fallback, and desktop widths.
- Confirm no horizontal overflow.

## MVP-006

Goal: prove the Android WebView Flash automation foundation exists, validates allowed domains, bridges structured results to React, and keeps browser/PWA behavior as honest manual fallback.

Commands:

```bash
npm install
npx tsc -b
npm run build
npx cap sync android
```

Static checks:

- Confirm `android/` project exists.
- Confirm `android/app/src/main/java/com/flashops/hubchecklist/FlashProofWebViewPlugin.java` exists.
- Confirm `MainActivity.java` registers `FlashProofWebViewPlugin`.
- Confirm the plugin only allows HTTPS `api.flashexpress.com` URLs containing `/gw/nws/web/proof/go/`.
- Confirm the plugin rejects unknown domains before opening WebView or injecting JavaScript.
- Confirm auto-fill/search/extraction uses `evaluateJavascript`.
- Confirm React bridge functions exist in `src/services/flashProofWebView.ts`.

Manual checks:

- Open FlashSearchPage with no confirmed preview draft and confirm it links back to Preview.
- Create a confirmed scan preview draft with source URL, vehicle barcode, and valid driver phone.
- Confirm FlashSearchPage shows source URL, vehicle barcode, driver phone, and responsible profile.
- In browser/PWA mode, confirm the page says web mode cannot auto-fill Flash automatically.
- Confirm copy phone button copies the driver phone.
- Confirm open Flash URL button opens the Flash URL manually.
- Confirm native auto-fill button is disabled in browser/PWA mode.
- Paste manual Flash raw text and confirm any saved result is labeled manual fallback/testing only.
- Confirm the page states vehicle record creation is MVP-007.
- Resize to Samsung S23 FE, Galaxy Tab A7 Lite, iPad browser fallback, and desktop widths.
- Confirm no horizontal overflow.

## Future Test Areas

### QR camera integration

- Request camera permission.
- Decode QR from vehicle paper.
- Decode QR from a phone screen.
- Handle unsupported browser scanning with manual fallback.

### OCR engine integration

- Run OCR against real paper photos.
- Report confidence when available.
- Keep manual correction always available.
- Never auto-confirm a low-confidence OCR result.

### Android WebView Flash automation

- Validate on a physical Android device against the live Flash page.
- Confirm phone input selectors still match live Flash markup.
- Confirm search button detection still matches live Flash markup.
- Confirm wrong phone/no result/timeouts return clear errors.
- Load only `api.flashexpress.com`.
- Auto-fill phone.
- Click search.
- Extract result table.
- Handle page changed / timeout / wrong phone.

### Responsible profile

- Create `25845 Tui`.
- Reuse saved profile.
- Store responsible code/display name on every record.
- Export filter by responsible code.

### Photo capture

- Capture required photo types.
- Compress before upload.
- Allow retake.
- Complete only when required photos are present.

### Exact 21.6 export

- Workbook includes sheet `21.6`.
- A:K, M:U, W:AE, AG:AQ blocks are correct.
- Photo cells link to exact vehicle photo.
- Photo Index sheet lists every photo.
- Missing photos display clearly.

### Backup cleanup guard

- Warnings at 60%, 75%, 85%, 95%.
- Backup ZIP includes workbook, photos, flash screenshots, manifest.
- Cleanup blocked before backup success.
- Metadata remains searchable after photo cleanup.
