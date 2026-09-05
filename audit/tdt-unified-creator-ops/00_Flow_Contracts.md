# Shared flow contracts

Current instructions through 2026-09-03 override every earlier repository rule. Trial revision 7 visual design is approved; recruitment and active-dashboard additions still require their own prototype approval. This is not production approval.

## Unified management dashboard contract — 4 September 2026

- Management and administration are PC-first because most operating work happens on a laptop. Desktop uses a persistent left navigation, wider lists and side-by-side evidence/action areas. The same actions, focus order and records must reflow to a single-column phone interface without horizontal scrolling or reduced permissions.
- Management enters one agency dashboard, sees a compact needs-attention queue, and then opens business-scoped work; trial evidence, onboarding review, bonus review and payment preparation remain distinct tasks.
- NorthQuest, CashDrive and Aura share one person/identity model without sharing operational records. Every creator, review, payment, audit event and action carries an explicit business scope.
- A creator record shows the person's identity, photo placeholder, joined/deactivated lifecycle dates, business memberships and linked video, view, bonus, payment, access and audit records. It does not create a second management-only creator database.
- Trial evidence approval follows the same creator and business into onboarding. The reviewed item includes the exact recorded video/platform, claimed count and screenshot. Keeping a creator in trial preserves the evidence and history.
- Completing onboarding creates the active membership idempotently. A correction names the exact section and reopens only that section; the signed agreement remains privately reviewable.
- An approved bonus creates a business-scoped payment-ledger item. Payment preparation keeps expected video pay, approved bonuses, total owed and settled payment distinct.
- Pausing one business membership stops new operational work only for that business and preserves read-only payment/history access. Suspending the whole person is a separate Smith-only action affecting every membership.
- Every management decision records actor, action, business, subject and time. Unauthorized roles receive no management records. Prototype revision 1 is local/read-only and does not authorize production writes or deployment.

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

## Brand onboarding contract — 3 September 2026

