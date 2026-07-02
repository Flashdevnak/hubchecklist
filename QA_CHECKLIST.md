# QA Checklist

## MVP-004 required checks

- [ ] `npm install` passes
- [ ] `npx tsc -b` passes
- [ ] `npm run build` passes
- [ ] FullScreenScanPage is no longer placeholder-only
- [ ] Scan page has a large full-screen-style scan frame
- [ ] Buttons are at least 44px high and usable on mobile
- [ ] Manual input accepts `https://api.flashexpress.com/gw/nws/web/proof/go/NAK1R7XJ45`
- [ ] Flash URL extracts `vehicleBarcode = NAK1R7XJ45`
- [ ] Manual input accepts raw barcode `NAK1R7XJ45`
- [ ] Invalid input shows a Thai error and cannot continue
- [ ] Missing active responsible profile shows `กรุณาเลือกผู้รับผิดชอบก่อนเริ่มสแกน`
- [ ] Missing profile state provides a button to Responsible Profile
- [ ] Valid preview shows `sourceUrl`, `vehicleBarcode`, validation status, and responsible profile
- [ ] Last valid scan draft persists in `localStorage`
- [ ] ScanPreviewPage shows scan draft after navigation or refresh
- [ ] ScanPreviewPage clearly marks OCR phone as MVP-005
- [ ] Mobile layout has no horizontal overflow
- [ ] Samsung S23 FE width fits
- [ ] Galaxy Tab A7 Lite width fits
- [ ] iPad browser fallback width fits
- [ ] Desktop browser width fits
- [ ] Camera scanner is not falsely marked production-ready
- [ ] No fake completed OCR feature
- [ ] No fake completed Android WebView feature
- [ ] No fake completed R2 upload or photo upload feature
- [ ] No fake completed Export 21.6 feature
- [ ] No fake completed Backup or Cleanup execution feature
- [ ] README.md updated
- [ ] TEST_PLAN.md updated
- [ ] docs/PROJECT_SPEC.md updated

## Future QA gates

Every MVP must update this file before commit. If QA fails, do not mark complete.
