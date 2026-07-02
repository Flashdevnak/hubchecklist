# Test Plan

## MVP-009

Goal: prove edit, redo, void/restore, photo retake, status recalculation, dashboard filtering, and audit history work locally without fake cloud or Flash success.

Commands:

```bash
npm install
npx tsc -b
npm run build
```

Manual checks:

- Open an existing vehicle record and go to Edit.
- Change `driverPhone` or `routeSummary` with no reason and confirm save stays disabled.
- Add a reason and save; confirm the checklist page shows audit entries with old/new values.
- Change `checklistType`; confirm `requiredPhotos` updates and status recalculates from existing photos.
- Use “สแกน QR ใหม่”; enter a new URL/barcode, confirm replacement, and verify `REDO_QR_SCAN`.
- Use “อ่านเบอร์ใหม่”; enter/extract a new phone, confirm replacement, and verify `REDO_PHONE_OCR`.
- Use “ดึงข้อมูล Flash ใหม่”; in PWA/manual mode, paste Flash text, compare old/new values, confirm replacement, and verify `REFETCH_FLASH`.
- Void a record; confirm reason and warning are required, status becomes `VOIDED`, and the record is still searchable.
- Restore a voided record; confirm reason is required and status returns to previous non-void status or recalculates.
- Retake a checklist photo and confirm `PHOTO_RETAKE` includes old/new photo metadata.
- Confirm Dashboard active/voided/complete/pending filters and edit/redo indicators.
- Confirm the app opens and builds without Supabase keys and without an R2 signed upload endpoint.
- Confirm export, backup, cleanup, production R2 backend, and storage billing automation are still placeholders.

## Future Test Areas

### MVP-010 Dashboard hardening and operational filters

- Daily operations filter polish.
- Supervisor/admin views.
- More complete local reporting indicators.

### Exact 21.6 export

- Workbook includes sheet `21.6`.
- Photo cells link to exact vehicle photo.

### Backup cleanup guard

- Backup ZIP includes workbook, photos, flash screenshots, manifest.
- Cleanup blocked before backup success.
