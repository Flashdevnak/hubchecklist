# QA Checklist

## MVP-008 required checks

- [ ] `npm install` passes
- [ ] `npx tsc -b` passes
- [ ] `npm run build` passes
- [ ] VehicleChecklistPage shows required photo checklist
- [ ] NORMAL_ROUTE requires `loadingPhoto` and `dropPhotoAfterDeparture`
- [ ] MULTI_DROP requires `branchDropPhoto1`, `branchDropPhoto2`, and `dropPhotoAfterDeparture`
- [ ] User can add/upload/take photo for each required type
- [ ] Photo is compressed before saving/upload attempt
- [ ] UI shows original size and compressed size
- [ ] Photo preview displays correctly
- [ ] Retake photo works
- [ ] Missing photos keep record `PENDING_PHOTO`
- [ ] All required photos present mark record `COMPLETE`
- [ ] Dashboard reflects `PENDING_PHOTO` and `COMPLETE` counts
- [ ] R2 missing config shows honest local-only mode
- [ ] R2 upload is not faked
- [ ] R2 secrets are not exposed in frontend
- [ ] App works without R2 config
- [ ] Mobile layout has no horizontal overflow
- [ ] Export/backup/cleanup remain clearly placeholder

## Future QA gates

Every MVP must update this file before commit. If QA fails, do not mark complete.
