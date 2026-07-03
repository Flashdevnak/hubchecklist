# Hub Vehicle Proof Capture

Mobile-first Hub vehicle proof capture app for QR intake, Flash proof workflow, checklist photos, audit history, dashboard operations, XLSX/ZIP export, and backup-safe cleanup.

MVP-014 verifies Android APK debug build readiness and records the successful local APK build. It does **not** implement production R2 backend, app store release, or fake Flash live automation success.

## Current QA Result

- Web dependencies install with npm audit warnings from existing dependencies.
- TypeScript build passes.
- Production web build passes.
- Capacitor Android sync passes.
- Capacitor doctor passes.
- Java exists at `C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot` and works when set for the current process.
- Android SDK exists at `C:\Users\myhou\AppData\Local\Android\Sdk`.
- Android debug APK build passes.
- APK path: `android/app/build/outputs/apk/debug/app-debug.apk`.
- Physical device testing is still pending.

## MVP Status

| MVP | Status | Notes |
| --- | --- | --- |
| MVP-001 Project skeleton + Capacitor | Complete | PWA/mobile foundation exists |
| MVP-002 Supabase schema/auth/RLS draft | Complete | App still works without Supabase keys |
| MVP-003 Responsible profile | Complete | Local active profile flow |
| MVP-004 Full-screen QR scan UI | Complete | Manual fallback remains honest |
| MVP-005 OCR phone preview/edit | Complete | OCR foundation/manual text flow |
| MVP-006 Android WebView Flash foundation | Complete | Requires physical Android validation |
| MVP-007 Vehicle records + duplicates | Complete | Local-first records |
| MVP-008 Checklist photos + compression + R2 foundation | Complete | R2 upload not faked when endpoint missing |
| MVP-009 Edit/redo/void/audit | Complete | Local audit history |
| MVP-010 Dashboard hardening | Complete | Search/filter/sort/alerts |
| MVP-011 XLSX/ZIP exact 21.6 export | Complete | Browser ZIP/export works locally |
| MVP-012 Backup Reminder + Cleanup Guard | Complete | Cleanup only confirmed backed-up local payloads |
| MVP-013 Android QA readiness | Complete | Docs/checklists added; APK build needs Java/Android SDK |
| MVP-014 Android APK build readiness | Complete | Debug APK build passed; real device QA pending |

## Key Docs

- [Android device test guide](docs/ANDROID_DEVICE_TEST.md)
- [Flow QA checklist](docs/FLOW_QA_CHECKLIST.md)
- [Deployment notes](docs/DEPLOYMENT_NOTES.md)
- [APK build result](docs/APK_BUILD_RESULT.md)
- [Real device test result](docs/REAL_DEVICE_TEST_RESULT.md)
- [Project spec](docs/PROJECT_SPEC.md)

## Commands

```bash
npm install
npx tsc -b
npm run build
npx cap sync android
npx cap doctor
```

Rebuild Android debug APK from the project root:

```bash
.\android\gradlew.bat -p android assembleDebug
```

Expected SDK local config after Android SDK install:

```properties
sdk.dir=C:/Users/myhou/AppData/Local/Android/Sdk
```

Manual APK install after enabling USB debugging on the Android device:

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Remaining Production Work

- Real Android device QA on Samsung S23 FE and Galaxy Tab A7 Lite.
- iPad browser fallback QA.
- Android release signing/app store packaging.
- Production R2 signed upload backend.
- Production R2 delete backend.
- Production Supabase sync hardening.
- Storage billing automation or live cloud usage metrics.
