# Hub Vehicle Proof Capture

Mobile-first project foundation for Hub vehicle proof capture.

This repository is prepared for GitHub and Codex MVP development. MVP-004 adds the full-screen QR scan mobile UI foundation and manual QR/barcode parsing. It does **not** claim real camera QR scanning, OCR, Flash WebView automation, R2 upload, photo upload, Export, Backup execution, or Cleanup execution are complete yet.

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
- Supabase client configuration guard
- Supabase migration draft for Auth/Postgres roles and RLS

## Implemented MVP foundations

MVP-002 database/auth foundation:

- Supabase Free target for Auth/Postgres/Realtime/API
- `staff`, `supervisor`, and `admin` roles
- Tables for users, branches, responsible profiles, vehicle records, route rows, vehicle photos, edit history, backup jobs, cleanup jobs, storage snapshots, and app settings
- RLS draft policies where staff can view/create own records, supervisors can view branch records, and admins can manage all records
- Safe missing-env behavior that shows `Supabase ยังไม่ได้ตั้งค่า` instead of crashing

MVP-004 QR scan UI foundation:

- Full-screen mobile-first scan page with a large camera placeholder frame
- Manual QR URL or raw barcode input
- Flash proof URL parsing from the last URL path segment
- Vehicle barcode normalization and validation
- Local scan draft persistence in `localStorage`
- Scan preview page showing barcode, source URL, responsible profile, and an MVP-005 OCR placeholder note
- Safe camera scanner messaging when direct browser QR scanning is unavailable or not yet connected

Future MVPs will add:

- Responsible profile production flow if not already present in the target branch
- Real camera QR scanner integration
- OCR phone reading
- Android native WebView plugin for Flash auto-fill
- Cloudflare R2 Free for photos/screenshots/backups
- Exact 21.6 XLSX/ZIP export
- Backup Reminder + Cleanup Guard

## Install

```bash
npm install
```

## Environment

Copy `.env.example` to `.env.local` for local development.

Frontend-safe values:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Server-only placeholders must never be exposed in frontend code:

```bash
SUPABASE_SERVICE_ROLE_KEY=placeholder-server-only-never-expose-to-frontend
R2_ACCESS_KEY_ID=placeholder-server-only
R2_SECRET_ACCESS_KEY=placeholder-server-only
```

If Supabase URL/key are missing, the app still opens and shows `Supabase ยังไม่ได้ตั้งค่า`.

## Run web dev

```bash
npm run dev
```

Open the URL shown by Vite. For phone testing on the same Wi-Fi, use the LAN URL if Vite prints one.

## Build

```bash
npm run build
```

## Supabase migrations

MVP-002 migration files live in `supabase/migrations/`.

The first migration creates the schema, indexes, update triggers, role helpers, and RLS draft policies. Apply it to a Supabase project with the Supabase CLI in a later environment setup step. This repository does not include real production secrets.

## QR scan UI

Use the Scan page to manually test MVP-004:

```text
https://api.flashexpress.com/gw/nws/web/proof/go/NAK1R7XJ45
```

Expected parsed barcode:

```text
NAK1R7XJ45
```

Raw barcode input such as `NAK1R7XJ45` is also accepted. Continuing requires a valid barcode and an active responsible profile from the profile flow. The camera button is a scanner integration foundation only and does not mark real camera scanning complete.

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

## Important warning

Do not mark future features as complete unless they are implemented and QA passed. Placeholder pages must stay clearly marked.
