# Real Device Test Result

## RESET-006-007-FINAL-PLUS Pending Real Device Checks

- [ ] Samsung S23 FE: full-screen scan fills the viewport and reads barcode/QR
- [ ] Samsung S23 FE: trailer-drop requires rear main vehicle photo plus trailer photos
- [ ] Samsung S23 FE: watermark is readable with no black strip
- [ ] Galaxy Tab A7 Lite: scan/photo pages fit without horizontal overflow
- [ ] iPad browser fallback: Frontline hides backend URL/token fields
- [ ] Desktop browser: Backoffice central auth blocks unapproved devices
- [ ] Apps Script `/exec`: browser GET returns health response
- [ ] Live Apps Script deployment: bootstrap returns hubs/responsible/settings/admin auth
- [ ] Flash live automation remains pending until physical Android device test

## RESET-005B Status

RESET-005B build readiness is implemented, but physical device validation remains pending.

- [ ] Fresh Android install blocks first-time PIN setup for staff
- [ ] Employee Device Mode hides Backoffice entry on staff phone
- [ ] Admin device with existing PIN can still unlock Backoffice
- [ ] iPhone/PWA fresh browser profile blocks first-time PIN setup for staff

## RESET-005A Status

RESET-005A code/build readiness is implemented, but physical and live Google Sheet validation remain pending.

- [ ] Confirm watermarked photo readability on Samsung S23 FE
- [ ] Confirm watermarked photo readability on Galaxy Tab A7 Lite
- [ ] Confirm iPhone Safari photo capture stores watermarked image
- [ ] Confirm GPS denied watermark shows warning only
- [ ] Confirm exported ZIP opens and photos are watermarked
- [ ] Confirm deployed Apps Script writes to `Records_All`
- [ ] Confirm deployed Apps Script creates/updates hub-specific sheet

## RESET-005 Status

RESET-005 code/build readiness is implemented, but physical device QA is still pending.

Do not mark these passed until tested on hardware/browser:

- [ ] Samsung S23 FE Frontline fits width with no horizontal scroll
- [ ] Galaxy Tab A7 Lite Frontline and Backoffice fit width
- [ ] iPhone Safari PWA Add to Home Screen works
- [ ] iPad browser fallback works
- [ ] Desktop Backoffice unlock/settings/export works
- [ ] Backoffice PIN setup/unlock/change/lock works on each target browser/device
- [ ] Android APK shows the new launcher icon after reinstall
- [ ] Camera/photo/GPS permission flows work on Android and iPhone Safari

## RESET-004 Status

Free Google Sheets storage code and Apps Script files are added. Physical device sync validation is still pending because the user's Google Apps Script Web App URL must be deployed and configured first.

Do not mark these passed until tested with the deployed script:

- [ ] Samsung S23 FE submits record to Google Sheets
- [ ] Galaxy Tab A7 Lite submits record to Google Sheets
- [ ] Photo metadata appears in `Photos`
- [ ] Photo files upload to Google Drive when request size allows
- [ ] Wrong token/offline state queues pending sync
- [ ] Retry sync drains pending queue after configuration is fixed
- [ ] iPad browser fallback remains local-first or syncs only when Apps Script is configured
- [ ] Desktop browser confirms Test connection and retry behavior

## RESET-003 Status

The debug APK can be built locally. Physical device validation is still pending.

Do not mark these passed until tested on real devices:

- [ ] Samsung S23 FE full-screen Barcode/QR scan
- [ ] Galaxy Tab A7 Lite full-screen Barcode/QR scan
- [ ] Manual barcode fallback
- [ ] Photo capture through Android camera picker
- [ ] GPS permission allowed path
- [ ] GPS denied path with warning and no fake coordinates
- [ ] Extra drop photo slot flow
- [ ] Submit with missing photo warning
- [ ] Admin export ZIP on device/browser

## RESET-001 Status

The app remains one APK with Frontline and Backoffice modes inside the same app. RESET-001 web/Android build can be generated locally, but physical device validation is still pending.

Do not mark these passed until tested on hardware:

- [ ] Samsung S23 FE Frontline full-screen scanner
- [ ] Galaxy Tab A7 Lite Frontline full-screen scanner
- [ ] QR/barcode detection on real camera
- [ ] OCR image capture from proof paper
- [ ] Actual departure time capture from device clock
- [ ] Android Flash WebView optional enrichment against the real Flash proof page
- [ ] Photo capture/compression for all three unified photo columns

## MVP-017 Status

The debug APK has been generated successfully. MVP-017 simple staff scan/review/create flow, QR/barcode intake, OCR parser foundation, and photo handoff still need physical device confirmation.

APK path:

```text
C:\Users\myhou\Desktop\Agent Codex\hubchecklist\android\app\build\outputs\apk\debug\app-debug.apk
```

