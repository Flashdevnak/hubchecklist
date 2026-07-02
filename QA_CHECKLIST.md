# QA Checklist

## MVP-011 required checks

- [ ] `npm install` passes
- [ ] `npx tsc -b` passes
- [ ] `npm run build` passes
- [ ] ExportPage is no longer placeholder-only
- [ ] User can filter export by date, branch, responsible person, status, and barcode
- [ ] User can preview export summary before download
- [ ] User can generate `backup.zip`
- [ ] `backup.zip` contains `workbook.xlsx`
- [ ] `backup.zip` contains `backup-manifest.json`
- [ ] `backup.zip` contains `photos/` when local photos exist
- [ ] `workbook.xlsx` contains sheet named exactly `21.6`
- [ ] `21.6` sheet has A:K, M:U, W:AE, and AG:AQ blocks
- [ ] `NORMAL_ROUTE` records export to M:U
- [ ] `MULTI_DROP` records export to A:K
- [ ] Photo cells link to the correct relative photo path when photo data exists
- [ ] Missing photo cells show `ยังไม่มีรูป`
- [ ] Photo Index lists photos and linked cells
- [ ] Route Detail lists route rows
- [ ] Edit History lists audit entries
- [ ] Voided Records lists voided records when included
- [ ] Backup Manifest sheet exists
- [ ] User does not need to manually hunt for photos
- [ ] App works without Supabase env keys
- [ ] App works without R2 signed upload endpoint
- [ ] Mobile layout has no horizontal overflow
- [ ] Backup/Cleanup Guard remains clearly placeholder for MVP-012

## Future QA gates

Every MVP must update this file before commit. If QA fails, do not mark complete.
