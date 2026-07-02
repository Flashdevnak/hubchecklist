# QA Checklist

## MVP-012 required checks

- [ ] `npm install` passes
- [ ] `npx tsc -b` passes
- [ ] `npm run build` passes
- [ ] BackupCleanupPage is no longer placeholder-only
- [ ] Page shows estimated storage usage
- [ ] Page shows warning levels at 60%, 75%, 85%, 95%
- [ ] User can generate backup ZIP using existing MVP-011 export service
- [ ] Backup job is created with `GENERATED` status
- [ ] User must confirm backup was saved before cleanup is allowed
- [ ] Confirmed backup marks included photos as `backedUp = true`
- [ ] Backup history is visible
- [ ] Cleanup only lists confirmed backed-up photos
- [ ] Cleanup is blocked for unbacked-up photos
- [ ] Cleanup requires confirmation phrase `ลบรูปที่สำรองแล้ว`
- [ ] Cleanup removes local heavy photo payload when possible but keeps metadata
- [ ] Vehicle records remain searchable after cleanup
- [ ] Audit/history/job record is preserved
- [ ] Dashboard shows backup/storage warning link
- [ ] App works without Supabase env keys
- [ ] App works without R2 signed upload/delete endpoint
- [ ] No fake cloud deletion is shown
- [ ] Mobile layout has no horizontal overflow
- [ ] Production R2 backend remains clearly placeholder

## Future QA gates

Every MVP must update this file before commit. If QA fails, do not mark complete.
