# Test Plan

## MVP-012

Goal: prove backup reminders, backup job history, user confirmation, and cleanup guard protect local photo payloads without deleting business records or faking cloud deletion.

Commands:

```bash
npm install
npx tsc -b
npm run build
```

Manual checks:

- Open BackupCleanupPage and confirm storage summary is visible.
- Confirm estimated usage is labelled as an estimate from local data.
- Confirm warning levels change at 60%, 75%, 85%, and 95% of the 10 GB reference.
- Preview backup filters and included records/photos.
- Create Backup and confirm ZIP download is triggered.
- Confirm backup job appears as `GENERATED`.
- Confirm photos are not marked backed up before user confirmation.
- Click `ยืนยันว่าเก็บไฟล์ Backup แล้ว`.
- Confirm backup job changes to `CONFIRMED`.
- Confirm included photos have `backedUp = true` and `backupId`.
- Confirm included records keep metadata and get backup reference.
- Confirm cleanup preview lists only confirmed backed-up photos as eligible.
- Confirm unbacked-up photos are blocked.
- Try cleanup without confirmation phrase and confirm it fails.
- Type `ลบรูปที่สำรองแล้ว` and run cleanup.
- Confirm local image payload is removed only when real local data exists.
- Confirm photo metadata remains.
- Confirm vehicle records, route rows, and audit history remain searchable.
- Confirm cleanup job history is visible.
- Confirm audit-like entries are created for backup confirmation and cleanup.
- Confirm Dashboard storage card links to BackupCleanupPage.
- Confirm app works without Supabase keys and without R2 signed upload/delete endpoint.
- Confirm no UI claims R2 cloud delete success.
- Confirm mobile layout has no horizontal overflow.

## Future Test Areas

### MVP-013 Final Android QA and device readiness

- Device smoke test on Samsung S23 FE, Galaxy Tab A7 Lite, and iPad browser fallback.
- Android WebView flow readiness checks.
- Final offline/local-mode checks.
