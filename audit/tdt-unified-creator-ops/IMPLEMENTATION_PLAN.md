# Implementation plan after prototype approval

Production UI and deployment remain blocked until the revised prototype is explicitly approved.

## Current handoff — 2026-08-28

Trial revision 7 visual design is approved. The active-dashboard draft and its 26 passing core checks are preserved but not yet fully browser-reviewed. The newer August 28 recruitment handoff now takes priority: extend the same approval prototype through Application → Vibe Check → Outreach → Trial Evidence → Brand Onboarding. Read `RECRUITMENT_FLOW_CONTRACT.md` and the latest conflict-register section before work. This is prototype scope only; no production UI, source Form/Sheet edits, production data change or deployment is authorized.

Use GrowthCooks Marketing Agency for the operational workspace; Aura spelling is canonical. One video link plus ≥10,000 screenshot requires management verification, already confirmed by the user's later feedback. Verified evidence is immutable. The 526-record import is a new planning scope, not permission to execute migration. Owner-only sensitive controls and exact onboarding checklist remain assumptions for review.

## Historical handoff — 2026-08-27

The latest trial-flow observations are applied in prototype revision 6: tour step 3 opens/highlights the actual weekly form; Phone works at all pane widths and during the tour; every date has Video 1/2 × TikTok/Instagram (unlogged slots visible but disabled); no third daily video; one combined 10,000-view form includes screenshot, with no separate screenshot task; corrected Google-account, paused and expired copy. Do not ask the user to repeat observations or restart the audit. This revision is trial-only and stops at onboarding-ready, not actual onboarding or an active-creator/admin dashboard.

Next: review this trial revision, then move to the active-creator dashboard as requested. The TDT application form and its management results, and actual onboarding, are separate reviewable flows too. The user will supply screenshots showing the application Sheet and sorting. Preserve their supplied form fields; do not invent a sorting workflow before seeing that reference. Continue using flow-by-flow and flow-prototype. Visual refinement still requires the user's chosen references/skill, and production UI still needs explicit approval.

Identity planning must now enforce one ongoing trial per person and a TDT-wide passed-trial result. Later business memberships are management-assigned without repeat trials. Add private screenshot proof to management review; production retention still needs a decision. All earlier per-business repeated-trial UI assumptions are superseded.

## Dependency order

1. **Prove live environment truth** — expose project-scoped Supabase and Vercel MCP tools, compare live schema, migration ledger, and configuration, and add reproducible build/auth/schema evidence.
2. **Secure personal-Google identity and invitations** — verified Google login, email-bound expiring single-use invites, membership claim transaction, management MFA, revocation, and wrong-email/replay/cross-business tests.
3. **Create managed business configuration** — period type/anchor/timezone, noon grace, Sheet destination, Apify schedule, notifications, statuses, and safe versioned audit. Keep 10,000 as a protected policy.
4. **Repair reporting periods and gate** — preserve Aura Monday–Sunday, configure other businesses, remove personal seven-day clocks, bound obligations to the completed period and join time, make per-video/platform reports idempotent, and enforce permission atomically server-side.
5. **Build trial review workflow** — one combined anytime submission with recorded post, ≥10,000 views and screenshot; only complete submissions create the idempotent management notification/review. Weekly detection may prefill this form but creates no separate proof task. Keep approval/audit and early-milestone isolation from weekly reporting; record actual submitted timestamp.
6. **Add lifecycle records** — private creator photo plus joined/deactivated/reactivated dates and reasons. Start the September operational dataset empty; do not import old creator data, links, counts, or credentials.
7. **Build TDT Applications** — structured fields/private introduction upload, review status, search/filter, export or Sheet collation, retention and access controls.
8. **Build CashDrive Inventory and Enquiries** — separate structured workspaces using the supplied form fields, tenant RLS, filters, ownership, follow-up, and history.
9. **Repair automations** — per-business weekly Sheets collation and Apify windows 1–14, 1–21, 1–month-end with ledgers, leases, retries, reconciliation, and cost guards.
10. **Implement the approved phone-first UI** — absorb approved prototype patterns into real components; remove prototype controls and mocks.
11. **Harden and prove** — RLS caller matrix, invitation abuse, session/revocation, uploads, rate limits, CSRF/CSP/cookies, secret and dependency scans, accessibility, load tests beyond 1,000 creators, preview deployment and rollback/incident runbooks.

## Build verification result on 2026-08-25

- Locked dependencies installed after replacing a truncated Next.js Windows compiler download.
- IBM Plex Sans/Serif now come from IBM's official local packages; the build no longer depends on Google Fonts.
- Next.js 16.3.3 and React 19.2.0 build successfully. All static/dynamic routes are discovered and optimized.
- The Excel export dependency uses patched UUID 11.1.1 and generates a workbook buffer successfully.
- `npm audit --omit=dev --audit-level=high` reports `0 vulnerabilities`.
- Re-run framework update, audit, and build after the announced 2026-08-26 Next.js security release and again before launch.

## Current blockers

- Trial revision 7 visual approval is recorded; recruitment and active-dashboard prototype approval, production implementation authority and launch approval remain outstanding.
- Supabase and Vercel read access now pass. Real caller-role tests and any database repair remain unperformed.
- `public._nq_scrape_jobs` has RLS disabled and is a critical launch blocker; function grants also require an explicit caller review.
- The live migration ledger and repository migration folder have live-only, local-only, and timestamp-divergent entries. Recover canonical history before any schema change or clean-bootstrap claim.
- Apify live actor proof would spend credits and is not authorized.
- Application upload retention and draft retention need explicit product decisions before production persistence.
- A September 1 release cannot be called ready until Google OAuth, invitation claim, RLS isolation, video persistence, gate enforcement, manager approval, and deactivation pass end-to-end against a non-production environment.
