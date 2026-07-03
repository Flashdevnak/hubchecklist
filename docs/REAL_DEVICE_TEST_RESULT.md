# Real Device Test Result

## MVP-014 Status

Real device testing is prepared but not completed in this local session because the Android SDK is not installed/configured and no debug APK was generated.

## Target Devices

- Samsung S23 FE
- Galaxy Tab A7 Lite
- iPad browser fallback
- Desktop browser

## APK Install Checklist

For Android devices after APK build succeeds:

- [ ] Build `android/app/build/outputs/apk/debug/app-debug.apk`
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
- [ ] Enter phone:
  - `0643042911`
- [ ] Confirm preview
- [ ] Test Web/PWA fallback
- [ ] Test Android WebView Flash flow on real Android device
- [ ] Create vehicle record
- [ ] Add required photos
- [ ] Dashboard check
- [ ] Export ZIP
- [ ] Verify `workbook.xlsx` has sheet `21.6`
- [ ] Verify photo links in workbook
- [ ] Backup/cleanup guard

## Samsung S23 FE

| Test | Result | Notes |
| --- | --- | --- |
| Install APK | Not run | APK not generated locally |
| Open app | Not run | Requires APK/device |
| Responsible profile | Not run | Use `25845 Tui / BNAK` |
| QR/manual scan | Not run | Use sample Flash URL |
| Android WebView Flash | Not run | Requires real device |
| Photos/camera | Not run | Requires real device |
| Export/backup | Not run | Validate after install |

## Galaxy Tab A7 Lite

| Test | Result | Notes |
| --- | --- | --- |
| Install APK | Not run | APK not generated locally |
| Open app | Not run | Requires APK/device |
| Layout/tablet | Not run | Check dashboard/export/backup pages |
| Android WebView Flash | Not run | Requires real device |
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

## Known Blocker

Android SDK is not installed/configured locally. Complete Android SDK setup and rerun APK build before real device installation.
