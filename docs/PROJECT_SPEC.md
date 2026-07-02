# Project Specification

## MVP-008 Checklist Photos

MVP-008 implements checklist photo capture, compression, local metadata storage, R2 signed-upload foundation, and record photo completion logic.

## Photo Rules

`NORMAL_ROUTE` requires:

- `loadingPhoto`
- `dropPhotoAfterDeparture`

`MULTI_DROP` requires:

- `branchDropPhoto1`
- `branchDropPhoto2`
- `dropPhotoAfterDeparture`

Thai labels:

- `loadingPhoto`: รูปถ่ายการบรรทุก
- `dropPhotoAfterDeparture`: รูป Drop หลังปล่อยรถ
- `branchDropPhoto1`: รูปสาขาที่พ่วง 1
- `branchDropPhoto2`: รูปสาขาที่พ่วง 2

## Storage

- Photo metadata key: `hubchecklist.vehiclePhotos`
- Compressed local preview key prefix: `hubchecklist.vehiclePhotoBlob.`
- Client compression uses canvas.
- R2 upload requires a signed upload endpoint.
- Frontend must not use R2 secret keys.
- Missing R2 config keeps local-only mode.

## Record Status

- `READY_FOR_PHOTO`: record created but no photo yet.
- `PENDING_PHOTO`: some required photos are missing.
- `COMPLETE`: all required photos exist locally or uploaded.
- `VOIDED`: unchanged by photo logic.

Still placeholders after MVP-008:

- Final Excel export
- Backup ZIP
- Cleanup Guard
- Production storage billing automation
