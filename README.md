# Hub Vehicle Proof Capture

Mobile-first project foundation for Hub vehicle proof capture.

MVP-012 adds Backup Reminder + Cleanup Guard. It warns about estimated photo storage growth, generates backup ZIPs through the MVP-011 export service, records local backup/cleanup job history, requires user backup confirmation, and only cleans local photo payloads that are confirmed backed up. It does **not** implement production R2 delete backend, cloud cleanup success, Android final QA, app store build, or storage billing automation.

## MVP-012 Behavior

- BackupCleanupPage is a working page, no longer a placeholder.
- Storage usage is estimated from local photo metadata and labelled as an estimate, not exact cloud billing data.
- Warning levels use a 10 GB local free-tier reference: normal, yellow, orange, red, critical.
- Backup flow uses the existing MVP-011 XLSX/ZIP export service.
- Backup jobs are stored in `hubchecklist.backupJobs` with statuses `DRAFT`, `GENERATED`, `CONFIRMED`, `FAILED`.
- Backup is marked `GENERATED` after ZIP generation succeeds.
- Photos and records are marked backed up only after the user clicks confirmation that the backup file was saved.
- Cleanup jobs are stored in `hubchecklist.cleanupJobs` with statuses `DRAFT`, `COMPLETED`, `PARTIAL`, `FAILED`.
- Cleanup only lists photos with `backedUp = true`, a `backupId`, and a confirmed backup job.
- Cleanup requires the confirmation phrase `ลบรูปที่สำรองแล้ว`.
- Cleanup removes local compressed image payloads when present, keeps photo metadata, and never deletes vehicle records, route rows, or audit history.
- R2 cloud deletion is not faked. When no delete endpoint exists, the UI states cleanup is local-only.
- Dashboard storage card shows backup warning, not-backed-up photos, eligible cleanup count, and a link to Backup/Cleanup Guard.

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
13. MVP-013 Final Android QA and device readiness

Production R2 backend, cloud delete automation, app store build, and billing automation remain future work.
