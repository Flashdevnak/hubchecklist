# Flow QA Checklist

Use this checklist during web, PWA, and Android device testing. Record pass/fail notes per device.

| Area | Test | Expected result | Pass/Fail notes |
| --- | --- | --- | --- |
| App shell | Open app with no hash | Dashboard route loads without crash | |
| Role mode | Switch Staff/Admin mode | Mode persists locally and header shows current mode | |
| Role mode | Staff mode navigation | Only staff workflow items crowd the bottom nav | |
| Role mode | Admin mode navigation | Dashboard/records/export/backup/settings are available separately | |
| Missing env | Run without Supabase keys | Supabase notice says not configured; app still works | |
| Missing R2 | Run without signed upload endpoint | Photo mode says local-only; no fake upload success | |
| Login | Open LoginPage | Page renders; no fake auth success required | |
| Responsible profile | Save `25845`, `Tui`, `BNAK` | Profile persists and active profile is used by scan/export defaults | |
| Responsible profile | Edit/select/delete profile | Local profile list updates without fake backend login | |
| QR scan | Enter Flash URL manually | `NAK1R7XJ45` is extracted | |
| QR scan | No responsible profile selected | Next button is disabled and warning explains why | |
| QR scanner camera | Tap camera scan | Real camera preview appears | |
| QR scanner success | Scan Flash proof QR | Camera stops and vehicle barcode is extracted | |
| QR scanner fallback | Deny camera or unsupported detector | Honest manual-input fallback appears | |
| Phone limitation | Scan Flash QR | App does not claim QR contains driver phone | |
| Phone on scan | Phone missing after QR | Compact phone input appears on same Scan page | |
| Phone cache | Repeat same barcode after phone confirmation | Latest phone option appears and remains editable | |
| Scan preview | Enter phone `0643042911` | Phone validates and preview can be confirmed | |
| Scan preview | Open advanced OCR | OCR/raw text tools are collapsible and not in main path | |
| OCR fallback | Paste OCR text | Phone candidates are extracted or user can type manually | |
| Flash PWA | Open FlashSearchPage in browser | PWA fallback explains auto-fill limitation; no fake result | |
| Flash Android | Open FlashSearchPage in Android app | WebView plugin opens allowed Flash URL and handles errors clearly | |
| Record creation | Create record from manual/Flash result | Vehicle record is created with duplicate checks | |
| Duplicate flow | Create same barcode/day/branch again | Duplicate warning appears; no silent overwrite | |
| Checklist photos | Add required photos | Status progresses toward `COMPLETE` | |
| Photo compression | Add a large image | Compressed size and preview appear | |
| R2 upload | No signed endpoint | Photo stays local-only; no fake R2 upload | |
| Edit record | Edit important field without reason | Save is blocked | |
| Audit history | Save edit with reason | Audit entry shows action, field, old/new value, reason | |
| Redo QR | Use redo QR flow | Existing record is preserved; replacement requires confirmation | |
| Redo phone | Use redo phone flow | Driver phone replacement requires confirmation | |
| Refetch Flash | Use refetch mode | Old/new comparison appears; no fake Flash success | |
| Void | Void with reason | Record becomes `VOIDED`, photos/history remain | |
| Restore | Restore voided record | Status returns/recalculates and audit is written | |
| Dashboard | Search barcode/phone/route/responsible | Results filter correctly | |
| Dashboard | Use status/date/branch/sort filters | Cards remain readable and correct | |
| Dashboard mobile | Test narrow viewport | No horizontal overflow; buttons are large | |
| Staff home | Open dashboard in Staff mode | Shows active profile, own totals, pending photos, complete count | |
| Admin dashboard | Open dashboard in Admin mode | Shows all records, filters, alerts, export/backup shortcuts | |
| Export | Generate backup ZIP | ZIP contains `workbook.xlsx`, `photos/`, `flash-screenshots/`, manifest | |
| Export workbook | Open workbook | Sheet `21.6` exists with A:K, M:U, W:AE, AG:AQ blocks | |
| Export photos | Inspect photo cells | Existing local photos are linked; missing photos show `ยังไม่มีรูป` | |
| Backup generated | Create backup from BackupCleanupPage | Backup job appears as `GENERATED` | |
| Backup confirmed | Confirm backup saved | Job becomes `CONFIRMED`; photos get backup refs | |
| Cleanup blocked | Try cleanup before confirmation | Cleanup is blocked | |
| Cleanup phrase | Type wrong phrase | Cleanup is blocked | |
| Cleanup local | Type `ลบรูปที่สำรองแล้ว` | Local photo payload is removed only for confirmed backed-up photos | |
| Safety | After cleanup | Vehicle records, route rows, audit history, photo metadata remain searchable | |

## Sample End-To-End Flow

1. Create/select responsible profile:
   - employeeCode: `25845`
   - displayName: `Tui`
   - branch: `BNAK`
2. Manual QR:
   - `https://api.flashexpress.com/gw/nws/web/proof/go/NAK1R7XJ45`
3. Confirm extracted barcode:
   - `NAK1R7XJ45`
4. OCR/manual phone:
   - `0643042911`
5. Confirm preview.
6. Open FlashSearchPage and confirm PWA fallback is honest in browser mode.
7. Create vehicle record from available draft/manual fallback.
8. Add required photos and confirm status becomes `COMPLETE`.
9. Edit record and confirm audit history.
10. Void and restore record.
11. Verify Dashboard filters/search.
12. Export ZIP and inspect workbook `21.6`.
13. Create backup job, confirm saved, and verify cleanup guard behavior.
