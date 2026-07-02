# QA Checklist

## MVP-006 required checks

- [ ] `npm install` passes
- [ ] `npx tsc -b` passes
- [ ] `npm run build` passes
- [ ] `npx cap sync android` passes
- [ ] Android project exists
- [ ] `FlashProofWebViewPlugin` native file exists
- [ ] Plugin validates `api.flashexpress.com`
- [ ] Plugin rejects unknown domains
- [ ] Plugin uses `evaluateJavascript` for auto-fill/search/extraction
- [ ] Plugin returns structured success/error result to React
- [ ] FlashSearchPage is no longer placeholder-only
- [ ] FlashSearchPage loads confirmed scan preview draft
- [ ] FlashSearchPage validates `sourceUrl`, `vehicleBarcode`, and `driverPhone`
- [ ] Android platform status is shown
- [ ] Web/PWA fallback is honest and does not claim auto-fill
- [ ] Web/PWA fallback has copy phone and open Flash URL actions
- [ ] Manual raw-text parser is clearly labeled as fallback/testing only
- [ ] No fake Flash data is displayed as real
- [ ] Flash result draft persists only after plugin result or clearly marked manual fallback
- [ ] Documentation explains Android WebView requirement
- [ ] Mobile layout has no horizontal overflow
- [ ] No R2/photo/export/backup feature is falsely marked complete

## Future QA gates

Every MVP must update this file before commit. If QA fails, do not mark complete.
