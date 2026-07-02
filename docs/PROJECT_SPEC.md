# Project Specification

## Final Direction

Hub Vehicle Proof Capture is an Android-first mobile system with PWA fallback. Records are created from real scans on demand. The app must not require daily vehicle import, known vehicle count, or fixed routes.

## MVP-007 Vehicle Record Creation

Implemented foundation:

- Local-first vehicle record service in `src/services/vehicleRecords.ts`
- Record creation from `hubchecklist.flashProofResultDraft`
- Local record persistence in `hubchecklist.vehicleRecords`
- Edit history in `hubchecklist.vehicleRecordEditHistory`
- Duplicate detection:
  - Exact duplicate: same workDate + branch + vehicleBarcode + driverPhone + sourceUrl
  - Conflict: same workDate + branch + vehicleBarcode but different phone or route summary
- Duplicate actions:
  - Open existing
  - Create new trip
  - Void wrong record
  - Cancel
- Void flow requires reason and never hard-deletes
- Default checklist type:
  - `NORMAL_ROUTE`
  - `MULTI_DROP`
- Required photo placeholders for MVP-008
- Dashboard counts/search/filter
- Basic edit page for driver phone, driver name, company, route summary, and checklist type
- Supabase sync path is safe/optional and does not fake success

Vehicle records include:

- id
- workDate
- branch
- responsibleEmployeeCode
- responsibleDisplayName
- sourceUrl
- vehicleBarcode
- driverPhone
- driverName
- companyName
- routeSummary
- firstBranch
- lastBranch
- plannedDepartureTime
- actualDepartureTime
- checklistType
- requiredPhotos
- flashPageStatus
- flashHtmlSnapshot
- ocrRawText
- ocrConfidence
- status
- duplicateKey
- backedUp
- backupId
- voidReason
- createdAt
- updatedAt

Still placeholders after MVP-007:

- Photo capture and upload
- R2 upload
- Exact 21.6 export
- Backup execution
- Cleanup execution
- Final dashboard hardening

## Exact Backup Requirement

Backup ZIP must contain:

```text
backup.zip
├─ workbook.xlsx
├─ photos/
├─ flash-screenshots/
└─ backup-manifest.json
```

`workbook.xlsx` must contain sheet `21.6` with original reference-style column blocks:

- A:K รถหลักพ่วงสาขา
- M:U รถหลัก
- W:AE รถเสริม
- AG:AQ รถเสริมพ่วงสาขา

Photo cells must hyperlink to the matching photo for the exact vehicle. Users must not manually hunt for photos.
