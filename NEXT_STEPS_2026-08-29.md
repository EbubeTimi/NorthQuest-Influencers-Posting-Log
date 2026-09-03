# Next steps — work from top to bottom

State snapshot: 29 August 2026. Transfer package verified: 3 September 2026, Africa/Lagos. The September 1 target has passed, so treat all remaining launch blockers as current until freshly rechecked.

Do not skip a red step to build a dependent production flow. A prototype may continue safely while production activation remains blocked.

## 0. Start Claude Code correctly

- [ ] Open this exact repository: `C:\Users\smith\Downloads\NorthQuest-Influencers-Posting-Log`.
- [ ] Check out `codex/unified-tdt-creator-ops-prototype`; do not use `main`.
- [ ] Run `git status --short --branch` and preserve every existing dirty/untracked file.
- [ ] Start Claude Code from the repository root with `claude`.
- [ ] Approve the project instructions and project MCP configuration after reviewing them.
- [ ] In Claude Code, run `/mcp`, choose `typeui`, authenticate, and confirm it shows connected tools.
- [ ] Confirm `/flow-by-flow`, `/flow-prototype`, and `/typeui-fundamentals` appear as project skills.
- [ ] Paste the starter prompt from `CLAUDE_CODE_HANDOFF_2026-08-29.md`.

## 1. Finish the security/configuration gate

- [ ] Add these four **names and real values** to the Vercel `smithstem` project; never paste the values into chat or Git:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SECRET_KEY`
  - `CRON_SECRET`
- [ ] Scope each Vercel variable deliberately to Production, Preview, and/or Development. Do not redeploy production yet.
- [ ] Follow `audit/tdt-unified-creator-ops/RLS_LIVE_CHANGE_RUNBOOK.md`.
- [ ] Install PostgreSQL backup tools only with operator approval if the machine still lacks `pg_dump`.
- [ ] Create a private logical backup and restore it into an isolated target. A backup that was not restored successfully is unverified.
- [ ] Recheck the exact live project, migration ledger, schema, and active writers.
- [ ] Ask for explicit approval immediately before applying `smithstem/supabase/migrations/20260829010000_harden_public_scrape_jobs_and_routines.sql` to live Supabase.
- [ ] After approval, apply only that reviewed migration; run wrong-role, cross-object, and cross-tenant checks as real callers; rerun Supabase Security Advisor.
- [ ] If any post-check fails, stop writers as described in the runbook and follow the reviewed forward-fix/rollback decision. Report the failure immediately.

Completion: backup restore passed, migration ledger is correct, live RLS is proven for real callers, Security Advisor is clear for the affected tables/functions, and all four Vercel variables are confirmed without exposing values.

## 2. Verify and approve brand onboarding prototype

- [ ] Start the local prototype server from `prototypes`: `python -m http.server 4173`.
- [ ] Open `http://127.0.0.1:4173/onboarding.html?screen=ready` in a phone viewport.
- [ ] Run `node tests/onboarding-prototype.test.js` from the repository root.
- [ ] Recheck happy path, save failure/retry, correction, cancellation, wrong identity/business, paused access, keyboard order, focus recovery, screen-reader names, and reduced motion.
- [ ] Show the user the prototype and obtain explicit approve/revise/reject feedback.
- [ ] If revised, update the prototype only and re-prove it. Do not implement production onboarding UI yet.

Completion: explicit prototype approval plus fresh automated and phone runtime proof.

## 3. Complete the active creator dashboard prototype

- [ ] Read `prototypes/ACTIVE_CREATOR_BRIEF.md` and the shared flow contracts before editing.
- [ ] Inspect the preserved draft `prototypes/active-creator-dashboard.html`; do not recreate it.
- [ ] Run `node tests/active-prototype.test.js` and fix any failures without changing locked rules.
- [ ] Verify phone-first flows: one membership, multiple memberships, business chooser/switcher, Today, eligible Yesterday until noon, two daily video slots, weekly view gate, actual-link-only four-box reporting rows, bonus claim, settled payments, paused business, expired session, offline/save retry.
- [ ] Prove no record/draft/report/claim/payment crosses businesses.
- [ ] Obtain explicit prototype approval.

Completion: approved active-creator prototype and verified transitions; still no production UI.

## 4. Prototype the unified management dashboard

