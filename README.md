# Hub Vehicle Proof Capture

Mobile-first project foundation for Hub vehicle proof capture.

This repository is prepared for GitHub and Codex MVP development. MVP-001 contains the app skeleton only. It does **not** claim QR, OCR, Flash WebView automation, Supabase, R2, Export, or Backup features are complete yet.

## Final product goal

Staff do not know in advance how many vehicles will come each day. The system must let staff:

1. Login.
2. Select responsible profile, for example `25845 Tui`.
3. Scan QR from vehicle paper or phone screen.
4. Read driver phone number from paper.
5. Auto-fill phone in Flash proof page using Android WebView app mode.
6. Extract Flash route/status table.
7. Create vehicle record from the real scan.
8. Take required photos.
9. Export backup ZIP with exact `21.6` workbook layout and matching photo links.
10. Backup first, then cleanup old cloud photos to stay within free-tier limits.

## Stack

- React
- TypeScript
- Vite
- Capacitor Android foundation
- PWA-ready structure
- Mobile-first CSS

Future MVPs will add:

- Supabase Free for Auth/Postgres/Realtime/API
- Cloudflare R2 Free for photos/screenshots/backups
- Android native WebView plugin for Flash auto-fill
- OCR phone reading
- Exact 21.6 XLSX/ZIP export
- Backup Reminder + Cleanup Guard

## Install

```bash
npm install
```

## Run web dev

```bash
npm run dev
```

Open the URL shown by Vite. For phone testing on the same Wi-Fi, use the LAN URL if Vite prints one.

## Build

```bash
npm run build
```

## Capacitor Android

After `npm install` and `npm run build`:

```bash
npm run cap:add:android
npm run cap:sync
npm run cap:open
```

This MVP includes Capacitor config only. The native Android project is generated later by Capacitor.

## MVP roadmap

1. MVP-001 Project skeleton + PWA + Capacitor foundation
2. MVP-002 Supabase schema + auth + roles + RLS draft
3. MVP-003 Responsible profile, such as `25845 Tui`
4. MVP-004 Full-screen QR scan mobile UI
5. MVP-005 OCR phone + preview/edit
6. MVP-006 Android WebView Flash automation
7. MVP-007 Vehicle record creation + duplicate handling
8. MVP-008 Checklist photos + compression + R2 upload
9. MVP-009 Edit / redo / void / audit history
10. MVP-010 Dashboard
11. MVP-011 Export XLSX/ZIP with exact 21.6 layout
12. MVP-012 Backup Reminder + Cleanup Guard
13. MVP-013 QA mobile layout + Android build

## GitHub push steps

```bash
git init
git add .
git commit -m "MVP-001 project skeleton and Capacitor foundation"
git branch -M main
git remote add origin https://github.com/Flashdevnak/hubchecklist.git
git push -u origin main
```

If the remote already exists:

```bash
git remote set-url origin https://github.com/Flashdevnak/hubchecklist.git
git push -u origin main
```

## Important warning

Do not mark future features as complete unless they are implemented and QA passed. Placeholder pages must stay clearly marked.
