# HubChecklist Google Apps Script

This folder contains the free central storage bridge for RESET-004.

Storage stack:

- Google Sheets stores records, photo metadata, hubs, responsible staff, and audit rows.
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
- `getResponsibleStaff`
- `getRecords`
- `appendAudit`
- `healthCheck`

## Security Notes

- The shared secret is stored locally in the app only.
- Do not commit real secrets.
- The Apps Script rejects requests with a missing or incorrect token.
- This is a free central storage bridge, not enterprise identity management.
