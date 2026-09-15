# Current Project State

Updated: 2026-09-15

## Active work

- Branch: `codex/northquest-performance-bootstrap`
- Goal: reduce creator-facing startup and data-load latency without changing the established intake or admin workflows.
- Production and `main` have not been changed or deployed.

## Completed

- Added the complete current Google Apps Script as `Code.gs` for version control.
- Combined the creator roster and remembered creator's recent rows into one startup request.
- Added short-lived Apps Script caches for the public roster, per-creator logs, per-creator pay, bonus tiers, and bonus categories.
- Added cache invalidation after submissions and relevant creator, payment, intake, and bonus mutations.
- Preserved the existing admin bootstrap and intake request contracts.
- Removed the empty 3-byte `new code gs (1).txt` upload placeholder after importing the complete script.

## Verification

- `node --test tests/*.test.js`: 15 tests passed.
- `Get-Content -Raw Code.gs | node --check -`: passed.
- `git diff --check`: passed before final commit.
- Live performance of this revision remains unverified because this branch has not been deployed to Google Apps Script or GitHub Pages.

## Next action

- Review the branch, then deploy the matching `Code.gs` web-app revision and the GitHub Pages frontend only after explicit approval.
