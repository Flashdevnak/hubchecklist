# Codex / Agent Instructions

Follow these rules for every task in this repository.

## Golden rules

- Do not build the whole system in one task.
- Work one MVP at a time.
- Do not fake completed features.
- Placeholder features must be clearly labeled.
- Run build/type checks before marking complete.
- Update README, QA_CHECKLIST, and TEST_PLAN when behavior changes.

## Product rules

- Do not require daily vehicle import.
- Do not assume vehicle count is known.
- Do not assume routes are fixed.
- Create vehicle records from actual scans.
- Android WebView app mode is required for auto-filling phone on Flash page.
- PWA/mobile web mode must provide a fallback because browser cross-site automation is restricted.
- Export backup must follow exact 21.6 layout and link each photo to the right vehicle.
- Backup must succeed before cleanup deletes old cloud photos.

## QA requirement

If any check fails, fix before commit. Do not write a success summary until QA passes.
