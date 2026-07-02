# Hub Vehicle Proof Capture

Mobile-first project foundation for Hub vehicle proof capture.

MVP-008 adds checklist photo capture/upload foundation, client-side compression, local photo metadata, honest R2 signed-upload behavior, and photo completion status logic. It does **not** implement final Excel export, backup, cleanup, or production storage billing automation.

## MVP-008 Behavior

- Required photos come from record `checklistType`.
- `NORMAL_ROUTE`: `loadingPhoto`, `dropPhotoAfterDeparture`.
- `MULTI_DROP`: `branchDropPhoto1`, `branchDropPhoto2`, `dropPhotoAfterDeparture`.
- Images are compressed in the browser with canvas before saving or upload attempt.
- Local photo metadata is stored in `hubchecklist.vehiclePhotos`.
- Compressed preview data is stored locally for MVP use.
- If `VITE_R2_SIGNED_UPLOAD_ENDPOINT` is missing, the app stays in local-only mode and shows `เก็บรูปในเครื่อง / ยังไม่ได้เชื่อม R2`.
- Frontend never uses R2 secret keys.
- Upload status is only `UPLOADED` after a signed upload URL flow returns and the upload succeeds.
- Record status changes from `READY_FOR_PHOTO` to `PENDING_PHOTO`, then `COMPLETE` when all required photos exist.
- `VOIDED` records stay unchanged.

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

Export, backup, and cleanup remain future MVPs.
