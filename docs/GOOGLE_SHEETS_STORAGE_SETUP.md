# RESET-004 Google Sheets Storage Setup

RESET-004 adds free central storage using Google Sheets, Google Apps Script, and Google Drive.

## RESET-006-007-FINAL-PLUS Central Backend

Deploy `google-apps-script/Code.gs` as a Web App and set the resulting `/exec` URL in:

```env
VITE_APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/.../exec
VITE_APP_CLIENT_MODE=central
```

Opening `/exec` in a browser should return a JSON health response from `doGet`.

The `/exec` URL is not the employee app website. Android and Vercel builds use it as the API endpoint through `VITE_APPS_SCRIPT_WEB_APP_URL`.

The app calls `bootstrap` on startup to load Settings, Hubs, ResponsibleStaff, AdminDevices status, and policy values. Frontline staff do not configure or see Apps Script URL/token fields.

Settings keys used by central admin auth:

- `ADMIN_PIN_ENABLED`
- `ADMIN_PIN_HASH`
- `ADMIN_PIN_SET`
- `REQUIRE_ADMIN_DEVICE_APPROVAL`
- `MINIMUM_APP_VERSION`
- `GPS_MANDATORY`
- `WATERMARK_ENABLED`

RESET-008A stores the real Admin PIN only as a hash. Admins should change the PIN from Backoffice Settings; they should not manually type hash values into Google Sheets.

The app still works without this setup. When Sync mode is `Local only`, records/photos/audit remain on the device and export still works locally. When Google sync is configured, submitted records are sent to Apps Script. If sync fails, the app saves locally and shows:

```text
บันทึกในเครื่องแล้ว รอซิงก์
```

## Create Storage

1. Create a Google Sheet named `HubChecklist Central Storage`.
2. Open Extensions -> Apps Script.
3. Copy `google-apps-script/Code.gs` into the script editor.
4. Open Project Settings -> Script Properties.
5. Add:

```text
APP_SHARED_SECRET=<long random shared secret>
```

6. Deploy -> New deployment -> Web app.
7. Execute as: Me.
8. Access: Anyone with link, or restricted Workspace users if all devices can access it.
9. Copy the Web App URL.

## Configure The App

Google sync settings are protected. Open Backoffice with the local Admin PIN, then go to Settings:

1. Set Sync mode to `Google Sheets sync`.
2. Paste the Google Apps Script Web App URL.
3. Enter the same `APP_SHARED_SECRET`.
4. Tap Test connection.
5. Submit a record from Frontline.
6. If the pending queue increases, return to Settings and tap Retry sync.

## Data Created

Apps Script creates these master sheets automatically:

- `Records_All`
- `Photos`
- `Hubs`
- `ResponsibleStaff`
- `Audit`
- `Settings`
- `ExportLogs`

It also creates one readable hub-specific sheet per hub. `Records_All` remains the source of truth; hub sheets are views/copies for easier daily viewing.

Record rows use the same simplified 15 columns as Excel export. Responsible appears as one value such as `25845 TUI`. Photo date/time/GPS are on the watermarked image and full metadata remains in `Photos`.

Photo files are uploaded to Google Drive under:

```text
HubChecklist Photos/<date>/<vehicleBarcode>/
```

## Security

- No Firebase, Supabase, R2, or paid storage is required.
- The shared secret is stored only in localStorage on the device.
- Employees do not see the Apps Script URL or token in Frontline.
- Backoffice uses local device PIN protection only; it is not enterprise identity management.
- Apps Script reserves `ADMIN_PIN_ENABLED` and `ADMIN_PIN_HASH` settings keys for future central PIN hardening.
- RESET-005B prevents employees from creating the first local PIN from the normal Backoffice entry.
- Never commit a real shared secret.
- Apps Script rejects missing or incorrect tokens.

## Limitations

- This is a free storage bridge, not full user authentication.
- Apps Script can hit request size and runtime limits with many large photos.
- Google Drive quota depends on the Google account.
- Sync success must be verified in the target Google Sheet and Drive folder.
