# Current Project State

Updated: 2026-09-16

## Active work

- Branch: `codex/northquest-performance-bootstrap`
- Goal: remove the Apps Script request queue that makes the admin dashboard, Manage Creators, Payments, and Detailed Log slow or intermittently empty.
- The approved UX adjustment is deployed to production on `main`.
- A separate read-only interactive prototype is open for approval at `prototypes/quiet-loading-flow.html`; it makes no backend calls and does not alter production.
- The admin performance fix is deployed to production: Apps Script Version 43 plus GitHub Pages commit `d5247b8132aad6ce67045ec35f9cc49726a2fa27`.

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
- Built a deterministic review prototype for the creator path with pending, loaded, empty, error, retry, reduced-motion, and local approve/revise/reject controls.
- Published the approved quiet-loading adjustment to `main` in commit `b3f1133f7cc235c2247132c29bb6d49a12432c39`.
- Replaced the five-request admin startup fan-out with one protected admin bootstrap response containing the current-month log, roster, payments, bonus references, and compact all-time summary.
- Removed the automatic duplicate refresh when opening Payments and changed old admin log months to load only when selected.
- Made Payments, Manage Creators, Detailed Log, and weekly navigation share and retry one month-scoped request instead of re-reading all history.
- Deployed Apps Script Version 43 on the existing web-app deployment ID/URL, preserving public access and the Version 42 rollback target.
- Published the matching `index.html` to `main` in commit `d5247b8132aad6ce67045ec35f9cc49726a2fa27`.

## Verification

- `node --test tests/*.test.js`: 16 tests passed.
- `Get-Content -Raw Code.gs | node --check -`: passed.
- `git diff --check`: passed for the current UX adjustment.
- Production creator list: 63 names; first cold load observed at about 26 seconds and immediate cached load at about 0.36 seconds.
- GitHub Pages deployment for commit `b05b18eacd04058b2073b2542360fc602fc6cd4b` completed successfully; the live posting log and intake page both loaded.
- Prototype source validation passed; browser pathway checks passed for quiet name selection, modal-only loading, loaded, empty, error, retry, reduced-motion, and local decision states.
- GitHub Pages run `35072250037` completed successfully for production commit `b3f1133f7cc235c2247132c29bb6d49a12432c39`.
- Live smoke test passed: the creator list loaded, selecting another creator showed no inline `Fetching your dashboard`, the monthly logs button remained available, and its modal opened with the creator data.
- Admin performance regression suite: `node --test tests/*.test.js` passed 20/20 tests.
- Admin bootstrap runtime test confirms one Posting Log read and only current-month rows in the startup payload.
- `index.html` inline JavaScript and `Code.gs` both pass syntax checks; `git diff --check` passes.
- Version 43 endpoint verification passed: the new protected admin bootstrap is recognized and rejects an unauthenticated call; the creator bootstrap still returns the live roster.
- GitHub Pages run `35130571390` completed successfully for commit `d5247b8132aad6ce67045ec35f9cc49726a2fa27`.
- The live Pages file is byte-for-byte identical to the tested local `index.html`; markers for the combined admin bootstrap, lazy month endpoint, and removed automatic Payments refresh are present.
- Live creator smoke test passed: the roster loaded and the existing creator status/log controls rendered. The admin login screen rendered, but authenticated admin screen verification still requires the user's admin password/session.

## Next action

- Sign in once and verify the live Dashboard, Manage Creators, Payments, and Detailed Log screens. Roll back the web app to Apps Script Version 42 and Pages to `b3f1133f7cc235c2247132c29bb6d49a12432c39` if the authenticated admin flow regresses.
