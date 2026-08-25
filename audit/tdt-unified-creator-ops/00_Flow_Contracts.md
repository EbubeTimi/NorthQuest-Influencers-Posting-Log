# Shared flow contracts

Current instructions from 2026-08-25 override every earlier repository rule.

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
- After sign-in, the creator sees only businesses assigned to that email. The system never advertises every TDT business.
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
- A missed video may be backdated to yesterday until 12:00 PM the next day. It then joins the correct reporting obligation.
- A due report key is `(business_id, creator_id, reporting_period_id, video_log_id, platform)`.
- Logging permission is computed and enforced server-side with the insert; hiding a button is not security.

Plain explanation of the old-report defect: today the database can treat a video as permanently reported after any one view entry because reports are not tied to a reporting period. A report submitted for an earlier period could therefore make a later check look complete. Period-specific report keys prevent that.

## Trial review and onboarding contract

- The protected threshold is 10,000 views for one video in every business.
- Views from different videos are never added together.
- A creator entering 10,000 or more creates one management review item and notification. It does not unlock onboarding.
- Management checks the real platform performance, then approves onboarding or keeps the creator in trial.
- Only management approval unlocks onboarding for the creator.
- Retries cannot create duplicate review items, notifications, approvals, or audit events.

## Applications, CashDrive, and migration contract

- Applications are TDT-wide recruitment records, separate from any one business dashboard.
- CashDrive has separate Inventory and Enquiries areas.
- Enquiries capture referrer, prospective buyer, contact, requested car, inquiry date, source, budget, urgency, lead status, and notes.
- Existing creators import one admin-entered opening August video count. This is only a starting total; historical links remain in Google Sheets and are not fabricated as video rows.

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
