# Test Plan

## MVP-010

Goal: prove the dashboard is useful for daily hub supervision using local records, photos, and audit history without faking cloud sync or future export/backup features.

Commands:

```bash
npm install
npx tsc -b
npm run build
```

Manual checks:

- Open the dashboard with local vehicle records present.
- Confirm summary cards show total, ready, pending, complete, voided, edited, redo/refetch, local photos, and uploaded photos.
- Confirm responsible-person cards show totals, completion, pending photo, voided, edited, branch, and last updated time.
- Tap a responsible-person card and confirm the record list filters.
- Use each status chip: all, active, ready, pending, complete, voided, edited, redo/refetch, duplicate warning, local-only photos, upload failed.
- Search by vehicle barcode, driver phone, driver name, company, route summary, first/last branch, responsible code/name, status, checklist type, and branch.
- Test date quick filters: today, yesterday, last 7 days, all local records, and custom work date.
- Test branch filter with BNAK and other branches found in records.
- Test sorting by latest, oldest, status, responsible person, barcode, and missing photos first.
- Confirm each record card shows status, checklist type, photo progress, indicators, local/upload state, and last updated time.
- Confirm action buttons open checklist, edit record, view history, and continue photo capture when missing photos exist.
- Confirm operational alerts count missing photos, voided today, edited today, upload failed, duplicate/conflict, missing responsible, missing phone, and missing barcode.
- Confirm storage card shows Supabase configured/not configured, R2 configured/not configured, local-only photo count, uploaded photo count, upload failed count, and estimated local size.
- Confirm empty state shows scan and responsible-profile buttons when filters return no records.
- Confirm dashboard remains usable on mobile widths without horizontal overflow.
- Confirm the app opens and builds without Supabase keys and without an R2 signed upload endpoint.
- Confirm exact 21.6 export, Backup ZIP, Cleanup Guard, production R2 backend, and storage billing automation remain placeholders.

## Future Test Areas

### MVP-011 Export XLSX/ZIP with exact 21.6 layout

- Workbook includes exact sheet `21.6`.
- Each photo is linked to the right vehicle row.
- ZIP packaging remains blocked until the export layout is correct.

### Backup cleanup guard

- Backup ZIP includes workbook, photos, flash screenshots, manifest.
- Cleanup blocked before backup success.
