# Shared flow contracts

Current instructions through 2026-08-27 override every earlier repository rule. Trial-only prototype corrections are applied in revision 4; visual polish is next. This is not production approval.

## Identity, invitation, and membership contract

```text
auth_user 1 — 1 person profile
person profile 1 — many business memberships
business membership 1 — 0..1 creator record in that business
active business must be one of that person's enabled memberships
```

- Creators sign in with their personal Google account, not a Gmail account created for a brand.
- Management assigns access through an expiring, single-use business invitation tied to the intended personal email.
- Opening a NorthQuest invite adds NorthQuest membership. Opening an Aura invite later adds Aura to the same login.
- A trial creator has exactly one assigned trial business and goes directly to its dashboard; no trial chooser or switcher. After passing the TDT trial, active creators may have multiple assigned memberships. The system never advertises every TDT business or grants one automatically.
- Every creator, video, report, application, notification, enquiry, inventory record, and audit event carries its correct ownership scope.
- Authorization derives the person from the authenticated caller and validates membership server-side.
- Management may deactivate one business membership or suspend the whole person. History is retained, and actor, reason, joined date, deactivated date, and reactivation are audited.
- Cross-business identifiers must not reveal whether another business's record exists.

## Creator calendar and reporting contract

- Aura's creator week is Monday through Sunday in `Africa/Lagos`.
- NorthQuest and CashDrive use their configured calendar-date blocks. The rule is stored as business configuration, not hard-coded into page components.
- Creators in the same business share that business's current period. Joining does not start a private seven-day clock.
- A creator who joins on day three starts on day three. A creator who joins on day seven owes only the videos they log on day seven.
- At midnight after the period ends, new video logging is gated until every required per-video, per-platform view report for that completed period is submitted.
- A creator owes only videos logged on or after their membership join time.
- View fields are generated only for actual logged video/platform links. Missing days and platforms never posted to require no entry. A posted link requires a valid whole-number count, including zero. The visible date range comes from that creator's due records.
- A missed video may be backdated to yesterday until 12:00 PM the next day. It then joins the correct reporting obligation.
- The creator cannot choose an arbitrary date. Today is always present; Yesterday appears only when eligible and disappears after noon or once submitted.
- The gate selects only videos inside the completed business date period and on or after the membership join time.
- A report is tied to the exact video and platform. Production must define idempotent insert/update behavior so retries cannot create ambiguous duplicates.
- Logging permission is computed and enforced server-side with the insert; hiding a button is not security.
- The client shows submission success only after the durable row is confirmed. Retries reuse an idempotency key and cannot create a duplicate video.

Correction to the first audit: an old report cannot clear a different new video because current reports already carry `video_log_id`. The unsupported “old reports satisfy future gates” claim is withdrawn. The actual risks are duplicate rows for the same video/platform and a query that scans every older unreported video rather than explicitly bounding the completed date period.

## Trial review and onboarding contract

- At most one ongoing trial per person. Passing it is TDT-wide; later management-recommended memberships do not require a repeat trial. This does not grant automatic access or replace business-specific onboarding.
- The protected threshold is 10,000 views for one video in every business.
- Views from different videos are never added together.
- Keep threshold/cumulative explanations out of the creator view-report form.
- A creator entering 10,000 or more creates one management review item and notification. It does not unlock onboarding.
- The creator supplies the qualifying video URL and a screenshot. Management sees the same private image and an anchor to that exact URL. The review can wait for evidence after notification.
- Production image retention/deletion after a decision is UNDECIDED; obtain a retention decision before implementing storage deletion. Revision 4 uses memory-only image previews, not external uploads. The creator's screenshot task disappears after approval; mock manager evidence lasts until reset/reload.
- Management checks the real platform performance, then approves onboarding or keeps the creator in trial.
- Only management approval unlocks onboarding for the creator.
- Retries cannot create duplicate review items, notifications, approvals, or audit events.
- Trial deactivation shows only “Your access has been paused.” No alternate-business message, chooser or sign-out action appears on that screen.

## Applications, CashDrive, and launch-data contract

- Applications are TDT-wide recruitment records, separate from any one business dashboard.
- CashDrive has separate Inventory and Enquiries areas.
- Enquiries capture referrer, prospective buyer, contact, requested car, inquiry date, source, budget, urgency, lead status, and notes.
- September 1 starts with an empty operational dataset. No opening August counts, creator rows, old links, passwords, or historical reports are imported. Old Google Sheets remain historical reference only.

## Automation contract

- Weekly self-reported views collate to the designated Sheet/Drive destination for each business.
- Apify runs across every business three times per month: days 1–14, days 1–21, and days 1–month-end. There is no week-one scrape.
- Schedules, destinations, actor configuration, notification recipients, and business settings live in managed configuration with validation and audit history.
- Delivery is at-least-once with idempotent results, bounded retries, cost guards, run ledgers, and reconciliation before repeating an external effect.

## Security, audit, and scale contract

- Management uses MFA; invitations expire and are single-use; sessions and revoked access are checked server-side.
- Supabase RLS and service boundaries deny unauthenticated, wrong-role, wrong-business, and cross-object access using real caller identities.
- Uploads use private storage, size/type validation, malware-safe handling, and expiring signed access.
- Inputs are validated server-side; secrets never reach browser code or logs; rate limits protect sign-in, invitations, reports, applications, and enquiries.
- Minimum audit fields: business or TDT scope, actor, action, object, safe before/after summary, reason, timestamp, and correlation ID. Never log passwords, OTPs, tokens, bank numbers, or raw credentials.
- Admin tables paginate and filter server-side; core lookups are indexed; background work is batched and resumable; totals are aggregated outside browsers.
