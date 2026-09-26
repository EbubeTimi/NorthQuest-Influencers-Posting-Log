# Current Project State

Updated: 2026-09-26

## Active work

- The 1.56 GB contract-signing walkthrough has been converted to a 23.96 MB H.264/AAC fast-start web copy and embedded directly in the intake contract step. The Drive dependency is removed; the contract link, instructions, agreement, and signed-file upload flow are unchanged. This update is locally verified and awaiting production deployment approval.

- Release branch: `codex/sep26-bonus-release` from production `main` at `5fbedb275a32e293f7e4ceb09ca50917e7cb9b7c`.
- Approved September 2026 intake/payment backend is deployed as Apps Script Version 46: all new creators are video creators, the new intake base rate is internally fixed at ₦150,000, and the creator-facing intake does not disclose that figure.
- September 2026 bonus schedule adds 200,000 views = ₦70,000 and 10,000,000 views = ₦2,000,000 while preserving the legacy schedule for months before September.
- Bonus-tier edits are month-scoped; changing one month cannot reprice another month.
- Live endpoint checks confirmed September returns the new seven-tier schedule, August remains pinned to the original five-tier schedule, and unauthenticated admin requests remain denied.

- Branch: `codex/northquest-performance-bootstrap`
- Goal: remove the Apps Script request queue that makes the admin dashboard, Manage Creators, Payments, and Detailed Log slow or intermittently empty.
- The approved UX adjustment is deployed to production on `main`.
- A separate read-only interactive prototype is open for approval at `prototypes/quiet-loading-flow.html`; it makes no backend calls and does not alter production.
- The admin performance fix is deployed to production: Apps Script Version 43 plus GitHub Pages commit `698741b1cbe63031ca81937d37567af4f0a8c2ef`.
- The browser-side follow-up is live: admin refreshes now redraw only the visible screen instead of rebuilding every hidden admin table.
- The phone-resume repair is deployed to production on GitHub Pages commit `e8747209816d98c84044017ab692b651e548fd50`: restored mobile tabs now replace stale admin counts with the existing loading state before forcing a fresh bootstrap request.
- The second admin-delay repair is deployed to production: Apps Script Version 44 plus GitHub Pages commit `313a665219fd804ffc3a69b93300c8d1b33e701b`. The browser now requests a compact admin shell and the current-month log separately, retries each after 15 seconds instead of holding every page behind a 60-second combined response, and keeps confirmed data visible during background refreshes.
- The approved intake contract-step change is live on GitHub Pages commit `8d30c945a8cc1490dd7e845452488e71977b7f39`: walkthrough first, written Fill & Sign instructions second, contract link next, and a signed file required before submission. Apps Script was not changed.

## Completed

- Replaced the intake's WhatsApp/video choice with one fixed video-creator payload and preserved existing administrator-set rates on repeat intake.
- Rebuilt the creator-facing pay explanation as a readable seven-row milestone list and changed both detail steps to compact underline fields without card nesting.
- Added month-aware bonus calculation to the app, exports, admin manage controls, and new spreadsheet-register formulas.
- Applied a September floor of ₦150,000 only to legacy ₦100,000 defaults; older months retain their original rate and explicit monthly overrides still win.

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
- Added a focused frontend repair so admin bootstrap and historical-month responses render only the currently visible admin screen; hidden screens render when opened through the existing `showPage()` path.
- Published the visible-screen-only frontend repair to `main` in commit `698741b1cbe63031ca81937d37567af4f0a8c2ef`; Apps Script remains on Version 43 because no backend code changed.
- Added a `pageshow` back-forward-cache check for restored mobile pages and a loading-state transition before stale admin data is refreshed.
- Published the phone-resume frontend repair to `main` in commit `e8747209816d98c84044017ab692b651e548fd50`; Apps Script remains on Version 43 because no backend code changed.
- Reproduced the remaining delay on a clean admin reload: Apps Script execution history showed each `doGet` completing in roughly 2–6 seconds while the browser stayed in its loading state until the 60-second client timeout and retry.
- Added a protected `getAdminShell` endpoint that excludes detailed posting rows, retained `getAdminBootstrap` for rollback compatibility, and changed admin startup to fetch `getAdminShell` plus `getAdminMonth` as two bounded parallel requests.
- Changed resumed admin tabs to stale-while-revalidate so the last confirmed values remain visible until fresh data arrives.
- Deployed Apps Script Version 44 on the existing web-app deployment ID/URL, preserving Version 43 as the rollback target.
- Published the matching `Code.gs` and `index.html` to production `main` in commit `313a665219fd804ffc3a69b93300c8d1b33e701b`.

## Verification

- September release suite: `node --test tests/*.test.js` passed, including August/September bonus isolation, September base-pay floor, and admin override preservation.
- `Code.gs`, inline `index.html`, and inline `intake.html` JavaScript parsed successfully; `git diff --check` passed.
- Local browser verification passed for the approved milestone screen and compact detail form; all seven September tiers render and the removed creator-type choice is absent.
- Impeccable detector was run on both changed UI files. Its remaining warnings are inherited brand/style patterns or false positives from legacy selectors; no blocking functional issue was found.

