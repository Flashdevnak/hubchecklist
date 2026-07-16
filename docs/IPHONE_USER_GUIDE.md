# iPhone / iPad User Guide

iPhone and iPad users use the Web/PWA version. They do not install the Android APK.

Use the Vercel app URL on iPhone/iPad. Do not open the Google Apps Script `/exec` URL as the app; `/exec` is only the backend API.

## RESET-006-007-FINAL-PLUS PWA Behavior

- iPhone users open the same Web/PWA app.
- Frontline uses central bootstrap data when `VITE_APPS_SCRIPT_WEB_APP_URL` is configured.
- Staff do not enter backend URL/token values.
- Browser/PWA mode keeps local-first save and pending sync fallback.
- Full-screen scan depends on Safari camera/barcode support; manual barcode entry remains available.
- Photo capture uses the iOS file/camera picker and writes the same timestamp/GPS watermark when permission is available.

## Add To Home Screen

1. Open the provided HTTPS app URL in Safari.
2. Tap Share.
3. Tap Add to Home Screen.
4. Confirm the name, then tap Add.
5. Open Hub Photo Proof from the Home Screen icon.

## Daily Use

1. Select hub.
2. Select responsible person.
3. Scan QR/barcode if Safari supports it, or use manual barcode input.
4. Confirm the locked current date.
5. Choose drop condition.
6. Capture required photos.
7. Allow location permission if prompted.
8. Submit.

## Permissions

- Camera permission is required for scanner/photo capture.
- Location permission is used for photo GPS metadata.
- If camera scanning is unavailable, use manual barcode input.
- If GPS is denied or unavailable, the app stores a warning and never fakes GPS.

## Notes

- iPhone browser support varies by iOS/Safari version.
- Use HTTPS. Camera/GPS may not work on plain HTTP.
- Google sync runs only if an admin configured it in Backoffice on that browser/device.
- Captured photos are saved with a visible date/time/GPS watermark when the browser can process the image.
