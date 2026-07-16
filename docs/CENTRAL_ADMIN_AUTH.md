# Central Admin Authorization

Backoffice access is centrally controlled through Google Sheets + Apps Script.

## AdminDevices Sheet

Columns:

- `deviceId`
- `deviceName`
- `ownerName`
- `role`
- `status`
- `approvedAt`
- `revokedAt`
- `lastLoginAt`
- `note`

Valid statuses: `PENDING`, `APPROVED`, `REVOKED`.

Valid admin roles: `OWNER`, `ADMIN`. `VIEWER` cannot unlock Backoffice.

## Rules

- Employee devices open Frontline only by default.
- An unapproved device cannot enter Backoffice.
- Employees cannot approve themselves.
- Backoffice unlock requires an approved AdminDevices row and central Admin PIN verification.
- If the central Admin PIN is not configured, Backoffice stays locked and shows the contact-admin message.

## Apps Script Actions

Implemented actions:

- `requestAdminAccess`
- `verifyAdminAccess`
- `listAdminDevices`
- `approveAdminDevice`
- `revokeAdminDevice`
- `getAdminAuthStatus`

`ADMIN_PIN_ENABLED` and `ADMIN_PIN_HASH` live in the Settings sheet. The PIN hash is SHA-256 hex.
