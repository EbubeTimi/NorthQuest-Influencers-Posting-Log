# Implementation plan after prototype approval

Production UI work remains blocked until the prototype is explicitly approved.

## Dependency order

1. **Restore proofable database truth** — expose Supabase MCP to this task, compare tracked migrations with the live ledger/schema, regenerate the schema snapshot, and add deterministic bootstrap/migration/auth smoke commands. Stop if hashes or environment identity disagree.
2. **Stabilize identity/membership access** — explicit enabled/deactivated membership state, server-side business selection, cross-tenant denial tests, and immediate chooser routing.
3. **Introduce shared cycles** — one stored cycle source in Africa/Lagos, cycle-specific report keys, post-join obligation query, atomic logging gate, wrong-business and concurrency tests.
4. **Automate trial qualification** — fixed 10,000 per-video rule, idempotent trigger/RPC, single notification, audit event, no manual decision path; migrate old `trial_approved` semantics forward.
5. **Add migration opening balances** — validated August count import with attribution; do not fabricate links/videos.
6. **Repair weekly Drive collation** — consume cycle-specific reports, designated folders, leases/idempotency/reconciliation, bounded batches.
7. **Replace monthly Apify job** — no week-one scrape; cumulative 1–14, 1–21, and 1–month-end windows; cost guard and one-business retry isolation; live sandbox spot-check requires explicit approval because it spends credits.
8. **Build approved creator UI** — absorb the approved prototype into real components; remove every prototype control/mock afterward.
9. **Build CashDrive inventory and enquiries** — separate bounded flows after tenant/auth/cycle contracts are green.
10. **Hardening and release proof** — audit log, pagination/load test over 1,000 creators, secret/dependency scans, accessibility, preview deployment, RLS caller tests, rollback/forward-fix runbook. Production deployment requires explicit approval.

## Test-first proof requirements

- Unauthenticated, wrong-role, wrong-business, disabled-membership, stale-active-business, and cross-object denial.
- Join during every day of a cycle; month/year/timezone boundaries; retry and concurrent report/log submissions.
- Different videos at 6,000 + 6,000 do not qualify; one video at 9,999 does not; one video at 10,000 does; retries notify once.
- Deactivating CashDrive does not disable NorthQuest/Aura for the same login.
- Migration import rerun is idempotent and preserves Google Sheet history.
- Automation crash after external success but before local acknowledgement reconciles without duplicates.
- Admin list/analytics load at 1,000+ creators remains within a named numeric budget.

## Current blockers to production implementation

- Explicit UI approval has not yet been given.
- Supabase live schema/ledger and real-caller RLS cannot be checked because its MCP tools are not exposed in this task.
- Vercel project linkage/deployment configuration cannot be read through MCP in this task.
- Apify actor inputs/outputs have not had a real paid test; spending is not authorized.
