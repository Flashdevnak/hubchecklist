# HubChecklist Google Apps Script

This folder contains the free central storage bridge for RESET-004.

## RESET-006-007-FINAL-PLUS

- `doGet` returns a small JSON health response for `/exec` browser checks.
- `bootstrap` returns server time, settings, hubs, responsible staff, admin auth enabled, and minimum app version.
- `AdminDevices` supports central Backoffice authorization with request/list/approve/revoke actions.
- `ADMIN_PIN_ENABLED` and `ADMIN_PIN_HASH` are Settings keys for central Admin PIN verification.

## RESET-008A

- Default Backoffice login is central Admin PIN only.
- `verifyAdminAccess` verifies the PIN server-side.
- `setAdminPin` stores `ADMIN_PIN_HASH` automatically; admins do not manually edit hash values.
- `REQUIRE_ADMIN_DEVICE_APPROVAL=false` by default. AdminDevices is optional advanced security.

Storage stack:

- Google Sheets stores simplified records, photo metadata, hubs, responsible staff, and audit rows.
- `Records_All` is the source of truth.
- A hub-specific sheet is created/updated automatically for each hub as a user-friendly view.
- Google Drive stores base64 photo files when the app sends `imageLocalData`.
- The app remains local-first. If this web app is not configured or sync fails, records stay in localStorage and move to the pending sync queue.

## Setup

1. Create a Google Sheet for HubChecklist central storage.
2. Open Extensions -> Apps Script from that Sheet.
3. Paste `Code.gs` into the Apps Script editor.
4. In Apps Script, open Project Settings -> Script Properties.
5. Add:

```text
APP_SHARED_SECRET=<your long shared secret>
```

6. Deploy -> New deployment -> Web app.
7. Execute as: Me.
8. Who has access: Anyone with the link, or your allowed Workspace users.
9. Copy the Web App URL.
10. In HubChecklist Backoffice -> Settings:
    - Set Sync mode to `Google Sheets sync`.
    - Paste the Web App URL.
    - Enter the same `APP_SHARED_SECRET`.
    - Tap Test connection.

## Actions

`doPost(e)` accepts JSON with:

```json
{
  "action": "healthCheck",
  "token": "APP_SHARED_SECRET",
  "payload": {}
}
```

Supported actions:

- `createRecord`
- `uploadPhotoMetadata`
- `syncRecord`
- `getHubs`
- `upsertHub`
- `deactivateHub`
- `getResponsibleStaff`
- `upsertResponsibleStaff`
- `deactivateResponsibleStaff`
- `getSettings`
- `updateSetting`
- `getBootstrapData`
- `getRecords`
- `appendAudit`
- `healthCheck`

RESET-009A admin settings persistence:

- `Hubs` columns are `hubCode | hubName | active | note`.
- `ResponsibleStaff` columns are `employeeCode | employeeName | hubCode | active | note`.
- Deactivate actions set `active = FALSE` instead of hard deleting rows.
- `updateSetting` allows only safe UI settings: `GPS_REQUIRED` / `GPS_MANDATORY`, `WATERMARK_ENABLED`, `REQUIRE_ADMIN_DEVICE_APPROVAL`, and `MINIMUM_APP_VERSION`.
- Secret/admin keys such as `ADMIN_PIN_HASH`, `ADMIN_SETUP_TOKEN`, and `APP_SHARED_SECRET` are not exposed through editable app settings.

## RESET-005A Layout

Records use the simplified 15-column layout documented in `SHEET_SCHEMA.md`.

Responsible staff is shown as one value, for example:

```text
25845 TUI
```

Photo columns contain the Drive URL or file name when available. Date/time/GPS are visible on the photo watermark and remain stored in `Photos` metadata.

## Security Notes

- The shared secret is stored locally in the app only.
- Do not commit real secrets.
- The Apps Script rejects requests with a missing or incorrect token.
- This is a free central storage bridge, not enterprise identity management.
- `ADMIN_PIN_ENABLED` and `ADMIN_PIN_HASH` are reserved in the `Settings` sheet for future central PIN verification.