Do not mark Flash live automation passed until it has been tested on a physical Android device with the real Flash proof page.

Additional MVP-017 checks:

- [ ] Staff mode bottom navigation shows Today / Scan / Photos / My Work on Samsung S23 FE
- [ ] Staff Home inline setup can save `25845 Tui / BNAK`
- [ ] Tap camera scan and confirm real camera preview opens
- [ ] Scan printed barcode and confirm vehicle barcode extraction
- [ ] Confirm Review card appears before Create
- [ ] Confirm blank phone can create a record
- [ ] Confirm invalid phone blocks Create
- [ ] Confirm OCR proof-paper image action fills likely fields but does not auto-save
- [ ] Confirm Create opens Photos/checklist
- [ ] Staff mode bottom navigation is clean on Samsung S23 FE
- [ ] Tap `เปิดกล้องสแกน QR` and confirm real camera preview opens
- [ ] Scan real Flash QR and confirm vehicle barcode extraction
- [ ] Confirm camera stops after successful scan
- [ ] Confirm phone input appears on Scan page when no cached phone exists
- [ ] Confirm cached phone option appears on repeat barcode
- [ ] Scan page has no generic Placeholder badge
- [ ] Scan page has only one scan-again/reset action
- [ ] Missing responsible profile warning is clear
- [ ] Admin mode tools do not crowd staff flow
- [ ] Galaxy Tab A7 Lite layout has no horizontal overflow
- [ ] iPad browser fallback remains usable

## Target Devices

- Samsung S23 FE
- Galaxy Tab A7 Lite
- iPad browser fallback
- Desktop browser

## APK Install Checklist

For Android devices:

- [x] Build `android/app/build/outputs/apk/debug/app-debug.apk`
- [ ] Connect device by USB
- [ ] Enable Developer Options
- [ ] Enable USB debugging
- [ ] Trust the development computer
- [ ] Install APK from Android Studio or `adb install`
- [ ] Open app
- [ ] Confirm app starts without crash

## Shared Flow Checklist

Use this flow on Samsung S23 FE, Galaxy Tab A7 Lite, iPad browser fallback, and desktop browser.

- [ ] Open app
- [ ] Create/select responsible profile:
  - employeeCode: `25845`
  - displayName: `Tui`
  - branch: `BNAK`
- [ ] Scan/manual QR:
  - `https://api.flashexpress.com/gw/nws/web/proof/go/NAK1R7XJ45`
- [ ] Confirm vehicleBarcode:
  - `NAK1R7XJ45`
- [ ] Review/edit fields on Scan page before creating a record
- [ ] Confirm blank phone can still create the record
- [ ] Confirm invalid phone is blocked
- [ ] Enter phone:
  - `0643042911`
- [ ] Create vehicle record
- [ ] Confirm Photos/checklist opens
- [ ] Test Web/PWA fallback
- [ ] Test Android WebView Flash flow on real Android device
- [ ] Add required photos
- [ ] Dashboard check
- [ ] Export ZIP
- [ ] Verify `workbook.xlsx` has sheet `21.6`
- [ ] Verify photo links in workbook
- [ ] Backup/cleanup guard

## Samsung S23 FE

| Test | Result | Notes |
| --- | --- | --- |
| Install APK | Pending | APK generated; requires physical device |
| Open app | Not run | Requires APK/device |
| Responsible profile | Not run | Use `25845 Tui / BNAK` |
| QR/manual scan | Not run | Use sample Flash URL |
| Android WebView Flash | Not run | Do not mark passed before real Flash proof page test |
| Photos/camera | Not run | Requires real device |
| Export/backup | Not run | Validate after install |

## Galaxy Tab A7 Lite

| Test | Result | Notes |
| --- | --- | --- |
| Install APK | Pending | APK generated; requires physical device |
| Open app | Not run | Requires APK/device |
| Layout/tablet | Not run | Check dashboard/export/backup pages |
| Android WebView Flash | Not run | Do not mark passed before real Flash proof page test |
| Photos/camera | Not run | Requires real device |

## iPad Browser Fallback

| Test | Result | Notes |
| --- | --- | --- |
| Open PWA/browser | Not run | Requires iPad browser |
| Flash fallback | Not run | Must remain manual/honest |
| Layout | Not run | Check no horizontal overflow |
| Export ZIP | Not run | Browser download behavior may vary |

## Desktop Browser

| Test | Result | Notes |
| --- | --- | --- |
| Open app | Ready for manual test | Web build passes |
| PWA Flash fallback | Ready for manual test | Browser cannot automate cross-site Flash |
| Export/backup | Ready for manual test | Build passes |

## Pending Work

- Install APK on Samsung S23 FE.
- Install APK on Galaxy Tab A7 Lite.
- Validate iPad browser fallback.
- Validate desktop browser fallback.
- Test Android WebView Flash flow on a real Android device with the real Flash proof page.
