# Smithstem data and storage architecture

Status: approved product rules mapped; production implementation pending.

Last updated: 4 September 2026, Africa/Lagos.

This is the plain-language destination map for every important record. It does not authorize a production migration, upload, Google Drive write, or deployment.

## One rule to remember

Supabase/PostgreSQL is the system of record for structured data. Private object storage holds files. Google Sheets and Drive receive controlled reports or managed copies; they are not the source of truth. Raw Google, TikTok, Instagram, Apify, email, or banking credentials never go in application tables, Sheets, contracts, browser storage, logs, or audit payloads.

## Where each item lands

| Item | Canonical destination | File destination | Management connection |
| --- | --- | --- | --- |
| Person and Google identity | `profiles` | None | One login across all assigned businesses |
| Business access | `business_memberships` plus lifecycle history | None | Chooser, switching, deactivation and reactivation |
| Creator record | business-scoped `creators` record | Photo in private profile storage if collected | Creator list and profile |
| Daily videos | `video_logs`, one row for each date/slot with TikTok and Instagram links | None | Activity, missed-day checks, pay calculation and exports |
| Weekly self-reported views | `video_view_reports`, tied to the exact video, platform and completed reporting period | None | Weekly gate, views register and Sheets collation |
| Trial 10,000 evidence | `trial_evidence_submissions` and review decision | Screenshot in private evidence storage | Trial review queue and onboarding unlock |
| Bonus claim | `bonus_claims` tied to the exact video/platform and effective bonus rule | Screenshot in private evidence storage | Bonus review queue and payment ledger |
| Rate and pay | effective-dated rate assignment plus immutable `payment_ledger_items` and monthly statements | Generated CSV/XLSX only when requested | Creator dashboard, payment register and export |
| Application | agency-scoped applicant and immutable answer snapshot | Introduction video in the approved private Drive destination during the temporary phase | Applicants/vibe-check workflow |
| Onboarding draft | `onboarding_cases` and versioned field snapshots | Unsigned preview generated on demand | Creator correction and management review |
| Contract template | `contract_templates` and immutable `contract_versions` | Exact published source/preview in private contract storage | Contract management workspace |
| Signed contract | signature metadata, contract-version ID, PDF hash and signed timestamps | Final immutable PDF in private contract storage, with an optional managed Drive copy | Creator record, management review and audit |
| Operational audit | append-only `audit_events` | None | Per-person and per-business history |
| Apify analytics | business-scoped run ledger plus immutable analytics snapshots | Optional business report export | Analytics dashboard and reconciliation |
| CashDrive enquiry/inventory | CashDrive-scoped structured tables | Vehicle media in private or approved public media storage according to publication state | CashDrive-only workspaces |

## Passwords and external credentials

Smithstem must not collect or store creators' Google, TikTok, or Instagram passwords. The preferred control model is official TikTok/Meta business-role delegation with brand-controlled recovery factors. If research proves that delegation cannot support the separate creator accounts, any approved credential handover must use a dedicated external password manager with access logs and revocation; Smithstem stores only a non-secret reference such as `external_vault_item_id`.

Server integration credentials are different: Google Drive OAuth refresh tokens, Supabase service credentials, cron secrets and one Apify credential per business belong in a server-side secret store. The database may store only the secret reference and configuration metadata. Vercel currently has no environment variables, so none of these production integrations is ready.

## File storage boundaries

- Introduction videos: the private `GrowthCooks - Temporary Introduction Videos` Drive folder is prepared, but the website upload integration and reviewer playback are not connected or tested.
- Trial and bonus screenshots: use a private evidence bucket, validate type/size, and expose only short-lived signed viewing links to the creator and authorized management.
- Signed agreements: generate one PDF from the exact published contract version plus completed fields and signature. Store the PDF privately, store its cryptographic hash and version in the database, and never overwrite it.
- Bank details: structured encrypted-at-rest database fields with narrow RLS. Never include full account numbers in audit logs, emails, Sheets, URLs, or general exports. The creator and authorized payment/review staff may see the full number inside the secured application when required.
- Google Drive: acceptable for approved reports and managed copies, but never for passwords or raw server secrets.

## Payment calculation boundary

Production must not multiply all historical videos by the creator's current rate. Each payable video or period needs the rate/version that was effective when the work was accepted. Approved bonus claims become separate immutable ledger items. A monthly statement totals the ledger; marking it paid records amount, actor, date and reference. Creator dashboards and CSV/Sheets exports read the same statement, preventing different totals in different places.

## Audit boundary

Each important action records business/agency scope, actor, action, object type/ID, safe before/after summary, reason, timestamp and correlation ID. Audit entries are append-only. They never contain passwords, OTPs, tokens, screenshots, full bank numbers or complete contract bodies.

## End-to-end write paths

### Daily video

Creator submits -> server validates identity, business, date and slot -> `video_logs` commits once -> audit event commits -> dashboard confirms -> later reporting/export jobs read the same row.

### Weekly views

Gate finds the exact completed business period -> creator submits counts only for links actually logged -> `video_view_reports` commits atomically -> audit event -> gate reopens only after the confirmed save -> designated Sheet export runs idempotently.

### Bonus

Creator chooses an existing video/platform -> screenshot uploads privately -> claim commits with evidence key and rule version -> management approves/rejects -> approved amount creates one payment-ledger item -> statement/dashboard/export update from that ledger.

### Contract

Authorized manager edits a draft -> authorized publisher freezes a version -> creator completes fields and signs that version -> server generates PDF -> file and hash commit -> management approves/corrects -> completed onboarding creates the business membership exactly once.

## Pending implementation order

1. Approve the management contract prototype and identify the exact NorthQuest, CashDrive and Aura contract sources plus the authorized publisher.
2. Approve the unified management-dashboard flow connecting videos, views, bonuses, payments, onboarding, access and audit.
3. Create the reconciled target schema and RLS migration in a non-production environment; do not reuse conflicting legacy policies blindly.
4. Connect and test private file uploads, signed-PDF generation, short-lived access and retention/recovery.
5. Implement Google authentication, invitations and tenant-isolated memberships.
6. Implement effective-dated rates, payment ledger/statements and the single CSV/Sheets export path.
7. Connect one isolated Apify account per business and then evaluate TikTok/Meta business integrations.
8. Build CashDrive enquiries and inventory.
9. Test wrong-user/wrong-business denial, retries, duplicate prevention, failure recovery, audit completeness and 1,000-plus creator performance.
10. Take a backup, request explicit approval, apply the reviewed live RLS migration, rerun the security advisor, and obtain separate production-UI/deployment approval.

## Current blockers

- Live Supabase is project-scoped and read-only through MCP; prepared RLS hardening is not applied live.
- A paid second Supabase project was not created. Local disposable PostgreSQL is the current migration proof environment.
- Vercel has no environment variables configured.
- The website-to-Drive introduction-video upload path is not connected.
- The correct distinct Aura agreement and final CashDrive source still need confirmation before any published template can be produced.
- No external password-vault procedure has been selected; this does not permit storing passwords in Smithstem or Google Sheets.
