# September 1 launch contract

Target date: 2026-09-01  
Current review date: 2026-08-28
Data decision: September creator operations start fresh. The new recruitment handoff authorizes planning a separate 526-application import, not executing it. No old video links, counts, reports or credentials are imported; original Form/Sheets remain untouched.

Current approval: trial revision-7 visual design is approved. Recruitment and active-dashboard flows still need their own approval. Production UI implementation and deployment remain separately blocked. The date below is a target, not a readiness claim.

## What “ready” means

The system is ready only when all of these work end to end in a non-production environment:

1. Management creates a NorthQuest, CashDrive, or Aura invitation for a specific email.
2. The creator opens it, continues with Google, and receives only that membership.
3. A second invitation for the same Google account adds another business without creating another person.
4. The creator can switch only between enabled memberships.
5. Today is locked. Yesterday appears only when missed and only until 12:00 PM Africa/Lagos time.
6. A video submission is written once, read back, and shown as successful only after confirmation.
7. Everyone in a business follows the same period. Aura is Monday–Sunday. A mid-period joiner owes only post-join videos.
8. At midnight after day seven, video logging is blocked until every required date/video/platform view is saved.
9. One submitted video link plus its screenshot and reported views of at least 10,000 creates one management notification/review. A high count alone does neither; weekly reports do not bypass this evidence step.
10. Management verifies and approves; only then does onboarding open.
11. Deactivation blocks the selected membership immediately while preserving history and other memberships.
12. Wrong-role and cross-business requests are denied and recorded safely.
13. Weekly Sheet collation and Apify 1–14, 1–21, and 1–month-end jobs pass idempotency and retry tests.
14. CashDrive Inventory and Enquiries and agency-scoped GrowthCooks recruitment have approved, tested launch scope. Recruitment includes immutable applications, distinct screening/outreach states, explicit brand sharing, one trial per person, evidence verification, and idempotent onboarding/membership creation.
15. Production build, dependency audit, backup/rollback, monitoring, and smoke tests pass.

## Historical status on August 25 — not a fresh August 28 verification

- `PASS`: repository branch/PR safety; phone-first revision 3 prototype; production compilation; current dependency audit.
- `PASS`: live Vercel team/project visibility and live read-only Supabase table/migration/advisor access.
- `UNVERIFIED`: real Google OAuth; real invitation redemption; real caller RLS tests; persistent video/gate/review/deactivation flows; Sheets; Apify; notifications; backups and rollback.
- `CRITICAL`: `public._nq_scrape_jobs` has RLS disabled. Review and repair its service-access policy before any launch.
- `CRITICAL`: repository and live Supabase migration histories do not match. Recover canonical migration history and prove isolated bootstrap before applying product migrations.
- `BLOCKED BY APPROVAL`: production UI implementation remains paused until the prototype is explicitly approved.

September 1 readiness is unproven. The checks above must pass against a non-production environment, not only local mocks. This recruitment prototype does not repair the historical security or migration blockers, validate production integration, or establish launch readiness.

## Historical daily critical path — replan after scope approval

- **August 25:** finish audit, prototype correction, build repair, dependency audit, and approval review.
- **August 26:** apply the announced Next.js security patch; re-run audit/build; verify Vercel and Supabase live truth; lock the smallest launch scope.
- **August 27–29:** implement approved identity, membership, video, gate, review, approval, and deactivation vertical slice in preview only; prove wrong-role/cross-business denial.
- **August 30:** run full phone, timing-boundary, duplicate/retry, Sheets/notification, backup, and rollback tests.
- **August 31:** manager acceptance test and launch/no-launch decision. No production deployment without explicit approval.
