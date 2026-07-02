# Hub Vehicle Proof Capture

Mobile-first project foundation for Hub vehicle proof capture.

MVP-010 hardens the daily operations dashboard so supervisors can search, filter, group, sort, and monitor local hub work. It does **not** implement final Excel export exact 21.6, Backup ZIP, Cleanup Guard, production R2 backend, storage billing automation, or fake Flash/Supabase/R2 success.

## MVP-010 Behavior

- Dashboard summary cards show scanned records, photo status, voided records, edited records, redo/refetch records, local photos, uploaded photos, and upload failures.
- Responsible-person summary groups by employee code, display name, and branch; tapping a person filters the record list.
- Mobile-friendly filter chips cover active records, statuses, edited, redo/refetch, duplicate warning, local-only photos, and upload failed.
- Search covers vehicle barcode, driver phone/name, company, route summary, first/last branch, responsible profile, status, checklist type, and branch.
- Date filters support today, yesterday, last 7 days, custom work date, and all local records.
- Branch filter defaults to the active responsible profile branch when available and includes BNAK plus branches found in local records.
- Record cards show status, responsible profile, branch, checklist type, photo progress, edit/redo/void/duplicate/storage indicators, last update time, and action buttons.
- Sorting supports latest, oldest, status, responsible person, vehicle barcode, and missing photos first.
- Operational alerts highlight missing photos, voided today, edited today, upload failed, duplicate/conflict, missing responsible profile, missing phone, and missing barcode.
- Storage mode card shows Supabase/R2 configuration state, photo counts, failed uploads, and estimated local photo size.
- Empty states provide scan and responsible-profile shortcuts.
- Dashboard runs fully from local records, photos, and audit history without requiring Supabase or R2.

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
11. MVP-011 Export XLSX/ZIP with exact 21.6 layout

Export, backup, cleanup, production R2 backend, and storage billing automation remain future MVPs.
