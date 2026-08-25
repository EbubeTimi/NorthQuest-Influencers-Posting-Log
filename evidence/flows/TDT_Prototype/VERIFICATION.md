# TDT prototype verification

## Outcome

The local, read-only prototype is traversable across every requested pathway. Two defects were found during runtime review and fixed before handoff:

1. Qualification was initially stored globally and leaked across business switches. It is now business-scoped.
2. Gate validation initially targeted the wrong missing field in one test path. It now marks current invalid fields with `aria-invalid` and focuses the first missing field.
3. The phone layout initially placed review controls before the product. It now presents the proposed product first and review controls below it.

## Automated proof

- `node tests/manage-bonus.test.js` — `PASS` (13 existing legacy checks).
- `node tests/prototype-contract.test.js` — `PASS` (12 prototype contract checks).
- `git diff --check` — run before commit.

## Runtime proof

- Sign-in validation, code expiry, chooser, dashboard, business switch, Escape focus restoration, weekly gate, automatic onboarding, deactivation, offline retry, and validation recovery: `PASS`.
- Viewports 390×844, 768×900, 1280×900: `PASS`, no horizontal overflow.
- Reduced motion: `PASS`, transition duration observed as 1ms.
- Browser console: `PASS`, no warnings or errors.
- Visual review: desktop automatic-unlock and phone gate states inspected.

## Baseline application build

`UNVERIFIED`. Two clean `npm ci` attempts stalled while fetching large packages. The npm log shows the `exceljs` tarball took 886,565ms after an `ECONNRESET`; the interrupted install never created `node_modules/.bin/next.cmd`, so `npm run build` could not start. This is recorded as an environment/dependency-install failure, not a Smithstem source failure.

## Flow-by-flow gates

| Gate | Result | Reason |
| --- | --- | --- |
| Gate 1 — foundation structure | N/A | Existing application audit, not a new foundation declaration |
| Gate 2 — foundation execution | UNVERIFIED | Live Supabase MCP tools and real caller identities unavailable |
| Gate 3 — build evidence | UNVERIFIED | Production dependency install did not complete; prototype tests and runtime proof pass independently |
| Gate 4 — build-state truth | UNVERIFIED | No project-owned runtime-proof/migration-state command; live migration ledger unavailable |
| Gate 5 — skill installation | PASS | Both skills are present, version 2.0.1, with every named reference |

## Proof boundary

This prototype proves interaction intent only. It does not prove production UI, RLS, persistence, notifications, Google integration, Apify behavior, native feedback, or deployment. Assurance is `self-reviewed, lower assurance` because no independent subagent/reviewer was requested.