- [ ] Map one manager journey across recruitment, trials, evidence, onboarding, active creators, deactivation/reactivation, notifications, and audit history.
- [ ] Add business filters without duplicating people or exposing another tenant.
- [ ] Show joined/deactivated/reactivated dates, actor, reason, evidence anchors, and safe history.
- [ ] Keep high-impact whole-person suspension separate from one-business deactivation.
- [ ] Add loading, empty, denied, error, retry, cancellation, stale/conflict, and phone states.
- [ ] Use Flow Prototype and TypeUI; obtain explicit approval.

Completion: one approved management flow, not several disconnected dashboards.

## 5. Prototype CashDrive Enquiries

- [ ] Preserve the inspected source fields: referrer, potential buyer name/contact, requested vehicle, inquiry date, source, budget, urgency, lead status, and notes.
- [ ] Create creator submission and CashDrive-management list/detail/status flows.
- [ ] Make WhatsApp/contact actions explicit and auditable; opening WhatsApp is not proof a message was sent.
- [ ] Enforce CashDrive-only access and append-only history.
- [ ] Obtain explicit prototype approval.

## 6. Prototype CashDrive Inventory

- [ ] Define vehicle identity, price, specifications, media, availability, publication state, and change history.
- [ ] Link enquiries to vehicles when known without making the link mandatory.
- [ ] Cover sold/unavailable conflicts, concurrent edits, private media, validation, and audit history.
- [ ] Obtain explicit prototype approval.

## 7. Implement approved flows as one secure vertical slice

- [ ] Only after the representative prototypes are approved, implement identity/invitations/membership authorization, private uploads, immutable evidence, onboarding, active dashboard, and management review through real interfaces.
- [ ] Use personal Google login; invitation email must match; one person can have separate memberships; one ongoing trial globally; passing trial is TDT-wide.
- [ ] Introduction videos and evidence screenshots use private storage, validated type/size, short-lived signed viewing, and an approved retention policy. Do not claim Google Drive integration until the website upload and reviewer playback are proven end to end.
- [ ] Require durable backend confirmation before showing submission success. Use idempotency for retries and notifications.
- [ ] Add real RLS tests for unauthenticated, wrong-role, wrong-business, cross-object, deactivated, and revoked-session callers.

## 8. Build Sheets and Apify operations

- [ ] Collate accepted weekly self-reported views to each business's designated Google Sheet/Drive destination.
- [ ] Do not change the source recruitment Form or Sheets.
- [ ] Schedule Apify across every business only for cumulative 1–14, 1–21, and 1–month-end windows; no week-one scrape.
- [ ] Add idempotency, leases, bounded retries, cost guards, reconciliation, per-business isolation, run ledger, and notifications.
- [ ] Test duplicate delivery, partial success, crash/retry, expired lease, and one-business failure.

## 9. End-to-end release rehearsal

- [ ] Run a clean build and relevant test suites from a clean checkout.
- [ ] Rebuild the database from zero in an isolated environment twice and prove deterministic/idempotent bootstrap.
- [ ] Test real Google invitation/sign-in, private upload/view, recruitment-to-membership handoff, trial weekly gate and evidence, manager decision, onboarding, active switcher, deactivation, enquiries, inventory, Sheets, and Apify.
- [ ] Load-test the important lists/queries/jobs beyond 1,000 creators with pagination and indexed lookups.
- [ ] Run accessibility, mobile keyboard, reduced motion, security, secret scan, dependency audit, backup/restore, logging/redaction, monitoring, and rollback checks.
- [ ] Record every failure, impact, fix, and rerun result.

## 10. Final UI/UX pass and release approval

- [ ] Use one published TypeUI design direction across creator and management surfaces.
- [ ] Perform a full phone-first UI/UX pass after flows are complete: spacing, typography, density, hierarchy, borders, touch targets, focus, contrast, loading/empty/error states, and plain copy.
- [ ] Show the final prototype/preview to the user for explicit UI approval.
- [ ] Request separate explicit approval before production UI implementation and again before production deployment.
- [ ] Do not call September 1 “ready” unless all release rehearsal checks pass.

## Launch blockers at handoff

- Live Supabase RLS migration has not been applied.
- No Vercel environment variables were present when the user checked.
- Brand onboarding prototype is verified but not yet explicitly approved.
- Active creator prototype is unfinished/unapproved.
- Unified management, CashDrive Enquiries, CashDrive Inventory, Sheets/Apify, and complete production integration are not finished.
- Temporary Google Drive introduction-video storage is selected conceptually, but website upload, private reviewer playback, retention, deletion, and durable audit are not implemented.
