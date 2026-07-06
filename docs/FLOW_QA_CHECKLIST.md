# Flow QA Checklist

Use this checklist during web, PWA, and Android device testing. Record pass/fail notes per device.

## RESET-001 Frontline Flow

1. Frontline Home shows active responsible person and today/pending/complete summary.
2. Tap `สแกนใบรถ`.
3. Scan QR/barcode, paste barcode, or use local OCR image fallback.
4. Review one unified row.
5. Confirm planned departure is filled from proof when detected.
6. Confirm actual departure is read-only live device time.
7. Save row; actual departure time is captured fresh on save.
8. Photos opens directly with 3 slots: branch photo 1, branch photo 2, outbound after release.
9. Finish returns to Today/Scan next.

## RESET-001 Backoffice Flow

1. Switch to Backoffice in the same APK.
2. Review all rows from Dashboard/Records.
3. Edit hidden fields such as `transferLoadRate`, `smallParcelPriority`, and corrected actual departure time with audit reason.
4. Review OCR confidence/candidates, route details, photos, and audit.
5. Export ZIP; workbook `21.6` must use the 11 unified headers.
6. Backup/Cleanup guard still requires confirmed backup before cleanup.

| Area | Test | Expected result | Pass/Fail notes |
| --- | --- | --- | --- |
| App shell | Open app with no hash | Dashboard route loads without crash | |
| Role mode | Switch Staff/Admin mode | Mode persists locally and header shows current mode | |
| Role mode | Staff mode navigation | Only staff workflow items crowd the bottom nav | |
| Staff home | No active responsible profile | Inline setup card appears on Today page | |
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
| Barcode scan | Scan printed barcode | Vehicle barcode is filled in Review | |
| Phone limitation | Scan Flash QR | App does not claim QR contains driver phone | |
| Review flow | Scan/manual/OCR result | Editable Review card appears before record creation | |
| Phone on scan | Phone missing after QR | Phone remains optional; invalid typed phone is blocked | |
| Phone cache | Repeat same barcode after phone confirmation | Latest phone option appears and remains editable | |
| Create record | Tap create after Review | Vehicle record is created and Photos/checklist opens | |
| OCR fallback | Use image/text OCR action | Parser fills likely fields; user must review before saving | |
| OCR fixture | Parse sample proof paper | `NAK1RK8Z54`, `0643042911`, `DOLLARSOUND`, `131KM`, `2h15min` are extracted | |
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
4. Review/edit fields on Scan page.
5. OCR/manual phone:
   - `0643042911`
6. Create vehicle record from Review and confirm Photos/checklist opens.
7. Open FlashSearchPage separately and confirm PWA fallback is honest in browser mode.
8. Add required photos and confirm status becomes `COMPLETE`.
9. Edit record and confirm audit history.
10. Void and restore record.
11. Verify Dashboard filters/search.
12. Export ZIP and inspect workbook `21.6`.
13. Create backup job, confirm saved, and verify cleanup guard behavior.
