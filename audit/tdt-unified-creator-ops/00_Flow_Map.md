# Affected flow map

## F01 — Sign in once

- Actor/goal: person reaches their one account.
- Entry: email-code screen; existing session resumes automatically.
- Exit: role and memberships load; multi-business creators go to F02.
- Failure/recovery: invalid or expired code, rate limit, offline, retry, sign out.
- Permission: Supabase identity only; role comes from server data.

## F02/F03 — Choose and switch business

- Actor/goal: creator selects NorthQuest, CashDrive, or Aura membership without another login.
- Entry: immediately after sign-in when two or more active memberships exist; later from the header switcher.
- Exit: selected membership becomes active and its scoped dashboard loads.
- Failure/recovery: membership disabled, network unavailable, stale selection, retry or sign out.
- Security: target business must be an enabled membership for the caller; never accept a client-supplied tenant alone.

## F04/F05 — Enter and operate a permanent limited trial account

- Actor/goal: approved applicant starts working without full onboarding.
- Entry: trial link/sign-in.
- Exit: trial dashboard, deactivated state, or automatically unlocked onboarding.
- Preserve: one real login; business-scoped membership; videos remain auditable.
- Change: management can deactivate a trial membership without deleting identity/history.

## F06/F07 — Log videos and clear the shared weekly gate

- Actor/goal: creator logs links during the current shared cycle and, after it closes, reports views for every video they owe.
- Entry: selected business dashboard.
- Trigger: midnight after the cycle closes.
- Exit: all due per-video reports are accepted; logging reopens.
- Join rule: membership owes only videos logged on/after its join time in the in-progress cycle.
- Failure/recovery: partial draft survives locally; invalid view is corrected inline; offline and server errors can retry; switching business cannot leak or satisfy another tenant’s gate.
- Enforcement: the database/API must reject video insertion while the caller’s business membership has unresolved reports; UI gating alone is insufficient.

## F08/F09 — Automatic trial transition and onboarding

- Actor/goal: trial creator unlocks onboarding when one video reaches 10,000 self-reported views.
- Trigger: accepted view report makes one video’s current report reach at least 10,000.
- Guard: never sum different videos; there is no manual approval switch.
- Effects: transition is idempotent, qualifying video is recorded, onboarding unlocks, management receives one notification, and an audit event is written.
- Exit: creator opens the existing onboarding flow; access can still be deactivated by management.

## F10 — Deactivate one business membership

- Actor/goal: management stops access for one creator/business while preserving their login, other memberships, and history.
- Entry: creator detail or trial roster.
- Exit: that membership sees a clear inactive state; other businesses still work.
- Recovery: management reactivates; audit records actor, reason, time, and membership.

## F11 — Existing creator migration

- Actor/goal: management imports the opening August video count only.
- Data: count, month (`2026-08` unless the import run explicitly targets another opening month), `admin_entered=true`, entered by/at, creator/business.
- Non-goal: historical links remain in Google Sheets and are not copied into `video_logs`.
- Safety: idempotent upsert keyed by creator/business/opening month; import validation and row-level audit.

## F12/F13 — Analytics automations

- Weekly: collate accepted self-reports into each business’s designated Drive folder after the shared gate closes.
- Apify: all businesses; week one no scrape; after week two scrape days 1–14; after week three days 1–21; after week four days 1–month-end.
- Reliability: idempotency key per business/job/window, leases, retry classes, run ledger, cost guard, duplicate prevention, reconciliation, and alerting.
- Proof gap: current actors and output fields have never had a paid live spot-check.

## F14/F15 — CashDrive inventory and enquiries

- Inventory: management adds/updates vehicle availability, publication state, price, media references, and audit history.
- Enquiry: a lead submits interest against a vehicle; CashDrive management sees tenant-scoped status, owner, follow-up, and audit history.
- Current state: absent from routes, schema, migrations, and tests.

## Regression impact map

Retest sign-in, callback/verification, onboarding, header/switcher, creator dashboard, admin creators/trial/applicants, RLS helper functions, creator/video/report policies, storage access, Drive functions, cron schedules, notification functions, migration invite redemption, payments/bonus behavior, all three tenants, inactive/trial/active role variants, offline/retry, and mobile/desktop keyboard paths.
