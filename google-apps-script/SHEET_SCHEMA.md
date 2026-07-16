# Google Sheets Schema

RESET-004 creates these sheets automatically on first successful request.

## Records

| Column | Description |
| --- | --- |
| id | Local record UUID |
| date | Local work date |
| hubCode | Hub code |
| hubName | Hub name |
| responsibleEmployeeCode | Staff employee code |
| responsibleName | Staff display name |
| vehicleBarcode | Vehicle barcode from QR/manual scan |
| hasDropTransfer | Boolean drop-transfer flag |
| dropCount | Required drop count |
| status | DRAFT, COMPLETE, NEED_REVIEW, or VOIDED |
| missingPhotoWarnings | Comma-separated missing photo labels |
| missingPhotoConfirmed | Staff confirmed missing-photo warning |
| submittedAt | Submit timestamp |
| createdAt | Local create timestamp |
| updatedAt | Local update timestamp |
| notes | Optional admin notes |

## Photos

| Column | Description |
| --- | --- |
| id | Apps Script photo metadata row UUID |
| recordId | Parent record UUID |
| vehicleBarcode | Vehicle barcode |
| slotId | Local slot UUID |
| slotType | REAR_MAIN, FRONT_DROP, DROP_REAR_1, DROP_REAR_2, or DROP_REAR_EXTRA |
| labelThai | User-facing photo label |
| captured | Boolean captured flag |
| fileName | Local generated file name |
| capturedAt | Photo capture timestamp |
| gpsLat | GPS latitude if available |
| gpsLng | GPS longitude if available |
| gpsAccuracy | GPS accuracy in meters if available |
| gpsStatus | granted, denied, unavailable, or unknown |
| driveFileId | Google Drive file ID when upload succeeds |
| driveUrl | Google Drive file URL when upload succeeds |
| localOnly | True when no Drive file was uploaded |
| createdAt | Apps Script metadata timestamp |

## Hubs

`hubCode`, `hubName`, `active`, `updatedAt`

## ResponsibleStaff

`employeeCode`, `displayName`, `hubCode`, `active`, `updatedAt`

## Audit

`id`, `recordId`, `action`, `detail`, `actor`, `createdAt`

## Photo Upload Limitation

The app sends compressed base64 image data from localStorage. Apps Script uploads it to Drive when possible. Very large photos can exceed Apps Script request/runtime limits; those failures are queued locally and should be retried after reducing photo size or splitting work.
