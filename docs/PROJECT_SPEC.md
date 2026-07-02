# Project Specification

## MVP-009 Edit Redo Void Audit Hardening

MVP-009 makes correction workflows safe and reviewable. Important data must not be silently overwritten. Local mode remains the source of truth for this MVP, with Supabase/R2 integrations still optional foundations.

## Audit Contract

Every manual change writes an audit entry with:

- `id`
- `recordId`
- `actionType`
- `fieldName`
- `oldValue`
- `newValue`
- `editedBy`
- `editedAt`
- `reason`
- `source`

Supported `actionType` values:

- `FIELD_EDIT`
- `PHONE_EDIT`
- `ROUTE_EDIT`
- `CHECKLIST_TYPE_CHANGE`
- `REDO_QR_SCAN`
- `REDO_PHONE_OCR`
- `REFETCH_FLASH`
- `PHOTO_RETAKE`
- `VOID_RECORD`
- `RESTORE_RECORD`
- `STATUS_CHANGE`

Supported `source` values:

- `user`
- `system`
- `duplicate_flow`
- `photo_flow`

Local storage keys:

- Vehicle records: `hubchecklist.vehicleRecords`
- Audit history: `hubchecklist.vehicleRecordEditHistory`
- Vehicle photos: `hubchecklist.vehiclePhotos`

## Safe Edit Rules

Editable fields include:

- `vehicleBarcode`
- `sourceUrl`
- `driverPhone`
- `driverName`
- `companyName`
- `routeSummary`
- `firstBranch`
- `lastBranch`
- `plannedDepartureTime`
- `actualDepartureTime`
- `checklistType`
- `branch`
- `responsibleEmployeeCode`

Validation:

- `vehicleBarcode` is required and normalized to uppercase.
- `driverPhone` must be a valid Thai phone when present.
- `branch` is required.
- `responsibleEmployeeCode` is required.
- `checklistType` must be `NORMAL_ROUTE` or `MULTI_DROP`.
- Editing `vehicleBarcode`, `driverPhone`, `checklistType`, or `routeSummary` requires a reason.

## Redo and Refetch Rules

- Redo QR keeps the record, asks before replacing `sourceUrl` and `vehicleBarcode`, and audits `REDO_QR_SCAN`.
- Redo phone keeps the record, asks before replacing `driverPhone`, and audits `REDO_PHONE_OCR`.
- Flash refetch uses the current `sourceUrl` and `driverPhone`, compares route summary, driver, company, and route row count, then audits `REFETCH_FLASH` after confirmation.
- PWA mode remains honest: it can use manual pasted Flash text, but it does not fake Android WebView extraction success.

## Void and Restore Rules

- Void requires reason and confirmation.
- Void sets `status = VOIDED`.
- Void keeps photos and edit history.
- Void never hard-deletes records.
- Restore requires reason and restores previous non-void status when available, otherwise recalculates/falls back to review status.

## Status Recalculation

- `VOIDED` remains `VOIDED` unless restored.
- No required photos present: `READY_FOR_PHOTO`.
- Some required photos missing: `PENDING_PHOTO`.
- All required photos present: `COMPLETE`.
- Checklist type changes update required photo types and recalculate status.

## Still Placeholder After MVP-009

- Final Excel export exact 21.6
- Backup ZIP
- Cleanup Guard
- Production R2 backend
- Storage billing automation
- Production Supabase sync success handling
