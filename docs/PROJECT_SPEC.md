# Project Specification

## MVP-011 Export XLSX/ZIP With Exact 21.6 Layout

MVP-011 creates an offline/free export package from local records, photos, and audit history. The export is audit-ready and links workbook photo cells to exact matching photo files inside the ZIP when local image data exists.

## ZIP Structure

```text
backup.zip
├─ workbook.xlsx
├─ photos/
├─ flash-screenshots/
└─ backup-manifest.json
```

## Workbook Sheets

`workbook.xlsx` contains:

- `21.6`
- `Route Detail`
- `Photo Index`
- `Edit History`
- `Backup Manifest`
- `Voided Records`

## 21.6 Sheet

The sheet name must be exactly `21.6`.

Column blocks:

- Main drop / รถหลักพ่วงสาขา: A:K
- Main vehicle / รถหลัก: M:U
- Extra vehicle / รถเสริม: W:AE
- Extra drop / รถเสริมพ่วงสาขา: AG:AQ

Current mapping:

- `NORMAL_ROUTE` exports to Main vehicle M:U.
- `MULTI_DROP` exports to Main drop A:K.
- Extra vehicle and extra drop headers are prepared but no records are faked into those blocks until checklist type expansion exists.

Photo cells:

- Link to relative paths under `photos/` when the local photo data exists.
- Show `ยังไม่มีรูป` when no photo exists.
- Show `รูปอยู่ในเครื่อง / ไม่พบไฟล์ใน export` when metadata exists but local image data is not available or local-only photos are excluded.
- Full-size images are not embedded to avoid huge XLSX files.

## Photo Folder Layout

```text
photos/
YYYY-MM-DD/
employeeCode_displayName/
vehicleBarcode_recordId/
loadingPhoto.jpg
dropPhotoAfterDeparture.jpg
branchDropPhoto1.jpg
branchDropPhoto2.jpg
```

Filenames are sanitized for Windows-safe ZIP extraction.

## Support Sheets

### Route Detail

One row per route row with work date, branch, responsible profile, vehicle barcode, record ID, route index, branch name, times, scanners, duration, distance, and seal numbers.

### Photo Index

One row per expected photo with:

- work date
- branch
- responsible profile
- vehicle barcode
- record ID
- checklist type
- photo type
- Thai photo label
- original filename
- exported filename
- relative path
- captured metadata
- upload status
- linked `21.6` cell
- exists-in-ZIP flag
- missing reason

### Edit History

One row per audit entry with record ID, vehicle barcode, action type, field, old value, new value, editor, timestamp, reason, and source.

### Voided Records

Voided records remain visible when included in export filters.

### Backup Manifest

The sheet and `backup-manifest.json` include:

- backup ID
- exported time
- exported by
- filters
- counts
- included record IDs
- included photo IDs
- missing photos
- warnings
- app version

## Export UI

ExportPage supports:

- date range
- branch
- responsible employee code
- responsible display name
- status
- vehicle barcode
- include voided
- include local-only photos
- export filename
- preview export summary
- included-record preview
- missing-photo preview
- ZIP generation and download

## Data Source Rules

- Use local vehicle records, vehicle photos, and audit history first.
- Work without Supabase env keys.
- Work without R2 signed upload endpoint.
- Do not fake missing photos.
- Do not fake Flash screenshots.
- Include Flash HTML snapshots only if local snapshot data exists.

## Still Placeholder After MVP-011

- Backup Reminder
- Cleanup Guard
- Production R2 backend
- Storage billing automation
- Cloud cleanup/delete flow