- Smith accepted the onboarding prototype behavior on 4 September 2026 (“I think we're all done here”). Final TypeUI/visual refinement and production implementation remain separate gates.
- Entry copy is left-aligned and brief: NorthQuest, “Your onboarding is ready.”, “Use the same Google account you used during your trial.” and a “Begin” action. No start-instruction card or decorative success tick.
- Creator details include full name, WhatsApp and address. Creator profiles store separate TikTok/Instagram usernames and public profile links.
- Smithstem must never collect, store, export or log Google, TikTok or Instagram passwords. Business ownership does not make plaintext password collection safe. Use platform role/permission delegation; if a platform cannot delegate, use a separately approved credential-vault handover outside Smithstem.
- Each brand owns its own platform administration boundary. NorthQuest, CashDrive and Aura use separate TikTok Business Centers and Meta Business Portfolios (or separately scoped brand assets), with at least two trusted management administrators and management-controlled recovery email, phone, MFA and recovery codes.
- A brand administration boundary contains many separate creator-operated social accounts, not one shared brand profile. For example, approximately 70 NorthQuest creators can each have a distinct NorthQuest TikTok account and distinct NorthQuest Instagram account, all inventoried under NorthQuest management and linked one-to-one to the relevant creator assignment.
- Creators receive removable, least-privilege access only to their own assigned account pair: TikTok Standard + account Operator (or the closest supported organic-content role), and Meta task/partial access for content and messages on the relevant professional Instagram asset. Creator access must never include the ability to add/remove administrators, change recovery ownership, reach another creator's account or reach another brand's assets.
- Deactivation removes the creator's delegated platform access and records actor, time, reason and affected account. The brand account remains controlled by management and can be reassigned to another creator without transferring a personal password. Smithstem stores platform account identifiers, roles and access lifecycle only; OAuth/API secrets remain server-side and raw platform passwords never enter Smithstem.
- Bank/financial-institution entry is searchable but accepts a typed institution not in suggestions. Nigerian account number input is exactly ten digits in the current contract; account name is required. Production account verification remains separate.
- The creator reads the complete approved, immutable contract inside the phone flow, fills designated name/address/date fields, acknowledges it and draws a signature. Legal terms are not creator-editable. The server generates the complete signed PDF and stores its version/hash, completion data, signature, timestamp and consent/audit evidence in private storage before reporting success.
- Contract wording is prepared outside Smithstem and uploaded as one complete brand-scoped DOCX or PDF. There is no in-app clause editor. Smith is the sole current contract authority; after Smith reviews the uploaded document and confirms “Make live,” it immediately becomes the contract for new onboarding without a second approval or publisher queue. The permission model remains role-based so Smith may explicitly add another authorized contract manager later.
- The normal business screen shows only the current contract and signed count. Contract history is a quiet, authorized audit surface rather than a version browser. Replacing the current source never alters or deletes existing signed contracts: every creator signature remains bound to the exact rendered bytes/hash they saw, and the signed PDF and prior source are retained privately. A material change may create an explicit selective or all-creator re-signing request; it is never silently substituted into an existing signature.
- The creator review spells out every entered field, including the full account number so the creator can catch mistakes, and opens a document preview showing exactly where the signature lands. Only that creator and authorized management may view the full bank record; lists, logs, exports and ordinary audit events remain masked. Management opens the exact generated signed agreement, checks each onboarding area and either completes onboarding or explicitly selects the exact fields needing correction with a note. Manager Review offers one accessible Select all/Clear all control for its four approval checks while preserving individual checkboxes. A signature correction reopens both the agreement and signature drawing box. The creator sees and edits only selected fields; accepted fields remain locked and original submissions remain immutable.
- Creator onboarding drafts survive Back and reload. The review prototype may use local browser storage for mock data only; production uses authenticated, encrypted, tenant-isolated server drafts and never stores financial details or credentials in browser local storage.
- Submission failure says exactly that onboarding did not save and retains the current answers. Awaiting review uses “Submitted. We’re checking your details.” without a success icon. Completion says “Welcome to your creator dashboard, {first name}” with one Open dashboard action. Paused access shows only NorthQuest, the paused message and read-only payments/records action.
- Completing onboarding creates the active business membership exactly once. Failed generation/upload/save preserves the draft and never activates membership.
- Pausing active operational access blocks new work but preserves read-only access to payment statements, video history and bonus history. The active dashboard will show exact amounts owed and paid, including the monthly payment view on the 10th.

## Active creator dashboard contract — 4 September 2026

- Home is a summary-only surface. It does not contain the daily video form, weekly-view shortcut or bonus shortcut. A separate centre Track navigation action owns Today/eligible Yesterday and the daily video form.
- The phone bottom navigation contains five icon actions with accessible names: Home, Track videos, Videos, Bonuses and Payments. Bonuses uses a money-bag symbol rather than a generic dollar symbol.
- Home shows the current Lagos date before the greeting and uses “Your dashboard” with accessible This month and All time controls. The monthly summary shows videos logged, the month target, configured rate per video, expected video amount, and approved bonus count/amount. At two slots per day the target is 60 in a 30-day month, 62 in a 31-day month and follows February's actual day count. The all-time view shows cumulative videos, video amount, approved bonuses and settled payments.
- The Active badge and aggregate “Total so far” are omitted. A zero-bonus state shows the count without a meaningless zero-naira amount.
- Expected amounts are transparent calculations, not proof of payment. Bonus totals include only approved bonus records; settled Payments remains the payment source of truth.
- Creator record/task screens show the creator name and current Lagos date. The empty Payments state says only “Your payments appear here after they’re paid.”
- A missed-Yesterday warning may appear on Home, but date choices and entry controls remain in Track. The weekly gate still replaces normal work with the required view-report task until it is complete.

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
- Apify runs for every business three times per month: days 1–14, days 1–21, and days 1–month-end. There is no week-one scrape.
- NorthQuest, CashDrive, and Aura each use their own Apify account and business-scoped credentials. A single shared NorthQuest token must never run another business's scrape.
- The platform may schedule and monitor all businesses centrally, but every run resolves its account, actor configuration, cost guard, destination, and audit scope from the target business before starting.
- Apify credentials remain server-only and must be stored as separate secret references; they never appear in browser code, general business records, logs, or audit payloads. Rotating or disabling one business credential must not interrupt another business.
- Schedules, destinations, actor configuration, notification recipients, credential references, and business settings live in managed configuration with validation and audit history.
- Delivery is at-least-once with idempotent results, bounded retries, cost guards, run ledgers, and reconciliation before repeating an external effect.

## Security, audit, and scale contract

- Management uses MFA; invitations expire and are single-use; sessions and revoked access are checked server-side.
- Supabase RLS and service boundaries deny unauthenticated, wrong-role, wrong-business, and cross-object access using real caller identities.
- Uploads use private storage, size/type validation, malware-safe handling, and expiring signed access.
- Inputs are validated server-side; secrets never reach browser code or logs; rate limits protect sign-in, invitations, reports, applications, and enquiries.
- Minimum audit fields: business or TDT scope, actor, action, object, safe before/after summary, reason, timestamp, and correlation ID. Never log passwords, OTPs, tokens, bank numbers, or raw credentials.
- Admin tables paginate and filter server-side; core lookups are indexed; background work is batched and resumable; totals are aggregated outside browsers.
