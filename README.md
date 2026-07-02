# Hub Vehicle Proof Capture

Mobile-first project foundation for Hub vehicle proof capture.

MVP-011 adds an offline/free XLSX + ZIP export. The export package contains `workbook.xlsx`, `photos/`, `flash-screenshots/`, and `backup-manifest.json`. It does **not** implement Cleanup Guard, production R2 backend, storage billing automation, or fake missing photos/screenshots.

## MVP-011 Behavior

- ExportPage is a working export screen with filters for date range, branch, responsible person, status, vehicle barcode, voided records, and local-only photos.
- Users can preview export summary, included records, missing photos, and then generate/download `backup.zip`.
- `workbook.xlsx` includes sheets: `21.6`, `Route Detail`, `Photo Index`, `Edit History`, `Backup Manifest`, and `Voided Records`.
- Sheet `21.6` is named exactly `21.6` and contains A:K, M:U, W:AE, and AG:AQ blocks.
- `NORMAL_ROUTE` records export into the Main vehicle block M:U.
- `MULTI_DROP` records export into the Main drop block A:K.
- Extra vehicle and extra drop blocks are prepared with headers only until checklist type expansion.
- Photo cells link to the exact relative photo path inside `photos/` when local image data exists.
- Missing photo cells show `ยังไม่มีรูป` or `รูปอยู่ในเครื่อง / ไม่พบไฟล์ใน export`.
- Photo Index lists every expected/exported photo and the linked 21.6 cell.
- Route Detail lists route rows.
- Edit History lists audit entries.
- Voided Records keeps voided records visible when included.
- Backup Manifest sheet and `backup-manifest.json` include counts, filters, warnings, record IDs, photo IDs, and missing photos.
- Export uses local records/photos/audit history first and works without Supabase or R2.

## Export Dependencies

- `exceljs` creates workbook sheets and hyperlinks.
- `jszip` creates `backup.zip`.
- Native browser Blob download is used; no paid service or Firebase is used.

## Commands

```bash
npm install
npx tsc -b
npm run build
```

## MVP Roadmap

1. MVP-001 Project skeleton + PWA + Capacitor foundation
2. MVP-002 Supabase schema + auth + roles + RLS draft
3. MVP-003 Responsible profile
4. MVP-004 Full-screen QR scan mobile UI
5. MVP-005 OCR phone + preview/edit
6. MVP-006 Android WebView Flash automation
7. MVP-007 Vehicle record creation + duplicate handling
8. MVP-008 Checklist photos + compression + R2 upload foundation
9. MVP-009 Edit redo void audit hardening
10. MVP-010 Dashboard hardening and operational filters
11. MVP-011 Export XLSX/ZIP with exact 21.6 layout
12. MVP-012 Backup Reminder + Cleanup Guard

Cleanup Guard, production R2 backend, and storage billing automation remain future MVPs.
