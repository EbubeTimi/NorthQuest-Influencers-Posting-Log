# Current Project State

Updated: 2026-09-16

## Active work

- Branch: `codex/northquest-performance-bootstrap`
- Goal: keep name selection visually quiet while creator rows load; show progress only inside the View my logs modal.
- The UX adjustment is tested locally and is not yet deployed.

## Completed

- Added the complete current Google Apps Script as `Code.gs` for version control.
- Combined the creator roster and remembered creator's recent rows into one startup request.
- Added short-lived Apps Script caches for the public roster, per-creator logs, per-creator pay, bonus tiers, and bonus categories.
- Added cache invalidation after submissions and relevant creator, payment, intake, and bonus mutations.
- Preserved the existing admin bootstrap and intake request contracts.
- Removed the empty 3-byte `new code gs (1).txt` upload placeholder after importing the complete script.
- Deployed the matching Apps Script backend as Version 42 while preserving the existing web-app URL.
- Published the optimized creator frontend to `main` and restored GitHub Pages from `main` `/ (root)` after the repository's public/private visibility change disabled it.
- Removed the inline `Fetching your dashboard` banner during name selection; the View my logs modal still owns the spinner and progressive loading message.

## Verification

- `node --test tests/*.test.js`: 16 tests passed.
- `Get-Content -Raw Code.gs | node --check -`: passed.
- `git diff --check`: passed for the current UX adjustment.
- Production creator list: 63 names; first cold load observed at about 26 seconds and immediate cached load at about 0.36 seconds.
- GitHub Pages deployment for commit `b05b18eacd04058b2073b2542360fc602fc6cd4b` completed successfully; the live posting log and intake page both loaded.

## Next action

- After explicit production approval, commit the quiet-loading UX adjustment and publish the updated `index.html` to `main`.

