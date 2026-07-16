# Web/PWA Deployment

RESET-005 supports one codebase for Android APK and Web/PWA. iPhone and iPad users must use the web/PWA link because iOS cannot install the Android APK.

## RESET-006-007-FINAL-PLUS

Build the same Web/PWA with central backend env values:

```env
VITE_APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/.../exec
VITE_APP_CLIENT_MODE=central
```

The deployed PWA bootstraps hubs/responsible/settings from Apps Script, hides URL/token settings from Frontline, and keeps local-first pending sync if offline.

## Build Output

```powershell
npm.cmd run build
```

The static site is generated in:

```text
dist/
```

## Free Hosting Targets

### GitHub Pages

1. Run `npm.cmd run build`.
2. Deploy the `dist/` folder using GitHub Pages or a Pages deployment action.
3. Use HTTPS.
4. Do not commit Google Apps Script secrets. The Web App URL and token are configured inside Backoffice Settings per device/browser.

### Cloudflare Pages

1. Connect the GitHub repo.
2. Build command: `npm.cmd run build` or `npm run build`.
3. Output directory: `dist`.
4. Use the generated HTTPS URL for employees.

### Vercel Static

1. Import the repo.
2. Framework preset: Vite.
3. Build command: `npm run build`.
4. Output directory: `dist`.

## PWA Requirements

- `public/manifest.webmanifest` exists.
- PWA icons exist under `public/icons/`.
- `index.html` includes viewport, theme color, manifest, favicon, and Apple touch icon tags.
- Camera/GPS requires HTTPS in mobile browsers.
- iPhone/iPad users should use Safari Add to Home Screen.

## Limitations

- Browser barcode scanning depends on camera permission and BarcodeDetector support.
- Manual barcode input is always available.
- Photo capture uses `accept="image/*"` and `capture="environment"` where the browser supports it.
- Google Sheets sync remains optional and local-first.
- Export remains browser-based: ZIP contains simplified `workbook.xlsx`, watermarked photos, and full metadata in `manifest.json`.
