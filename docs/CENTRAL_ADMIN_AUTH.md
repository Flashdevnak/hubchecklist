# Central Admin Authorization

RESET-008A uses simple central Admin PIN protection by default.

## Default Login

1. App opens Frontline.
2. Admin taps the small Backoffice icon.
3. Login modal asks only for `Admin PIN`.
4. Apps Script verifies the PIN server-side.
5. Correct PIN opens Backoffice.
6. Wrong PIN shows `PIN ไม่ถูกต้อง`.

No device approval is required by default. This keeps daily operation practical.

## PIN Storage

Apps Script stores the PIN as a SHA-256 hash:

- Script Properties: `ADMIN_PIN_HASH`
- Settings sheet status: `ADMIN_PIN_ENABLED`, `ADMIN_PIN_SET`

The real PIN is never returned to the app.

Backoffice Settings can change the central PIN through the `setAdminPin` action. Admins should not manually edit `ADMIN_PIN_HASH`.

RESET-009 keeps the default login simple: the modal asks only for `Admin PIN`. Device approval remains an optional advanced setting inside Backoffice after unlock.

Safe Apps Script actions:

- `verifyAdminAccess`
- `getAdminAuthStatus`
- `setAdminPin`
- `initOrRepairStorage`

`ADMIN_PIN_HASH` stays in Script Properties/Settings and is never returned by safe bootstrap/settings responses.

## First Setup

If no PIN exists, Backoffice shows:

```text
ยังไม่ได้ตั้งค่า PIN หลังบ้าน กรุณาติดต่อผู้ดูแลระบบ
```

First setup requires Apps Script property `ADMIN_SETUP_TOKEN` and the Backoffice Settings PIN setup flow after an authorized setup path. Normal staff never see first-time setup.

## Optional Device Approval

AdminDevices remains available as optional advanced security.

Default:

- `REQUIRE_ADMIN_DEVICE_APPROVAL=false`
- Admin PIN only

If enabled:

- deviceId must exist in AdminDevices
- status must be `APPROVED`
- role must be `OWNER` or `ADMIN`
- Admin PIN must also be correct

## Apps Script Actions

- `verifyAdminAccess`
- `setAdminPin`
- `getAdminAuthStatus`
- `requestAdminAccess`
- `listAdminDevices`
- `approveAdminDevice`
- `revokeAdminDevice`
