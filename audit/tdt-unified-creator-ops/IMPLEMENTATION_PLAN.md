# Implementation plan after prototype approval

Production UI and deployment remain blocked until the revised prototype is explicitly approved.

## Dependency order

1. **Prove live environment truth** — expose project-scoped Supabase and Vercel MCP tools, compare live schema/migrations/configuration, and add reproducible build/auth/migration evidence.
2. **Secure personal-Google identity and invitations** — verified Google login, email-bound expiring single-use invites, membership claim transaction, management MFA, revocation, and wrong-email/replay/cross-business tests.
3. **Create managed business configuration** — period type/anchor/timezone, noon grace, Sheet destination, Apify schedule, notifications, statuses, and safe versioned audit. Keep 10,000 as a protected policy.
4. **Repair reporting periods and gate** — preserve Aura Monday–Sunday, configure other businesses, remove personal seven-day clocks, bound obligations to the completed period and join time, make per-video/platform reports idempotent, and enforce permission atomically server-side.
5. **Build trial review workflow** — one-video 10,000 detection, idempotent management notification, review queue, proof link, approve/keep-trial decision, onboarding unlock, and immutable audit event.
6. **Add lifecycle and opening position** — private creator photo, joined/deactivated/reactivated dates and reasons, plus admin-entered August starting count without historical link import.
7. **Build TDT Applications** — structured fields/private introduction upload, review status, search/filter, export or Sheet collation, retention and access controls.
8. **Build CashDrive Inventory and Enquiries** — separate structured workspaces using the supplied form fields, tenant RLS, filters, ownership, follow-up, and history.
9. **Repair automations** — per-business weekly Sheets collation and Apify windows 1–14, 1–21, 1–month-end with ledgers, leases, retries, reconciliation, and cost guards.
10. **Implement the approved phone-first UI** — absorb approved prototype patterns into real components; remove prototype controls and mocks.
11. **Harden and prove** — RLS caller matrix, invitation abuse, session/revocation, uploads, rate limits, CSRF/CSP/cookies, secret and dependency scans, accessibility, load tests beyond 1,000 creators, preview deployment and rollback/incident runbooks.

## Build verification result on 2026-08-25

- Locked dependencies installed after replacing a truncated Next.js Windows compiler download.
- `npm run build` reached the optimized compilation stage.
- The build could not finish because the existing `next/font` setup downloads IBM Plex font files from Google and `fonts.gstatic.com` timed out/stalled.
- Result: `UNVERIFIED — external font fetch blocker`. No production source-code build error was reached, but the build is not a pass.
- Recommended production repair after approval: self-host the approved font files or make the build independent of external font availability, then rerun from a clean checkout.

## Current blockers

- Revised prototype approval has not been given.
- Supabase live schema/ledger and real-caller RLS remain unavailable in this task.
- Vercel project configuration remains unavailable in this task.
- Apify live actor proof would spend credits and is not authorized.
- Application upload retention and draft retention need explicit product decisions before production persistence.
