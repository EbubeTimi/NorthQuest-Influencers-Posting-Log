# Shared flow contracts

Current instructions through 2026-08-28 override every earlier repository rule. Trial revision 7 visual design is approved; recruitment and active-dashboard additions still require their own prototype approval. This is not production approval.

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
- Every reporting date on/after joining has four visible slots: Video 1 TikTok/Instagram and Video 2 TikTok/Instagram. Unlogged slots show “No video logged” and are disabled; they do not create reporting obligations or zero-view records. Actual logged links require whole-number views including zero. The date range is the shared period bounded by joining.
- A missed video may be backdated to yesterday until 12:00 PM the next day. It then joins the correct reporting obligation.
- The creator cannot choose an arbitrary date. Today is always present; Yesterday appears only when eligible and disappears after noon or once submitted.
- The gate selects only videos inside the completed business date period and on or after the membership join time.
- A report is tied to the exact video and platform. Production must define idempotent insert/update behavior so retries cannot create ambiguous duplicates.
- Exactly two video slots per day, on TikTok and Instagram. No Video 3 and no Facebook tracking or bonuses. Compact side-by-side numeric inputs must remain phone-readable. Dashboard weekly navigation must open the view form regardless of a previously selected Yesterday.
- Logging permission is computed and enforced server-side with the insert; hiding a button is not security.
- The client shows submission success only after the durable row is confirmed. Retries reuse an idempotency key and cannot create a duplicate video.

Correction to the first audit: an old report cannot clear a different new video because current reports already carry `video_log_id`. The unsupported “old reports satisfy future gates” claim is withdrawn. The actual risks are duplicate rows for the same video/platform and a query that scans every older unreported video rather than explicitly bounding the completed date period.

## Trial review and onboarding contract

- At most one ongoing trial per person. Passing it is TDT-wide; later management-recommended memberships do not require a repeat trial. This does not grant automatic access or replace business-specific onboarding.
- The protected threshold is 10,000 views for one video in every business.
- Views from different videos are never added together.
- A trial creator can submit a qualifying video at any time, including before the weekly deadline, using a visible dashboard action. Choose a logged video/platform, enter its views (at least 10,000), and attach its screenshot in the same form.
- This milestone submission is a separate review record, not a weekly view report. It cannot complete or bypass any weekly reporting obligations. A pending review does not block otherwise permitted daily logging.
- Keep threshold/cumulative explanations out of the creator view-report form.
- Only a complete qualifying submission (recorded video/platform, ≥10,000 views, screenshot) creates the management review item/notification. Weekly counts alone do not create a separate screenshot task or review. A high weekly count may prefill the same combined submission form for the creator.
- The creator selects their recorded qualifying video and supplies its view count and screenshot in one form. Management sees that private screenshot and an anchor to the exact post URL, not a profile URL. There is no separate add-screenshot route; correction/resubmission uses this same complete form.
- August 28 update: verified link/platform/count/image/submitter/time and management decision are retained as an immutable evidence snapshot. Corrections append new evidence and events. The creator's screenshot task disappears after approval, not management's evidence. Production retention duration remains undecided; no storage deletion is authorized. Prototype previews remain memory-only until reset/reload.
- Management checks the real platform performance, then approves onboarding or keeps the creator in trial.
- Only management approval unlocks onboarding for the creator.
- Pending screen: “Your video is being checked.” Explain briefly that Start onboarding appears on the dashboard after approval; no tick/Under review badge. Approved entry shows “Onboarding is ready.” and Start onboarding only, with no dashboard-return action. Actual onboarding remains a separate flow to design.
- Record the actual review-submission timestamp. Lock the submitted video/count/image together while sending; late image-decoding results must not attach to a changed selection.
- Retries cannot create duplicate review items, notifications, approvals, or audit events.
- Trial deactivation shows only “Your access has been paused.” No alternate-business message, chooser or sign-out action appears on that screen.

## Applications, CashDrive, and launch-data contract

- Applications belong to the GrowthCooks Marketing Agency recruitment workspace, separate from a brand dashboard. TDT remains parent organization without an asserted legal subsidiary classification. Applications are agency-scoped until invitation acceptance links the same person to platform identity.
- CashDrive has separate Inventory and Enquiries areas.
- Enquiries capture referrer, prospective buyer, contact, requested car, inquiry date, source, budget, urgency, lead status, and notes.
- September 1, 2026 is the launch target, not proof of readiness. No old creator rows, opening video counts, old video links, passwords or reports are imported. August 28 adds a separate planned 526-application recruitment migration; it requires mapping/cutover approval and rehearsal before any import. Source Forms and Sheets remain read-only.

## Recruitment funnel contract — 28 August 2026

See `RECRUITMENT_FLOW_CONTRACT.md` for the complete affected flow and source mapping. It extends this platform, not a second recruitment application.

- Stable agency-scoped applicant identity; immutable original submission/answers/files. Management decisions never overwrite intake.
- Screening is Pending review → Accepted for outreach or Rejected by team. Acceptance records reviewer/time, recommended brand/tier and note. Team-rejection reasons are separate from creator-decline reasons.
- Outreach starts only after accepted screening; append-only contact attempts record actor/time/channel/result. Cannot be reached differs from no response. Creator accepted trial is required before starting a trial.
- Trials require agency, engaged brand, person, tier, content type and the actual
  start date in Lagos time. New trials have no scheduled end date, coach field
  or trial-brief URL in the product. Operational coaching remains a WhatsApp
  team responsibility. One ongoing trial is allowed per person; passed creators
  skip a repeat trial, not brand-specific onboarding.
- A complete single-video ≥10,000 evidence submission enters awaiting verification. Only authorized verification produces Trial successful and one idempotent brand onboarding case; weekly reports do not bypass this.
- Onboarding states: Invited, In progress, Awaiting creator, Awaiting management, Completed, Cancelled. Completion creates one assigned active brand membership. Contracts/bank/employment work is not implied complete.
- Management counts open filtered views over shared records. Agency/brand/creator visibility is explicit; owner cross-tenant access and exports are audited. No full-database export or bulk delete is offered in this prototype.

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
