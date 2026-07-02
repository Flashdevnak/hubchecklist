# Test Plan

## MVP-008

Goal: prove required checklist photos can be captured/uploaded, compressed, stored locally, and used to update record photo completion status without faking R2 upload success.

Commands:

```bash
npm install
npx tsc -b
npm run build
```

Manual checks:

- Create/open a `NORMAL_ROUTE` vehicle record.
- Confirm required photos are `loadingPhoto` and `dropPhotoAfterDeparture`.
- Add a photo for one required type.
- Confirm preview displays and original/compressed sizes are shown.
- Confirm record status becomes `PENDING_PHOTO`.
- Add the second required photo.
- Confirm record status becomes `COMPLETE`.
- Retake a photo and confirm preview/metadata updates.
- Create/open a `MULTI_DROP` record.
- Confirm required photos are `branchDropPhoto1`, `branchDropPhoto2`, and `dropPhotoAfterDeparture`.
- Confirm Dashboard counts include `PENDING_PHOTO` and `COMPLETE`.
- Confirm local-only mode says `เก็บรูปในเครื่อง / ยังไม่ได้เชื่อม R2` when no signed endpoint is configured.
- Confirm no UI claims upload success unless uploadStatus is `UPLOADED`.
- Confirm R2 secrets are not exposed in frontend code.
- Confirm mobile layout has no horizontal overflow.
- Confirm export, backup, and cleanup remain placeholders.

## Future Test Areas

### MVP-009 Edit redo void audit hardening

- Retake history review.
- Redo scan/edit workflows.
- Stronger audit trail.

### Exact 21.6 export

- Workbook includes sheet `21.6`.
- Photo cells link to exact vehicle photo.

### Backup cleanup guard

- Backup ZIP includes workbook, photos, flash screenshots, manifest.
- Cleanup blocked before backup success.
