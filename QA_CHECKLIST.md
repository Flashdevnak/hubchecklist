# QA Checklist

## MVP-013 required checks

- [x] `npm install` passes
- [x] `npx tsc -b` passes
- [x] `npm run build` passes
- [x] `npx cap sync android` passes
- [x] `npx cap doctor` passes
- [ ] Android debug build passes on local machine
- [x] Android build blocker is documented when Java/SDK are missing
- [x] All main routes are registered in `src/App.tsx`
- [x] App works without Supabase env keys
- [x] App works without R2 signed upload endpoint
- [x] End-to-end local test flow is documented
- [x] Android device test guide exists
- [x] Flow QA checklist exists
- [x] Deployment notes exist
- [x] Mobile layout checklist is updated
- [x] No fake cloud/Flash success was added
- [x] Final README explains current MVP status and remaining production tasks

## Android build blocker

Local `.\android\gradlew.bat assembleDebug` result:

```text
ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
```

Install Android Studio, Android SDK, and JDK 17+, then set `JAVA_HOME` before rerunning the Gradle build.

## Future QA gates

Every MVP must update this file before commit. If QA fails, do not mark complete.
