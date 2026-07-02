# Project Specification

## Final direction

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

## Critical rules

- Do not require daily import.
- Do not assume number of vehicles.
- Do not assume route is fixed every day.
- Records are created from actual scan only.
- Web mobile mode cannot guarantee auto-fill on external Flash page; Android WebView is required for automation.
- Free-tier online architecture uses Supabase Free + Cloudflare R2 Free.
- Photos must be compressed before cloud upload.
- Backup/Cleanup Guard prevents unexpected cloud cost.

## MVP-002 database/auth foundation

MVP-002 establishes the Supabase foundation only.

Implemented foundation:

- Supabase client setup with safe missing-env behavior.
- `public.users` profile table linked to `auth.users`.
- Branch-aware role model: `staff`, `supervisor`, `admin`.
- Tables for branches, responsible profiles, vehicle records, route rows, vehicle photos, edit history, backup jobs, cleanup jobs, storage usage snapshots, and app settings.
- RLS draft policies where staff can view/create their own records, supervisors can view branch records, and admins can manage all records.
- `.env.example` documents frontend Supabase values and server-only placeholders.

## MVP-004 QR scan UI foundation

MVP-004 implements the mobile QR scan UI foundation only.

Implemented foundation:

- Full-screen-style scan page with a large camera placeholder frame.
- Manual QR URL or raw barcode input.
- Flash proof URL parsing from the last URL path segment.
- `sourceUrl` and `vehicleBarcode` preview.
- Vehicle barcode uppercase normalization.
- Required alphanumeric validation with warning-only handling for unusual future formats.
- Active responsible profile display when available.
- Warning and navigation to Responsible Profile when no active profile is selected.
- Local scan draft persistence with `sourceUrl`, `vehicleBarcode`, `scannedAt`, responsible employee code, responsible display name, and branch.
- ScanPreviewPage display of scan draft and an explicit MVP-005 OCR note.

Still placeholders after MVP-004:

- Real camera QR scanner integration.
- OCR phone reading.
- Android WebView Flash automation.
- Flash route/status extraction.
- Supabase vehicle record creation.
- R2 upload.
- Photo upload.
- Exact 21.6 export execution.
- Backup execution.
- Cleanup execution.

## Exact backup requirement

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
