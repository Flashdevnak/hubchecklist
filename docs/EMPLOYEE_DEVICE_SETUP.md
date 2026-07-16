# Employee Device Setup

Hub Photo Proof is one system with two delivery paths:

- Android phones/tablets: install the APK.
- iPhone/iPad/Desktop: open the HTTPS Web/PWA link.

## Android APK

1. Install the debug APK or future signed APK provided by admin.
2. Open Hub Photo Proof.
3. Allow camera permission when scanning.
4. Allow location permission for photo GPS if prompted.
5. Use Frontline only. Backoffice requires the local admin PIN.

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
