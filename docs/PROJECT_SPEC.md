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
