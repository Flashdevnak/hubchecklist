# Central Online Config

RESET-006-007-FINAL-PLUS uses Google Sheets + Apps Script as the free central backend.

## Environment

Set these values before building the APK/Web/PWA:

```env
VITE_APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/.../exec
VITE_APP_CLIENT_MODE=central
VITE_ADMIN_SETUP_TOKEN=<admin-only local fallback token>
```

If `VITE_APPS_SCRIPT_WEB_APP_URL` is missing, the app still opens Frontline but shows:

```text
ยังไม่ได้ตั้งค่า Backend กลาง กรุณาติดต่อผู้ดูแลระบบ
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
