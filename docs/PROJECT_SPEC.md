# Project Specification

## MVP-010 Dashboard Hardening and Operational Filters

MVP-010 turns TodayDashboardPage into a local-first operations dashboard for hub supervisors. It uses existing vehicle records, photo metadata, and audit history. It does not require Supabase or R2, and it does not implement export, backup, cleanup, production storage, or billing automation.

## Dashboard Data Sources

- Vehicle records: `hubchecklist.vehicleRecords`
- Vehicle photos: `hubchecklist.vehiclePhotos`
- Audit history: `hubchecklist.vehicleRecordEditHistory`
- Active responsible profile, when available, for default branch filtering

## Summary Cards

The top dashboard cards show:

- Total filtered records
- `READY_FOR_PHOTO`
- `PENDING_PHOTO`
- `COMPLETE`
- `VOIDED`
- Edited records
- Redo/refetch records
- Local-only photo count
- Uploaded photo count

## Filters and Search

Status chips:

- All
- Active
- `READY_FOR_PHOTO`
- `PENDING_PHOTO`
- `COMPLETE`
- `VOIDED`
- Edited
- Redo/refetch
- Duplicate warning
- Local-only photos
- Upload failed

Search includes:

- `vehicleBarcode`
- `driverPhone`
- `driverName`
- `companyName`
- `routeSummary`
- `firstBranch`
- `lastBranch`
- `responsibleEmployeeCode`
- `responsibleDisplayName`
- `status`
- `checklistType`
- `branch`

Date filters:

- Today default
- Yesterday
- Last 7 days
- Custom `workDate`
- All local records

Branch filters:

- All branches
- BNAK
- Other branches found in local records
- Defaults to active responsible profile branch if available

## Responsible Summary

Records are grouped by `responsibleEmployeeCode` and `responsibleDisplayName`.

Each responsible card shows:

- Employee code
- Display name
- Branch
- Total records
- Complete
- Pending photo
- Voided
- Edited
- Last updated time

Clicking a responsible card filters the record list.

## Record Cards

Each dashboard record card shows:

- Vehicle barcode
- Driver phone
- Responsible profile
- Branch
- Status badge
- Checklist type
- Route summary
- Photo progress
- Edited indicator
- Redo/refetch indicator
- Voided indicator
- Duplicate/conflict indicator
- Local-only/upload failed indicator
- Last updated time
- Actions to open checklist, edit, view history, and continue photo capture when photos are missing

## Sorting

Supported sort modes:

- Latest updated first
- Oldest updated first
- Status
- Responsible person
- Vehicle barcode
- Missing photos first

Default sort is latest updated first.

## Operational Alerts

Alerts are warnings only; they do not block operation.

Alerts include:

- Records missing required photos
- Records voided today
- Records edited today
- Records with upload failed
- Records with duplicate/conflict warning
- Records with missing responsible profile
- Records missing driver phone
- Records missing vehicle barcode

## Storage Mode Card

The storage card shows:

- Supabase configured/not configured
- R2 signed upload configured/not configured
- Local-only photo count
- Uploaded photo count
- Upload failed count
- Estimated local photo size
- Reminder that Export/Backup will be handled in MVP-011/MVP-012

## Still Placeholder After MVP-010

- Final Excel export exact 21.6
- Backup ZIP
- Cleanup Guard
- Production R2 backend
- Storage billing automation
- Production Supabase sync success handling
