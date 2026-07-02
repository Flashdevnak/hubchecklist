# QA Checklist

## MVP-009 required checks

- [ ] `npm install` passes
- [ ] `npx tsc -b` passes
- [ ] `npm run build` passes
- [ ] EditRecordPage edits supported fields without horizontal overflow
- [ ] `vehicleBarcode`, branch, responsible employee code, and `checklistType` validation block invalid save
- [ ] Thai phone validation blocks invalid phone when present
- [ ] Important edits require a reason
- [ ] Save button is disabled when invalid or unchanged
- [ ] Before/after values are visible before saving
- [ ] Checklist type changes update `requiredPhotos` and recalculate status
- [ ] Every manual edit creates audit history with action type and source
- [ ] VehicleChecklistPage shows latest audit history
- [ ] Redo QR asks before replacing source URL/barcode and writes `REDO_QR_SCAN`
- [ ] Redo phone asks before replacing driver phone and writes `REDO_PHONE_OCR`
- [ ] Flash refetch mode compares old/new values and writes `REFETCH_FLASH` only after confirmation
- [ ] Void requires reason and confirmation
- [ ] Voided records remain searchable and keep photos/history
- [ ] Restore requires reason and writes `RESTORE_RECORD`
- [ ] Retake photo writes `PHOTO_RETAKE` with old/new photo metadata
- [ ] Dashboard filters active/voided/complete/pending
- [ ] Dashboard shows manual edit and redo/refetch indicators
- [ ] App works without Supabase env keys
- [ ] App works without R2 signed upload endpoint
- [ ] Export/backup/cleanup remain clearly placeholder

## Future QA gates

Every MVP must update this file before commit. If QA fails, do not mark complete.
