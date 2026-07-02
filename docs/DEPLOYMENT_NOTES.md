# Deployment Notes

## Current Readiness

The project is ready for real device testing after local web build and Capacitor sync. Android APK build still requires a local Java/Android SDK setup.

## Web/PWA Mode

- Works as local-first browser app.
- Cannot auto-fill or automate the Flash website across origins.
- Must show honest manual fallback for Flash search.
- Uses localStorage for MVP data.
- Supabase can be missing; the app still opens.
- R2 signed upload endpoint can be missing; photo mode remains local-only.

## Android App Mode

- Android mode enables the Flash WebView automation foundation.
- `FlashProofWebViewPlugin` restricts automation to `https://api.flashexpress.com/gw/nws/web/proof/go/`.
- JavaScript injection is scoped to the allowed Flash proof URL.
- Errors for invalid URL, invalid phone, network failure, timeout, and parsing are returned to the app.
- Real Flash behavior must be validated on physical Android devices.

## Supabase Notes

- Supabase schema/auth/RLS draft exists.
- Missing Supabase env vars must not crash the app.
- Do not claim sync success unless Supabase insert succeeds.
- Keep service role keys out of frontend builds.

## R2 Notes

- R2 upload uses a future signed-upload endpoint.
- Missing signed upload endpoint means local-only photos.
- R2 secrets must never be exposed in frontend code.
- Production R2 backend and cloud delete are not implemented in this MVP.
- Do not claim cloud delete success unless a future real delete endpoint succeeds.

## Backup Before Cleanup Rule

- Export ZIP is the backup package.
- Backup job starts as `GENERATED` after ZIP creation.
- Browser download completion cannot be verified automatically.
- User must confirm the backup file was saved.
- Cleanup is only allowed for confirmed backed-up photo payloads.
- Vehicle records, route rows, audit history, and photo metadata must remain searchable after cleanup.

## Remaining Production Tasks

- Real Android device QA.
- Android release signing and app store packaging.
- Production R2 signed upload backend.
- Production R2 delete backend.
- Production Supabase sync hardening.
- Storage billing automation or live cloud usage metrics.
