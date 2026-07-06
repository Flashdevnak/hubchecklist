# Real Device Test Result

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
