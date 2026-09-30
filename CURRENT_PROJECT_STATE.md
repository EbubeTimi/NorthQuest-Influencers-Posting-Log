# Current Project State

Updated: 2026-09-30

## Active work

- Calendar-aware per-video rates are implemented locally and await production deployment approval. The selected month's real day count now controls the payment register, creator dashboard, rate editor, legend, and XLSX export: 30 days = 60 video slots, 31 days = 62, 28 days = 56, and leap-year February = 58. This is a frontend calculation-only change; no creator posts, bonuses, custom payment amounts, base-pay overrides, or Google Sheets records were changed.

- On 30 September 2026 Smith explicitly removed automatic post-based creator deactivation. Manage Creators now follows the real roster status only: zero posts never deactivates an active creator; only the administrator's Deactivate action does. Historical months use the recorded Left Date so a creator remains visible as active before their leaving month and visible under Deactivated in the month they were fired. The release is live on production `main` commit `71004292c9b88672416a1fbb0736026577d91417`, with the tabs renamed to Active creators / Deactivated creators.

- The clean operational stability release is deployed. It contains only the month-resilience, creator-summary, custom-column persistence, ordered payment-save and manual-deactivation repairs. The separate creator-authentication, security-hardening and intake duplicate-guard work remains excluded.
- End-to-end creator bonus/dashboard repair is deployed in Apps Script Version 49 and production `main`. A creator log response now carries that creator's pay row, base rate, performance tiers, and custom payment columns in one Apps Script execution instead of queueing four calls. The browser consumes the combined payload during remembered-creator startup and name changes, while retaining the old separate endpoints only as rollback compatibility. Payment edits send only the changed field, run in order per creator/month, and the backend locks each read/merge/write so older requests cannot erase newer bonus values.
- The earlier loading failure for Ohia Promise Chiamaka is resolved in production: her dashboard now renders the combined creator-payment response. The live Payment Manual still contains historical duplicate encodings for Budget Videos (`10000`, `Budget Video=10000`, and `Budget Videos=10000`) on three September rows; deployed compatibility logic treats singular/plural aliases and a matching bare legacy value as one payment, and a future edit rewrites it as one direct-naira value.
- Creator payment-summary repair is deployed. Amount expected is only effective videos multiplied by rate per video; the final Total separately adds performance bonus and every saved custom payment. Referral, Budget Videos, and other saved custom payments render as their own creator-summary cards even if the separate payment-column reference request is late, stale, renamed, or unavailable.
- Custom payment-column reload repair is deployed. The backend normalizes Date/text month values, writes new month keys as text, removes all matching month rows on replacement, and collapses historical duplicate names while reading.

- The September payment-register repair is deployed on production `main` in commit `d42f6714f9ddf5105c6403350e0de35e27bf`. Payments now hides the raw Bonus Views/Special Bonus storage fields, keeps one calculated Performance Bonus column, and renders each month-defined custom payment category as its own ordered direct-naira column before Total Payable. Existing legacy `Name:count` values remain readable; new edits use exact `Name=amount` values. Regression coverage was added in follow-up commit `1120667d4e288cd46f0eb9686fdc3ba5fcde`.
- Intake draft recovery is implemented locally and awaiting production deployment approval. Reloading in the same browser tab restores the creator's current step and typed fields from session storage; a completed submission clears the draft. Browser security prevents restoring the selected contract file, so a creator who had selected one sees a clear prompt to select it again after reloading.
- The 1.56 GB contract-signing walkthrough was converted to a 23.96 MB H.264/AAC fast-start web copy and embedded directly in the intake contract step. The Drive dependency is removed; the contract link, instructions, agreement, and signed-file upload flow are unchanged. The live GitHub Pages release is commit `6602967e6ed54e48a19aad94775efd98c688745a`.

- Release branch: `codex/sep26-bonus-release` from production `main` at `5fbedb275a32e293f7e4ceb09ca50917e7cb9b7c`.
- Approved September 2026 intake/payment backend is deployed as Apps Script Version 47: all new creators are video creators, the new intake base rate is internally fixed at ₦150,000, the creator-facing intake does not disclose that figure, and name-only payment columns can be saved with direct naira amounts entered in the register.
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

- Current-tracker stability release: `node --test tests/*.test.js` passed all executable checks, including 25 Node tests plus the complete Manage Creators assertions. `Code.gs` and the inline `index.html` script parse successfully. The CRLF-aware diff check passes and no actual trailing whitespace was found. GitHub PR #4 merged as `71004292c9b88672416a1fbb0736026577d91417`; the live site contains the manual roster-status logic and no post-count deactivation inference. The creator dashboard loaded Ohia Promise Chiamaka's September rows, separate ₦30,000 referral card and ₦387,097 total from Apps Script Version 49.

- Earlier complete repository coverage also passed for the combined creator dashboard payload, no request fan-out while it is loading, ordered field-only payment saves, backend row locking, and singular/plural/bare custom-payment deduplication.
- Payment-register repair: focused tests pass 3/3 for hidden raw fields, direct-naira custom values, legacy-value compatibility, column order, totals, and XLSX export order. The complete repository test suite and inline `index.html` JavaScript syntax check pass. GitHub Pages runs 142 and 143 completed successfully. The live HTML contains the direct-amount and reorder implementations and no longer contains the raw Bonus Views or Special Bonus table headers. No Apps Script change or data migration was required.
- Intake draft recovery: focused tests passed 5/5; the complete test suite passed; inline `intake.html` JavaScript syntax and `git diff --check` passed. A local browser check entered nickname `Reload Test` and full name `Ada Reload` on the details step, reloaded the page, and confirmed both the same step and values were restored. Submission and production deployment were not exercised.

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

- With the stability release live, use the authenticated administrator session to smoke-test July/August/September month switching, manual deactivate/reactivate, payment loading, column add/reorder/reload persistence, and back-to-back amount edits against real admin data.



