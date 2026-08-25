# September 1 launch contract

Target date: 2026-09-01  
Current date: 2026-08-25  
Data decision: start fresh. Do not migrate creators, video links, counts, reports, or stored credentials from the old system.

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
9. A single self-reported video at 10,000 creates one management notification and review. It does not unlock onboarding.
10. Management verifies and approves; only then does onboarding open.
11. Deactivation blocks the selected membership immediately while preserving history and other memberships.
12. Wrong-role and cross-business requests are denied and recorded safely.
13. Weekly Sheet collation and Apify 1–14, 1–21, and 1–month-end jobs pass idempotency and retry tests.
14. CashDrive Inventory and Enquiries and TDT Applications have approved, tested launch scope.
15. Production build, dependency audit, backup/rollback, monitoring, and smoke tests pass.

## Status on August 25

- `PASS`: repository branch/PR safety; phone-first revision 3 prototype; production compilation; current dependency audit.
- `PASS`: live Vercel team/project visibility and live read-only Supabase table/migration/advisor access.
- `UNVERIFIED`: real Google OAuth; real invitation redemption; real caller RLS tests; persistent video/gate/review/deactivation flows; Sheets; Apify; notifications; backups and rollback.
- `CRITICAL`: `public._nq_scrape_jobs` has RLS disabled. Review and repair its service-access policy before any launch.
- `CRITICAL`: repository and live Supabase migration histories do not match. Recover canonical migration history and prove isolated bootstrap before applying product migrations.
- `BLOCKED BY APPROVAL`: production UI implementation remains paused until the prototype is explicitly approved.

The September 1 target is possible only if the approval and environment-access blockers are removed immediately and the end-to-end checks above pass. A passing prototype and build alone do not make the product launch-ready.

## Daily critical path

- **August 25:** finish audit, prototype correction, build repair, dependency audit, and approval review.
- **August 26:** apply the announced Next.js security patch; re-run audit/build; verify Vercel and Supabase live truth; lock the smallest launch scope.
- **August 27–29:** implement approved identity, membership, video, gate, review, approval, and deactivation vertical slice in preview only; prove wrong-role/cross-business denial.
- **August 30:** run full phone, timing-boundary, duplicate/retry, Sheets/notification, backup, and rollback tests.
- **August 31:** manager acceptance test and launch/no-launch decision. No production deployment without explicit approval.
