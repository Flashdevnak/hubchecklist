# Project Specification

## MVP-013 Final Android QA and Device Readiness

MVP-013 prepares the project for real mobile testing. It verifies web build, TypeScript, Capacitor sync, Android readiness docs, route coverage, safety constraints, and device QA checklists.

## Verified Locally

- `npm install` passes.
- `npx tsc -b` passes.
- `npm run build` passes.
- `npx cap sync android` passes.
- `npx cap doctor` passes.

## Android Build Status

Android debug build is not verified on this machine because Java is missing:

```text
ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
```

This is a local toolchain blocker, not an app code success. Install Android Studio, Android SDK, and JDK 17+, then set `JAVA_HOME` before building APK.

## Registered Routes

- `login`
- `responsible-profile`
- `scan`
- `scan-preview`
- `flash-search`
- `checklist`
- `edit-record`
- `dashboard`
- `export`
- `backup-cleanup`
- `admin-settings`
- `user-management`

## Android WebView Safety Review

- Plugin: `FlashProofWebViewPlugin`
- Registered in `MainActivity`.
- Allowed host: `api.flashexpress.com`
- Allowed path: `/gw/nws/web/proof/go/`
- Blocks navigation outside the allowed Flash proof URL.
- Validates Thai phone format before WebView automation.
- Uses timeout and error responses for network/loading/extraction failures.
- PWA/browser fallback remains honest and does not claim cross-site automation.

## Device QA Required

Real device validation is still required for:

- Samsung S23 FE
- Galaxy Tab A7 Lite
- iPad browser fallback
- Desktop browser

See:

- `docs/ANDROID_DEVICE_TEST.md`
- `docs/FLOW_QA_CHECKLIST.md`
- `docs/DEPLOYMENT_NOTES.md`

## Safety Constraints

- No Firebase.
- No paid cloud requirement.
- No R2 secrets in frontend.
- No fake Supabase sync success.
- No fake R2 upload/delete success.
- No fake Flash extraction success.
- No business record hard delete.
- Cleanup only removes confirmed backed-up local photo payloads.

## Remaining Production Tasks

- Real Android device QA.
- Android release signing.
- App store build/release process.
- Production R2 signed upload backend.
- Production R2 delete backend.
- Production Supabase sync hardening.
- Storage billing automation or real cloud usage reporting.
