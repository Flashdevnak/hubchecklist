# Hub Vehicle Proof Capture

Mobile-first project foundation for Hub vehicle proof capture.

MVP-009 hardens edit, redo, void/restore, photo retake, status recalculation, dashboard indicators, and local audit history. It does **not** implement final Excel export exact 21.6, Backup ZIP, Cleanup Guard, production R2 backend, storage billing automation, or fake Flash/Supabase success.

## MVP-009 Behavior

- Manual record edits go through `updateRecordWithAudit`.
- Audit entries store `id`, `recordId`, `actionType`, `fieldName`, `oldValue`, `newValue`, `editedBy`, `editedAt`, `reason`, and `source`.
- Edit page supports safe updates for vehicle, phone, driver/company, route summary, branch endpoints, departure times, and `checklistType`.
- Important edits require a reason: `vehicleBarcode`, `driverPhone`, `checklistType`, and `routeSummary`.
- `checklistType` changes update `requiredPhotos` and recalculate status.
- Redo QR and redo phone flows preserve the current record, ask before replacing values, and write audit entries.
- Flash refetch mode compares old/new route, driver, company, and route row count before replacement.
- Void requires reason and confirmation, keeps photos/history, and does not hard-delete.
- Restore requires reason and recalculates the previous non-void status where possible.
- Photo retake records old/new photo metadata in audit history.
- Dashboard has active/voided/complete/pending filters plus manual edit and redo/refetch indicators.
- The app still works without Supabase env keys and without an R2 signed upload endpoint.

## Environment

Frontend placeholders:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_R2_PUBLIC_BASE_URL=
VITE_R2_SIGNED_UPLOAD_ENDPOINT=
```

Server-only placeholders, never expose in frontend:

```bash
SUPABASE_SERVICE_ROLE_KEY=placeholder-server-only-never-expose-to-frontend
R2_ACCOUNT_ID=placeholder-server-only
R2_ACCESS_KEY_ID=placeholder-server-only
R2_SECRET_ACCESS_KEY=placeholder-server-only
R2_BUCKET_VEHICLE_PHOTOS=placeholder-server-only
```

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

Export, backup, cleanup, production R2 backend, and storage billing automation remain future MVPs.
