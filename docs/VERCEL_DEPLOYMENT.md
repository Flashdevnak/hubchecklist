# Vercel Deployment

Vercel is the Web/PWA app URL for iPhone, iPad, and desktop users.

Google Apps Script `/exec` is the backend API only. Do not give the Apps Script `/exec` URL to employees as the app website.

## Project Settings

- Framework preset: Vite
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`

`vercel.json` is included for the Vite build and SPA route fallback.

## Environment Variables

Set these in Vercel Project Settings:

```env
VITE_APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/xxxx/exec
VITE_APP_CLIENT_MODE=central
```

Do not put Google account credentials, `APP_SHARED_SECRET`, Admin PIN, or private backend secrets in frontend environment variables.

## Deploy

1. Deploy the Google Apps Script Web App first.
2. Confirm the Apps Script `/exec` URL opens a health response.
3. Add `VITE_APPS_SCRIPT_WEB_APP_URL` and `VITE_APP_CLIENT_MODE` in Vercel.
4. Deploy this repo to Vercel.
5. Open the Vercel URL on iPhone Safari.
6. Use Share -> Add to Home Screen for PWA-style access.

Camera and GPS require HTTPS. Vercel provides HTTPS by default.

## Manual Verification

- Frontline opens by default.
- Employees do not see backend URL/token settings.
- Bootstrap loads hubs/responsible staff from Apps Script when online.
- Offline mode uses cached data and pending sync.
- Backoffice still requires central AdminDevices approval.
