# Central Online Config

RESET-006-007-FINAL-PLUS uses Google Sheets + Apps Script as the free central backend.

The employee Web/PWA URL should be the Vercel deployment URL. The Apps Script `/exec` URL is the backend API URL bundled into the app at build/deploy time.

## Environment

Set these values before building the APK/Web/PWA:

```env
VITE_APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/.../exec
VITE_APP_CLIENT_MODE=central
VITE_ADMIN_SETUP_TOKEN=<admin-only local fallback token>
```

If `VITE_APPS_SCRIPT_WEB_APP_URL` is missing, the app still opens Frontline but shows:

```text
ยังไม่ได้ตั้งค่าระบบกลาง กรุณาติดต่อผู้ดูแล

## RESET-009 API Health

The Apps Script `/exec` URL is backend API only. Opening it in a browser should return JSON with:

- `ok: true`
- `appName: Hub Photo Proof`
- `version: RESET-009`
- `serverTimeBangkok`
- Thai ready message

Use the Vercel URL for the employee Web/PWA app. Use `/exec` only as the backend URL in environment variables.
```

Employees never enter the backend URL or shared secret in Frontline.

## Bootstrap

On app start the app calls `bootstrap` and caches:

- server time for drift/status only
- app settings
- hubs
- responsible staff
- admin auth enabled flag
- minimum app version

If offline, the app uses cached hubs/staff/settings, saves Frontline work locally, and queues sync.
