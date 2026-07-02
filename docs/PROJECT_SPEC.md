# Project Specification

## Final Direction

Hub Vehicle Proof Capture is an Android-first mobile system with PWA fallback.

The real workflow is:

1. Staff login.
2. Staff select responsible profile, such as `25845 Tui`.
3. Staff scan QR from vehicle paper / phone screen.
4. App extracts barcode from Flash URL.
5. App reads driver phone by OCR or manual input.
6. Android WebView app auto-fills phone in Flash proof page.
7. App extracts vehicle route/status table.
8. App creates vehicle record on demand.
9. Staff take required photos.
10. Supervisor exports exact 21.6 workbook + photos ZIP backup.
11. Backup must succeed before cloud photo cleanup.

## Critical Rules

- Do not require daily import.
- Do not assume number of vehicles.
- Do not assume route is fixed every day.
- Records are created from actual scan only.
- Web mobile mode cannot guarantee auto-fill on external Flash page; Android WebView is required for automation.
- Free-tier online architecture uses Supabase Free + Cloudflare R2 Free.
- Photos must be compressed before cloud upload.
- Backup/Cleanup Guard prevents unexpected cloud cost.

## MVP-002 Database/Auth Foundation

MVP-002 establishes the Supabase foundation only.

Implemented foundation:

- Supabase client setup with safe missing-env behavior.
- `public.users` profile table linked to `auth.users`.
- Branch-aware role model: `staff`, `supervisor`, `admin`.
- Tables for branches, responsible profiles, vehicle records, route rows, vehicle photos, edit history, backup jobs, cleanup jobs, storage usage snapshots, and app settings.
- RLS draft policies where staff can view/create their own records, supervisors can view branch records, and admins can manage all records.
- `.env.example` documents frontend Supabase values and server-only placeholders.

## MVP-004 QR Scan UI Foundation

MVP-004 implements the mobile QR scan UI foundation only.

Implemented foundation:

- Full-screen-style scan page with a large camera placeholder frame.
- Manual QR URL or raw barcode input.
- Flash proof URL parsing from the last URL path segment.
- `sourceUrl` and `vehicleBarcode` preview.
- Vehicle barcode uppercase normalization.
- Required alphanumeric validation with warning-only handling for unusual future formats.
- Local scan draft persistence with `sourceUrl`, `vehicleBarcode`, `scannedAt`, responsible employee code, responsible display name, and branch.

## MVP-005 OCR Phone Preview/Edit Foundation

MVP-005 implements OCR phone text extraction and manual correction only.

Implemented foundation:

- ScanPreviewPage review/edit UI for `vehicleBarcode`, `sourceUrl`, responsible profile, and `driverPhone`.
- Paper image/file input for future OCR engine integration.
- Clear OCR status when a real OCR engine is unavailable.
- Raw OCR text paste/test mode.
- Thai mobile phone normalization and extraction from text.
- Validation requiring a 10-digit phone starting with `06`, `08`, or `09`.
- Multiple phone candidate selection.
- Manual correction before confirm.
- Local preview draft persistence with `sourceUrl`, `vehicleBarcode`, `driverPhone`, `ocrRawText`, `ocrConfidence`, responsible employee code, responsible display name, branch, `scannedAt`, and `phoneConfirmedAt`.
- Explicit next-step note: Flash page opening and automatic phone fill are MVP-006.

Still placeholders after MVP-005:

- Production OCR engine for images.
- Android WebView Flash automation.
- Flash route/status extraction.
- Supabase vehicle record creation.
- R2 upload.
- Photo upload.
- Exact 21.6 export execution.
- Backup execution.
- Cleanup execution.

## Exact Backup Requirement

Backup ZIP must contain:

```text
backup.zip
├─ workbook.xlsx
├─ photos/
├─ flash-screenshots/
└─ backup-manifest.json
```

`workbook.xlsx` must contain sheet `21.6` with original reference-style column blocks:

- A:K รถหลักพ่วงสาขา
- M:U รถหลัก
- W:AE รถเสริม
- AG:AQ รถเสริมพ่วงสาขา

Photo cells must hyperlink to the matching photo for the exact vehicle. Users must not manually hunt for photos.
