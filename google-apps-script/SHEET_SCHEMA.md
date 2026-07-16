# Google Sheets Schema

RESET-005A creates a simplified user-facing spreadsheet layout.

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
- `Hubs`
- `ResponsibleStaff`
- `Audit`
- `Settings`
- `ExportLogs`

## Photo Upload Limitation

The app sends compressed, watermarked base64 image data. Apps Script uploads it to Drive when possible. Very large photos can exceed Apps Script request/runtime limits; failed sync remains queued locally.
