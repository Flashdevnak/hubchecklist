# Google Sheets Schema

RESET-005A creates a simplified user-facing spreadsheet layout.

## RESET-006-007-FINAL-PLUS Additions

`doGet` returns a JSON health response for browser `/exec` checks.

New central bootstrap/admin actions:

- `bootstrap`
- `getAppSettings`
- `requestAdminAccess`
- `verifyAdminAccess`
- `setAdminPin`
- `listAdminDevices`
- `approveAdminDevice`
- `revokeAdminDevice`
- `getAdminAuthStatus`

RESET-008A default admin login requires only central Admin PIN. Device approval uses AdminDevices only when `REQUIRE_ADMIN_DEVICE_APPROVAL=true`.

New sheet: `AdminDevices`

| Column | Purpose |
| --- | --- |
| deviceId | App-generated local device id |
| deviceName | Human-readable device name |
| ownerName | Admin/user requesting access |
| role | OWNER, ADMIN, VIEWER |
| status | PENDING, APPROVED, REVOKED |
| approvedAt | Approval timestamp |
| revokedAt | Revocation timestamp |
| lastLoginAt | Last successful central admin login |
| note | Admin notes |

## Source Of Truth

`Records_All` is the master record sheet. Hub-specific sheets are views/copies for easier daily viewing.

Apps Script updates rows by record id, so retrying pending sync should update the same row instead of creating duplicate records.

## Simplified Record Columns

These 15 columns are used by Excel export and hub-specific Google Sheets:

1. วันที่
2. ฮับ
3. ผู้รับผิดชอบ
4. บาร์โค้ดรถ
5. พ่วงดรอปหรือไม่
6. จำนวนดรอป
7. สถานะ
8. รูปหลังรถ
9. รูปหน้าดรอป
10. รูปหลังรถพ่วงที่ 1
11. รูปหลังรถพ่วงที่ 2
12. รูปหลังรถพ่วงเพิ่มเติม
13. รายการรูปที่ขาด
14. เวลาส่งข้อมูล
15. หมายเหตุ

`Records_All` adds internal columns to the right:

- `recordId`
- `syncStatus`
- `updatedAt`

Hub-specific sheets keep the same 15 visible columns. The script stores `recordId` as a note on the first cell of each row to avoid duplicate rows on sync retry.

## Photos

`Photos` stores full photo metadata:

- id
- recordId
- vehicleBarcode
- slotId
- slotType
- labelThai
- captured
- fileName
- capturedAt
- gpsLat
- gpsLng
- gpsAccuracy
- gpsStatus
- watermarkText
- hub
- responsible
- driveFileId
- driveUrl
- localOnly
- createdAt

Photo date/time/GPS remain in metadata and are also rendered directly onto the photo watermark. Excel does not split them into separate columns.

## Master Sheets

- `Records_All`
- `Photos`
- `Hubs`: `hubCode | hubName | active | note`
- `ResponsibleStaff`: `employeeCode | employeeName | hubCode | active | note`
- `Audit`
- `Settings`
- `ExportLogs`

RESET-009A keeps admin-managed rows instead of hard deleting them. Hub and responsible staff deactivation sets `active = FALSE`; bootstrap and Frontline dropdowns use only active rows. Responsible staff updates are keyed by exact `employeeCode + hubCode`.

## Settings Keys

RESET-005B reserves these Settings keys for central admin PIN hardening:

- `ADMIN_PIN_ENABLED`
- `ADMIN_PIN_HASH`

The current app still enforces the local MVP protection path: fresh employee installs cannot create a PIN from the normal Backoffice entry, and admin setup requires the hidden setup token.

Editable Backoffice Settings are limited to safe operational keys: `GPS_REQUIRED` / `GPS_MANDATORY`, `WATERMARK_ENABLED`, `REQUIRE_ADMIN_DEVICE_APPROVAL`, and `MINIMUM_APP_VERSION`. `ADMIN_PIN_HASH`, `ADMIN_SETUP_TOKEN`, and `APP_SHARED_SECRET` are not exposed as editable settings.

## Photo Upload Limitation

The app sends compressed, watermarked base64 image data. Apps Script uploads it to Drive when possible. Very large photos can exceed Apps Script request/runtime limits; failed sync remains queued locally.
