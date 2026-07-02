# Test Plan

## MVP-007

Goal: prove vehicle records are created on demand from Flash result drafts, persist locally, handle duplicates safely, and stay usable without Supabase.

Commands:

```bash
npm install
npx tsc -b
npm run build
```

Manual checks:

- Create or load a `hubchecklist.flashProofResultDraft`.
- Open FlashSearchPage.
- Confirm the `สร้างรายการรถ` button appears when a valid Flash result draft exists.
- Click create vehicle record.
- Confirm local-only mode shows `บันทึกในเครื่อง / ยังไม่ได้เชื่อม Supabase` when Supabase env values are missing.
- Confirm app navigates to VehicleChecklistPage for the created record.
- Refresh and confirm the record still loads.
- Confirm VehicleChecklistPage shows barcode, phone, driver, company, responsible profile, branch, route summary, route row count, checklist type, required photos, and status.
- Confirm photo section clearly says photos are MVP-008.
- Go to Dashboard and confirm counts and record cards appear.
- Search/filter by barcode, driver phone, responsible employee code, and status.
- Try creating the exact same record again.
- Confirm duplicate warning appears and user can open existing.
- Change driver phone or route summary and create again.
- Confirm stronger conflict warning appears.
- Confirm user can create new trip with confirmation.
- Void a record with a reason.
- Confirm voided record remains searchable and status is VOIDED.
- Edit driver phone, driver name, company name, route summary, or checklist type.
- Confirm edit history records field changes and reason.
- Confirm no R2, photo upload, export, backup, or cleanup feature is marked complete.

## Future Test Areas

### MVP-008 Checklist photos

- Capture required photo types.
- Compress before upload.
- Prepare R2 upload path.
- Keep records incomplete until required photos are present.

### Exact 21.6 export

- Workbook includes sheet `21.6`.
- A:K, M:U, W:AE, AG:AQ blocks are correct.
- Photo cells link to exact vehicle photo.

### Backup cleanup guard

- Backup ZIP includes workbook, photos, flash screenshots, manifest.
- Cleanup blocked before backup success.
