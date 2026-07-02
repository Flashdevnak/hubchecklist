# Project Specification

## MVP-012 Backup Reminder + Cleanup Guard

MVP-012 protects operators from storage growth and careless deletion. It guides backup export, records local backup history, requires user confirmation, and only cleans local photo payloads that are confirmed backed up.

## Local Storage Keys

- Backup jobs: `hubchecklist.backupJobs`
- Cleanup jobs: `hubchecklist.cleanupJobs`
- Vehicle photos: `hubchecklist.vehiclePhotos`
- Vehicle records: `hubchecklist.vehicleRecords`
- Audit history: `hubchecklist.vehicleRecordEditHistory`

## Storage Warning

Usage is estimated from local photo metadata `sizeBytes`; it is not exact cloud billing data.

Reference limit:

- 10 GB

Warning levels:

- 0-59%: normal
- 60-74%: yellow, `ควรเริ่มสำรองข้อมูล`
- 75-84%: orange, `แนะนำให้ Export Backup`
- 85-94%: red, `ควรสำรองและเตรียมลบรูปเก่า`
- 95%+: critical, `ต้อง Backup และ Cleanup ก่อนเพิ่มรูปจำนวนมาก`

## Backup Flow

1. User chooses backup filters.
2. System previews records/photos using the MVP-011 export service.
3. User clicks Create Backup.
4. System generates and downloads ZIP.
5. Backup job is stored as `GENERATED`.
6. Browser cannot verify that the file was actually kept, so user must click confirmation.
7. Only after confirmation:
   - Backup job becomes `CONFIRMED`.
   - Included photos are marked `backedUp = true`.
   - Included photos receive `backupId`.
   - Included records receive backup reference.
   - Audit-like entries are created.

Backup job statuses:

- `DRAFT`
- `GENERATED`
- `CONFIRMED`
- `FAILED`

## Cleanup Guard

Cleanup can only target photos where:

- `backedUp = true`
- `backupId` exists
- matching backup job status is `CONFIRMED`
- `localCleaned` is not already true

Cleanup requires the confirmation phrase:

```text
ลบรูปที่สำรองแล้ว
```

Cleanup removes only real local compressed image payloads. It keeps:

- vehicle records
- route rows
- audit history
- photo metadata
- backup references

For MVP local mode:

- Remove `localStorage` photo blobs when present.
- Clear `localObjectUrl`.
- Set `localCleaned`, `cleanedAt`, `cleanedBy`, and `cleanupJobId`.
- Do not set `cloudDeleted = true` unless a future real cloud delete succeeds.
- Do not fake R2 deletion.

Cleanup job statuses:

- `DRAFT`
- `COMPLETED`
- `PARTIAL`
- `FAILED`

## Blocking Messages

The UI must make these rules clear:

- `ยังลบไม่ได้ เพราะยังไม่ได้ Backup`
- `ต้องยืนยันว่าเก็บไฟล์ Backup แล้วก่อน`
- `รายการนี้ถูกสำรองแล้ว สามารถ Cleanup รูปได้`
- `ระบบจะไม่ลบข้อมูลรถและประวัติการแก้ไข`
- R2 deletion is not connected; MVP cleanup is local-only.

## Dashboard Integration

TodayDashboardPage storage card shows:

- backup warning level
- photos not backed up
- photos eligible for cleanup
- link to BackupCleanupPage

## Still Placeholder After MVP-012

- Production R2 delete backend
- Real cloud cleanup success
- Android final QA
- App store build
- Storage billing automation