- `node --test tests/*.test.js`: 16 tests passed.
- `Get-Content -Raw Code.gs | node --check -`: passed.
- `git diff --check`: passed for the current UX adjustment.
- Production creator list: 63 names; first cold load observed at about 26 seconds and immediate cached load at about 0.36 seconds.
- GitHub Pages deployment for commit `b05b18eacd04058b2073b2542360fc602fc6cd4b` completed successfully; the live posting log and intake page both loaded.
- Prototype source validation passed; browser pathway checks passed for quiet name selection, modal-only loading, loaded, empty, error, retry, reduced-motion, and local decision states.
- GitHub Pages run `35072250037` completed successfully for production commit `b3f1133f7cc235c2247132c29bb6d49a12432c39`.
- Live smoke test passed: the creator list loaded, selecting another creator showed no inline `Fetching your dashboard`, the monthly logs button remained available, and its modal opened with the creator data.
- Admin performance regression suite: `node --test tests/*.test.js` passed 22/22 tests, including static and executable visible-screen-only refresh guards.
- Admin bootstrap runtime test confirms one Posting Log read and only current-month rows in the startup payload.
- `index.html` inline JavaScript and `Code.gs` both pass syntax checks; `git diff --check` passes.
- Version 43 endpoint verification passed: the new protected admin bootstrap is recognized and rejects an unauthenticated call; the creator bootstrap still returns the live roster.
- GitHub Pages run `35130571390` completed successfully for commit `d5247b8132aad6ce67045ec35f9cc49726a2fa27`.
- The live Pages file is byte-for-byte identical to the tested local `index.html`; markers for the combined admin bootstrap, lazy month endpoint, and removed automatic Payments refresh are present.
- Authenticated live admin verification passed for Dashboard (5,688 total posts, 1,070 in September, 62 active creators), Manage Creators, Payments (56 register rows), and September Detailed Log (1,070 rows).
- August Detailed Log eventually loaded 1,815 rows, but the first attempt failed after a long wait and a retry remained slow. Apps Script execution history showed the corresponding Version 43 web-app jobs completing in roughly 1–5 seconds, isolating the remaining delay to the browser rebuilding hidden admin tables after each response.
- The visible-screen-only patch passes the full 22-test suite, `Code.gs` syntax, `index.html` inline JavaScript syntax, and `git diff --check`.
- Live commit `698741b1cbe63031ca81937d37567af4f0a8c2ef` contains only the expected 20-line addition and 4-line replacement in `index.html`.
- Authenticated post-deployment timing checks passed: Dashboard loaded in about 0.6 seconds (5,745 total posts, 1,127 in September, 64 active creators, 2 today), Manage Creators in about 0.9 seconds (71 rows), Payments in about 0.8 seconds (57 rows), September Detailed Log in about 1.6 seconds (1,127 rows), and August Detailed Log in about 8.3 seconds (1,815 rows).
- When Dashboard first rendered, the hidden Detailed Log, Manage Creators, and Payments tables each still contained only their placeholder row, confirming the hidden-table rebuild was removed in production.
- The phone-resume repair passes its executable regression test, the complete 23-test suite, inline `index.html` JavaScript syntax validation, and `git diff --check`.
- Remote `main` was verified at `e8747209816d98c84044017ab692b651e548fd50`; the live GitHub Pages document contains the `pageshow`, `beginAdminRefresh`, and forced-bootstrap markers and reports no browser console errors.
- Split-bootstrap regression suite: `node --test tests/*.test.js` passed 25/25 tests, including an executable two-response settlement check; `Code.gs`, inline `index.html` JavaScript, and `git diff --check` passed.
- Version 44 endpoint verification passed: `getAdminShell` is recognized and rejects an unauthenticated call instead of returning `Unknown action`.
- GitHub Pages run `35269063117` completed successfully for production commit `313a665219fd804ffc3a69b93300c8d1b33e701b`.
- The live Pages document is byte-for-byte identical to the tested local `index.html`; the creator route loaded 66 dropdown options in about 0.34 seconds and produced no browser warnings or errors. Authenticated admin timing remains unverified because this automation tab has no reusable admin session.
- Intake release: the focused contract tests passed 3/3 on the main-based release tree; inline intake JavaScript syntax and the two-file release diff passed. The unrelated admin bonus test fails identically on untouched `main` and the release tree because its DOM fixture lacks `parentNode`. GitHub Pages run `35751947432` succeeded, and the live contract page renders the new video link, written Fill & Sign steps, contract link, and upload control; no real creator submission or Drive upload was performed.
- Embedded walkthrough update: the focused intake tests passed 3/3 and the full test command passed; FFprobe confirmed the new media is H.264/AAC, 720x1558, 821.99 seconds, and 23,959,809 bytes. A full FFmpeg decode completed with exit code 0. The local contract step rendered the inline player and fallback link. Starting playback crashes the Codex in-app browser's local-media tab, so playback in a normal phone/browser remains unverified until a preview or production URL is published.

## Next action

- After explicit deployment approval, publish the embedded walkthrough change and verify playback from the live HTTPS GitHub Pages URL on a normal browser or phone. If needed, separately verify the signed-contract upload with an authorized disposable creator submission; this was not exercised during the live intake smoke test. The earlier admin timing/security-review and CashDrive/Aura replica work remains separate.


