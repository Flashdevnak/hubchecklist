# Hub Vehicle Proof Capture

Mobile-first project foundation for Hub vehicle proof capture.

MVP-007 adds local-first vehicle record creation, duplicate handling, checklist record preview, dashboard counts, basic edit history, and void flow. It does **not** implement R2 upload, photo upload, export, backup, cleanup, or final 21.6 export.

## Final Product Goal

Staff do not know in advance how many vehicles will come each day. The system must let staff create records on demand from real scans, not from a daily pre-imported list.

## Current MVP Foundations

- MVP-002: Supabase schema/auth/roles/RLS draft
- MVP-004: Full-screen QR scan UI foundation
- MVP-005: OCR phone preview/edit foundation
- MVP-006: Android WebView Flash automation foundation
- MVP-007: Vehicle record creation and duplicate handling

## MVP-007 Behavior

- Reads Flash result draft from `hubchecklist.flashProofResultDraft`
- Creates local vehicle records first
- Uses `hubchecklist.vehicleRecords` for local record storage
- Uses `hubchecklist.vehicleRecordEditHistory` for audit entries
- Detects exact duplicate records
- Detects same-day same-barcode conflicts when phone/route differs
- Allows opening existing record, creating a new trip, or voiding wrong records
- Never hard-deletes records by default
- Keeps voided records searchable
- Determines default checklist type:
  - `MULTI_DROP` when route rows length is greater than 1
  - `NORMAL_ROUTE` otherwise
- Sets required photo placeholders for MVP-008
- Shows local/Supabase storage mode honestly

## Supabase Behavior

The app works without Supabase keys. If Supabase URL and anon key are missing, records are saved locally and the UI shows:

```text
บันทึกในเครื่อง / ยังไม่ได้เชื่อม Supabase
```

If Supabase is configured, the service attempts a safe insert path and records the real result. It does not expose the service role key and does not claim sync success unless Supabase returns success.

## Install

```bash
npm install
```

## Build

```bash
npm run build
```

## MVP Roadmap

1. MVP-001 Project skeleton + PWA + Capacitor foundation
2. MVP-002 Supabase schema + auth + roles + RLS draft
3. MVP-003 Responsible profile
4. MVP-004 Full-screen QR scan mobile UI
5. MVP-005 OCR phone + preview/edit
6. MVP-006 Android WebView Flash automation
7. MVP-007 Vehicle record creation + duplicate handling
8. MVP-008 Checklist photos + compression + R2 upload
9. MVP-009 Edit / redo / void / audit history hardening
10. MVP-010 Dashboard hardening
11. MVP-011 Export XLSX/ZIP with exact 21.6 layout
12. MVP-012 Backup Reminder + Cleanup Guard
13. MVP-013 QA mobile layout + Android build

## Important Warning

Photo upload, export, backup, and cleanup remain placeholders until their MVPs. Do not mark future features as complete unless they are implemented and QA passed.
