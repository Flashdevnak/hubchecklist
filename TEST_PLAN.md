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
- Confirm OCR, Android WebView, R2 upload, photo upload, export, backup, and cleanup remain placeholders.

## MVP-004

Goal: prove the QR scan mobile UI foundation can parse Flash proof URLs and raw barcodes without claiming real camera scanning, OCR, Flash automation, uploads, export, backup, or cleanup are complete.

Commands:

```bash
npm install
npx tsc -b
npm run build
```

Manual checks:

- Open the Scan page.
- Confirm the scan frame is visually large and mobile-first.
- With no active responsible profile, confirm the warning says `กรุณาเลือกผู้รับผิดชอบก่อนเริ่มสแกน`.
- Confirm the warning has a button to the Responsible Profile page.
- Enter `https://api.flashexpress.com/gw/nws/web/proof/go/NAK1R7XJ45`.
- Confirm `vehicleBarcode` displays `NAK1R7XJ45`.
- Enter raw barcode `NAK1R7XJ45`.
- Confirm it is accepted as `vehicleBarcode`.
- Enter invalid input with symbols and confirm a Thai error appears.
- Confirm Next is disabled when barcode is invalid or profile is missing.
- With an active profile in localStorage, confirm the responsible profile appears in the result preview.
- Confirm a valid scan draft persists after refresh.
- Continue to ScanPreviewPage and confirm barcode, source URL, responsible profile, and the MVP-005 OCR note appear.
- Resize to Samsung S23 FE, Galaxy Tab A7 Lite, iPad browser fallback, and desktop widths.
- Confirm no horizontal overflow.
- Confirm camera QR scanning is described as a prepared integration, not a completed scanner.

## Future test areas

### QR camera integration

- Request camera permission.
- Decode QR from vehicle paper.
- Decode QR from a phone screen.
- Handle unsupported browser scanning with manual fallback.

### OCR phone

- Detect Thai 10-digit phone numbers.
- Allow manual edit.
- Show multiple phone candidates.
- Store raw OCR text.

### Android WebView Flash automation

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
