# Employee Device Setup

Hub Photo Proof is one system with two delivery paths:

- Android phones/tablets: install the APK.
- iPhone/iPad/Desktop: open the HTTPS Web/PWA link.

## Android APK

1. Admin installs the debug APK or future signed APK.
2. Admin configures Google Sheets URL/token if this device should sync.
3. Admin sets or confirms the Backoffice PIN.
4. Admin enables `ล็อกเครื่องนี้เป็นเครื่องพนักงาน` in Backoffice Settings.
5. Admin locks Backoffice and hands the phone to staff.
6. Staff opens Hub Photo Proof and uses Frontline only.
7. Staff allows camera permission when scanning.
8. Staff allows location permission for photo GPS if prompted.

APK path after local build:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## iPhone / iPad

1. Open the HTTPS app URL in Safari.
2. Share -> Add to Home Screen.
3. Open the app from the Home Screen.
4. Allow camera/GPS when prompted.

## Frontline Rules

- The app opens Frontline by default.
- Employees cannot see Google Apps Script URL, sync token, export, backup, settings, audit, or admin records.
- Employees cannot create a first-time Backoffice PIN from a fresh install.
- If Backoffice has not been configured, the app tells staff to contact the admin.
- If scan is unavailable, use manual input.
- If GPS is unavailable, the app shows a warning and never creates fake coordinates.
- Submitted records save locally first and sync later when configured.
- Photo preview/export uses the watermarked image so date/time/GPS evidence is visible on the photo itself.

## Supported Screen Targets

- Small Android phones
- Standard Android phones
- Samsung S23 FE
- Galaxy Tab A7 Lite
- Android tablets
- iPhone Safari/PWA
- iPad Safari/PWA
- Desktop browser for admin/backoffice
