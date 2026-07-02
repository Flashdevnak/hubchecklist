# QA Checklist

## MVP-010 required checks

- [ ] `npm install` passes
- [ ] `npx tsc -b` passes
- [ ] `npm run build` passes
- [ ] Dashboard shows top summary cards
- [ ] Dashboard groups records by responsible person
- [ ] Clicking a responsible person filters the record list
- [ ] Status filter chips work on mobile
- [ ] Search covers barcode, phone, route, responsible person, branch, status, and checklist type
- [ ] Date filters support today, yesterday, last 7 days, custom date, and all local records
- [ ] Branch filter includes BNAK and branches found in records
- [ ] Record cards show photo progress per record
- [ ] Record cards show edited, redo/refetch, voided, duplicate/conflict, and storage indicators
- [ ] Record cards include open, edit, history, and continue-photo actions where applicable
- [ ] Sorting works for latest, oldest, status, responsible person, barcode, and missing photos first
- [ ] Operational alerts show missing photos, voided today, edited today, upload failed, duplicate/conflict, missing responsible, missing phone, and missing barcode
- [ ] Storage mode card shows Supabase/R2 config state and local/upload photo counts
- [ ] Empty state has scan and responsible-profile shortcuts
- [ ] Dashboard works without Supabase env keys
- [ ] Dashboard works without R2 signed upload endpoint
- [ ] Mobile layout has no horizontal overflow
- [ ] Export/backup/cleanup remain clearly placeholder

## Future QA gates

Every MVP must update this file before commit. If QA fails, do not mark complete.
