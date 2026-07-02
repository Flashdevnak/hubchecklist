# Test Plan

## MVP-011

Goal: prove the app can create an audit-ready offline `backup.zip` with an exact `21.6` workbook layout, support sheets, manifest, and photo links without fake cloud or missing-photo success.

Commands:

```bash
npm install
npx tsc -b
npm run build
```

Manual checks:

- Open ExportPage and confirm it is a working export UI.
- Filter by date range, branch, responsible employee code/display name, status, barcode, include voided, and include local-only photos.
- Preview export summary and confirm record, photo, voided, missing-photo, and warning counts.
- Generate and download `backup.zip`.
- Extract ZIP and confirm `workbook.xlsx`, `backup-manifest.json`, `photos/`, and `flash-screenshots/` exist.
- Open `workbook.xlsx` and confirm sheet `21.6` is named exactly `21.6`.
- Confirm `21.6` has Main drop A:K, Main vehicle M:U, Extra vehicle W:AE, and Extra drop AG:AQ blocks.
- Confirm `NORMAL_ROUTE` records appear in M:U.
- Confirm `MULTI_DROP` records appear in A:K.
- Confirm photo cells link to matching files under `photos/YYYY-MM-DD/employeeCode_displayName/vehicleBarcode_recordId/`.
- Confirm missing photos show `ยังไม่มีรูป`.
- Confirm Photo Index includes each expected photo, relative path, linked 21.6 cell, existence flag, and missing reason.
- Confirm Route Detail includes route rows.
- Confirm Edit History includes audit entries.
- Confirm Voided Records includes voided records when `includeVoided` is checked.
- Confirm Backup Manifest sheet and `backup-manifest.json` include filters, counts, included record IDs, included photo IDs, missing photos, warnings, app version.
- Confirm local-only photos are exported when local compressed image data exists and includeLocalOnlyPhotos is checked.
- Confirm metadata-only photos without local data are reported missing, not faked.
- Confirm Flash screenshots/html are only included when local snapshot data exists.
- Confirm app works without Supabase env keys and without R2 signed upload endpoint.
- Confirm mobile layout has no horizontal overflow.
- Confirm Cleanup Guard and photo deletion are not implemented in this MVP.

## Future Test Areas

### MVP-012 Backup Reminder + Cleanup Guard

- Remind operators to export before cleanup.
- Block cleanup unless a valid backup package exists.
- Do not delete cloud/local photos before backup success.
