# QA Checklist

## MVP-005 required checks

- [ ] `npm install` passes
- [ ] `npx tsc -b` passes
- [ ] `npm run build` passes
- [ ] ScanPreviewPage is no longer placeholder-only
- [ ] Missing QR/vehicleBarcode shows a warning and link back to Scan
- [ ] Scan summary shows `vehicleBarcode`, `sourceUrl`, and responsible profile
- [ ] User can edit `vehicleBarcode` and `sourceUrl`
- [ ] User can choose/take a paper image for OCR intake
- [ ] UI clearly says OCR engine is not production-ready when unavailable
- [ ] User can paste OCR raw text
- [ ] User can manually enter and edit `driverPhone`
- [ ] Text extraction finds `0643042911` from Thai label text
- [ ] Text extraction finds `0643042911` from `064-304-2911`
- [ ] Text extraction finds multiple candidates and lets user choose
- [ ] Invalid phone shows Thai validation error
- [ ] Confirm is disabled when phone is invalid
- [ ] Valid confirmed preview persists after refresh
- [ ] Preview draft stores `driverPhone`, `ocrRawText`, profile, scan data, and `phoneConfirmedAt`
- [ ] App clearly says Flash auto-fill is MVP-006
- [ ] Mobile layout has no horizontal overflow
- [ ] Samsung S23 FE width fits
- [ ] Galaxy Tab A7 Lite width fits
- [ ] iPad browser fallback width fits
- [ ] Desktop browser width fits
- [ ] No fake completed Android WebView feature
- [ ] No fake completed Flash route/status extraction
- [ ] No fake completed R2 upload or photo upload feature
- [ ] No fake completed Export 21.6 feature
- [ ] No fake completed Backup or Cleanup execution feature
- [ ] README.md updated
- [ ] TEST_PLAN.md updated
- [ ] docs/PROJECT_SPEC.md updated

## Future QA gates

Every MVP must update this file before commit. If QA fails, do not mark complete.
