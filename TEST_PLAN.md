# Test Plan

## MVP-001

Goal: prove the project foundation can install, build, and render placeholder pages clearly.

Commands:

```bash
npm install
npm run build
npm run dev
```

Manual checks:

- Open Dashboard page.
- Navigate to all placeholder pages.
- Resize to mobile width.
- Confirm no horizontal overflow.
- Confirm placeholders do not pretend to work.

## Future test areas

### QR scan

- Scan Flash URL ending `NAK1R7XJ45`.
- Extract barcode `NAK1R7XJ45`.
- Handle raw barcode input.
- Handle invalid QR.

### OCR phone

- Detect Thai 10-digit phone numbers.
- Allow manual edit.
- Show multiple phone candidates.
- Store raw OCR text.

### Android WebView Flash automation

- Load only `api.flashexpress.com`.
- Auto-fill phone.
- Click search.
- Extract result table.
- Handle page changed / timeout / wrong phone.

### Responsible profile

- Create `25845 Tui`.
- Reuse saved profile.
- Store responsible code/display name on every record.
- Export filter by responsible code.

### Photo capture

- Capture required photo types.
- Compress before upload.
- Allow retake.
- Complete only when required photos are present.

### Exact 21.6 export

- Workbook includes sheet `21.6`.
- A:K, M:U, W:AE, AG:AQ blocks are correct.
- Photo cells link to exact vehicle photo.
- Photo Index sheet lists every photo.
- Missing photos display clearly.

### Backup cleanup guard

- Warnings at 60%, 75%, 85%, 95%.
- Backup ZIP includes workbook, photos, flash screenshots, manifest.
- Cleanup blocked before backup success.
- Metadata remains searchable after photo cleanup.
