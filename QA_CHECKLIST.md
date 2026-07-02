# QA Checklist

## MVP-007 required checks

- [ ] `npm install` passes
- [ ] `npx tsc -b` passes
- [ ] `npm run build` passes
- [ ] User can create vehicle record from `hubchecklist.flashProofResultDraft`
- [ ] Vehicle record persists locally after refresh
- [ ] App works without Supabase env keys
- [ ] App shows `บันทึกในเครื่อง / ยังไม่ได้เชื่อม Supabase` in local-only mode
- [ ] App does not fake Supabase sync success
- [ ] Duplicate same workDate + branch + vehicleBarcode + driverPhone + sourceUrl is detected
- [ ] Same barcode but different phone/route shows stronger warning
- [ ] User can open existing duplicate
- [ ] User can create new trip with confirmation
- [ ] User can void record with reason
- [ ] Voided record remains searchable
- [ ] Basic edit writes edit history
- [ ] VehicleChecklistPage shows created record summary
- [ ] VehicleChecklistPage keeps photos as MVP-008 placeholder
- [ ] Dashboard lists local vehicle records
- [ ] Dashboard counts total, READY_FOR_PHOTO, NEED_REVIEW, and VOIDED
- [ ] Dashboard can filter/search by barcode, phone, responsible, or status
- [ ] Mobile layout has no horizontal overflow
- [ ] No R2/photo/export/backup feature is falsely marked complete

## Future QA gates

Every MVP must update this file before commit. If QA fails, do not mark complete.
