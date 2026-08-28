# Authoritative rule conflict audit

## Recruitment revision 3 — distribution, not one combined workplace

Latest operator feedback replaces the revision-2 agency-wide mixed-stage inbox. Applicants handles the first video-based accept/reject decision. Acceptance assigns exactly one brand and removes the case from pending distribution; subsequent outreach, trial and onboarding work is inside that business's Pipeline. Rejected records stay separate. Accepted distribution history groups by brand rather than mixing active business work. A trial start cannot silently change the brand chosen at vibe check.

Normal management pages show only name, email, WhatsApp, location and the current task. Introduction video is shown for vibe check, not every later stage; preliminary screening answers remain preserved but hidden from ordinary review. Compact phone rows replace oversized cards; remove repeated agency subtitle and search. All four named operators retain agency admin access; spelling Uyi remains authoritative.

Earlier attachment observations add a UGC-No early finish (later answers/video not required), distinct receipt wording, and requested production draft autosave. Local in-tab draft simulation must not be represented as server persistence or refresh recovery. Editable, versioned outreach/invitation messages are scoped per business, not only editable in WhatsApp after leaving the product.

## Recruitment revision 2 — latest operator corrections

The August 28 live review overrides earlier prototype defaults: Uyi (not Oyi), required State and all other questions except final message, empty email with placeholder, WhatsApp `+` plus 13 digits, editable screening questions and brands, video-first applicant review, conditional rejection/decline reasons, and WhatsApp invitation → trial setup instead of an admin creator-portal button. Coach and trial-brief URL are not trial-start requirements. Stored answers and prior stage decisions remain immutable.

Trial bonus conflicts found by read-only inspection:

- `smithstem/PROJECT_BIBLE.md` historical "trial creators earn nothing" is superseded for bonuses only; trial base pay is not decided by this correction.
- `20260814060000_effective_dated_bonus_tiers.sql` has the newer NorthQuest 100k+ schedule. Legacy Downloads intake/index and Untitled document use different amounts and a 50k start. No old amount is silently adopted as current production truth.
- `20260817115546_cashdrive_default_base_pay_and_tiers.sql` copied NorthQuest rates as an assumption. `20260817120322_add_business_bonus_enabled_toggle.sql` disabled CashDrive and removed those tiers. Current instruction enables CashDrive trial bonuses from 100k, but does not confirm payout amounts.
- Aura's bonus-disabled rule remains correct. Facebook is not part of claims.
- Existing dashboard trial early-return hides bonuses; claim validation accepts any positive number; link choice favours TikTok even when the selected link is Instagram. These conflict with trial access, 100k minimum and exact platform evidence.
- Existing bonus database constraint allows link OR screenshot; latest evidence flow needs both. Video-log-only uniqueness conflicts with independent TikTok/Instagram claims; key must include the actual platform content link. Growth/revision rules and current payout schedules still need confirmation before money implementation.

Prototype revision 2 queues independent bonus claims without amounts, approval, payment, onboarding changes or weekly-gate bypass. Production remains untouched.

Current instructions through 2026-08-28 override the earlier request and every historical repository decision.

## Recruitment addition — 28 August 2026 (current authority)

The two recruitment handoff documents supplied on August 28 were read in full. Their live-source counts are reported inspection evidence, not a fresh database or spreadsheet inspection in this task. The source Form and Sheets remain untouched.

| Conflict / gap | Current resolution | Implementation boundary |
| --- | --- | --- |
| Earliest automatic self-report onboarding vs evidence review | Already superseded by Smith's later explicit instruction and current contracts: one recorded video/platform link + claimed count ≥10,000 + screenshot, then authorized management verification. Never sum videos. | No further clarification needed to prototype the already-confirmed manual transition. Real verification remains unimplemented. |
| Screenshot could disappear after approval / retention undecided | Retain the verified evidence and decision as an immutable snapshot. Corrections append a new version, never replace the reviewed original. | No production deletion; full retention duration/access policy still needs approval. |
| TDT-wide unassigned applicants visible to any administrator | GrowthCooks Marketing Agency is the operational agency workspace; applications and assets are agency-scoped before brand recommendation. | Replace nullable-business-as-global-visibility design through future reviewed migrations; do not patch production now. |
| TDT parent vs unconfirmed subsidiary claim; Aura/Ora variants | TDT parent, GrowthCooks operational workspace, configurable organization link without a legal classification; canonical Aura. NorthQuest/CashDrive retain current spelling. | No invented subsidiary, CTT relationship, legal party or contract. |
| One applicant row and mixed status/reason | Immutable submission plus distinct ScreeningDecision, OutreachCase/ContactAttempt, Trial, Evidence, Decision and OnboardingCase. Rejected-by-team differs from creator-declined. | Reuse identity/membership/video concepts; no second person table per stage. |
| Current form has seven basic questions and weak validation | Preserve all newer intake questions with stable IDs, required core responses, age confirmation, raw and normalized WhatsApp, introduction upload. | Four brief-comfort choice labels are not transcribed in the supplied spec; prototype wording is provisional. No source form changes. |
| Old approval immediately sends a trial link | Screening acceptance first recommends brand/tier; outreach records consent/outcome; start a configured trial only after acceptance. | No emails, WhatsApp sends or invitation grants in prototype. |
| Old active-onboarding collects bank/contract/platform passwords | Brand onboarding is an explicit case; creator tasks and management completion precede active membership. Contracts/bank/employment are separate, not silently completed. | Never collect passwords. Sample checklist is a proposed launch handoff, not a real legal agreement. |
| Blanket no-migration launch vs new 526-application migration plan | New handoff authorizes planning a separate, rehearsable recruitment import. It does not authorize executing an import or changing production. Old video counts/links/credentials still excluded. | Reconcile all 526 records and aggregates only after frozen export, mapping review and approval. No importer execution now. |
| Single admin role vs agency/brand/creator scopes | Daniel/Ella/Oyi/Smith daily GrowthCooks operations; Smith owner-only destructive/administrator/export controls are a recommended boundary, not confirmed policy. | Demonstrate only simulated roles. No real grants; owner boundary confirmation required before production. |
| Existing reusable public trial links vs screened named trial | Email-bound invitation, accepted outreach, one concurrent trial/person, agency-brand engagement and required trial fields. Passing remains TDT-wide. | No repeat trial for a passed creator; subsequent brand onboarding requires explicit assignment. |
| Prototype approval vs launch readiness | Trial revision 7 design approved by “yes i am happy lets move”; recruitment and active-dashboard drafts not approved. September 1, 2026 remains target. | No production UI or deployment authorized by this prototype work; real end-to-end tests still required. |

Repository seams inspected: `app/apply/page.js`, `app/admin/page.js`, `app/onboarding/page.js`, `app/auth/callback/page.js`, recruitment migrations `20260817204900` / `20260818231500`, `PROJECT_BIBLE.md`, and the existing shared contracts. Historical flow-map wording that a high weekly self-report alone creates review is also superseded: a complete link/count/screenshot submission is required.

## Active-dashboard inspection — work preserved

The uncommitted active dashboard draft is preserved while recruitment takes priority. Its core tests passed 26 checks; browser/independent review was unfinished at handoff. Existing production code still has a join-relative gate, missing active gate rendering, 11:30 PM posting rollover, positive-only view checks and Facebook fields. Do not copy these into recruitment or imply production repair.

## Revision 6 corrections (historical authority)

- Exactly Video 1 and Video 2 per day, each with TikTok/Instagram slots. Every reporting date shows all four boxes, including disabled unlogged slots. This supersedes revision 5's Video 3+ and sparse layout, without requiring reports for unposted videos/platforms. Facebook is not tracked or bonused here.
- Screenshots are required inside the qualifying-video submission only. Remove the standalone screenshot route and dashboard task; a weekly high count may prefill the combined form, but complete submission is required before management review/notification.
- Walkthrough step 3 opens the real views panel and highlights it, not Today/Yesterday. The Phone control works at all host-window widths and remains usable during the tour. “Simulate week ending” is clearly a reviewer-only clock control.
- Sign-in: “Use your personal Google account.” Paused screen: no exclamation icon. Expired link: centred. Management review opens the recorded post, not a creator profile.
- Trial prototype remains unapproved production UI; active-creator dashboard is next after review.

## Revision 5 trial-flow corrections

- Revision 4 exposed screenshot collection only after weekly qualification; now the dashboard must also expose an anytime “Reached 10,000 views?” submission with recorded video/platform, view count and screenshot together. It remains separate from weekly reports.
- Weekly entry is grouped by date/video with compact platform fields and supports Video 3 onward. Dashboard navigation must lead into the views form even after Yesterday was selected.
- Pending loses the tick/Under review badge; approved loses the management explanation and dashboard-return button. The approved dashboard becomes the onboarding entry point.
- These corrections are authorized for prototype review only. Application form/results, actual onboarding and active-creator dashboard remain separate upcoming flows. The user will provide application-Sheet layout/sorting references.

## Revision 4 trial-only corrections

- A person cannot hold multiple ongoing trials. Once management passes the TDT trial, future recommended business memberships do not repeat it. Revision 3's multiple trial memberships/switcher are superseded, while active creators may still have assigned memberships in multiple businesses.
- Invitation copy is “Welcome to your NorthQuest Creator dashboard.” It replaces “You’ve been invited to…”. Branding stays TDT; no invented recipient, one-use message or personal-account explanation on that page.
- Only actually logged platform links require views; the old fixed sixteen-field grid and creator threshold lecture are removed. Missing dates/platforms create no obligation.
- Qualifying video proof now includes a local screenshot preview and the exact submitted video link. Production retention remains undecided; no automatic deletion policy is assumed.
- Trial paused access has no alternate business/switch/sign-out exit. First use is the regular empty logging form.
- User observations are complete and authorized for prototype adjustment, not production UI. These corrections are applied in revision 4. UI/UX refinement is next; do not restart discovery or request the same observations again.

| # | Current locked rule | Conflicting or missing repository behavior | Required resolution |
| --- | --- | --- | --- |
| 1 | Personal Google login plus assigned memberships | Email-code login exists; business membership exists, but no secure business invitation claim flow | Add Google login and email-bound, expiring, single-use membership invitations |
| 2 | Show only assigned businesses | Existing switcher appears after entry and a creator-facing chooser is absent | Route multi-membership creators to a chooser containing enabled memberships only |
| 3 | Aura alone uses Monday–Sunday | Repository Aura weekday branch is valid in principle; the previous audit incorrectly called it a conflict | Preserve Aura Monday–Sunday and move all business period rules into validated configuration |
| 4 | New creators join the business's period already in progress | Current client waits for `joinedDaysAgo >= 7`, creating a private grace week | Remove the personal clock; filter obligations by membership join timestamp |
| 5 | Midnight gate plus next-day noon backdate grace | Gate is client-led and no explicit yesterday-until-noon rule exists | Enforce the gate server-side and add a narrowly scoped backdate deadline |
| 6 | Every due video/platform in the completed date period must be reported | The first audit incorrectly claimed an old video's report could clear a new video; current rows are keyed by `video_log_id`. Actual gaps: duplicate video/platform rows are allowed and the gate scans every older unreported video | Bound the due query to the completed period and make video/platform report retries idempotent |
| 7 | 10,000 on one video creates management review | CashDrive is 5,000; threshold is editable; prior instruction incorrectly removed approval | Protect 10,000 for all businesses; create one review/notification; retain management verification |
| 8 | Only management approval unlocks onboarding | Existing manual controls are mixed with older qualification states | Replace with explicit `trial → review_pending → onboarding_approved` transitions and audit them |
| 9 | Apify runs 1–14, 1–21, and 1–month-end across all businesses | Code is monthly-only with a day-one-next-month cron | Replace with three cumulative monthly windows and per-business run isolation |
| 10 | TDT-wide Applications area | Applicant data exists, but it is not yet the unified administration flow shown in the supplied form | Build a separate applications workspace and structured applicant records/uploads |
| 11 | CashDrive Inventory and Enquiries areas | Both workflows are absent | Add separate tenant-scoped areas; use the supplied enquiry fields as the starting contract |
| 12 | Admin sees creator photo, joined/deactivated dates, business records, and actions | Creator history and lifecycle details are incomplete and fragmented | Add auditable lifecycle records and safe private media references |
| 13 | September 1 is a fresh start; no creator data migration | Earlier scope included an opening August count and migration flow | Remove creator-data migration and opening counts from launch scope; preserve old Sheets as historical reference only |
| 14 | Weekly Sheets collation remains | Functions/folders exist but inherit current schedule and population limitations | Align each business's reporting periods and keep idempotency/reconciliation |
| 15 | Important settings are managed, not scattered constants | Thresholds, anchors, folders, cron behavior, and lists appear in migrations/client logic | Use protected, versioned configuration with validation and audit history |
| 16 | Secure, auditable, scalable system | No complete application audit log; broad client aggregation; legacy intake collects passwords | Add RLS proof, MFA, audit events, pagination/indexes/jobs, and retire password collection |
| 17 | Phone-first creator experience | Earlier prototype retained desktop columns, verbose copy, a date picker, a separate skippable walkthrough, and recent-video clutter | Use one-column mobile layout, locked Today/conditional Yesterday choices, short copy, no recent-video panel, and a mandatory spotlight walkthrough over the real dashboard |
| 18 | Production UI requires explicit approval | Repository and flow rules already require this gate | Continue with read-only prototype only; no production UI or deployment |
| 19 | Show success only after the backend confirms persistence | Legacy intake ignores the upload result; some old paths trust a first response or local state | Require idempotent writes plus read-back/returned-record confirmation before showing success |

## Historical conflict provenance

- `d14acd9` — Aura Monday–Sunday behavior. Current instruction confirms this Aura-specific rule.
- `b270e50` — weekly/monthly analytics implementation. Current Apify schedule supersedes its monthly-only behavior.
- `3d95613` — CashDrive 5,000-view threshold. Superseded by 10,000 for every business.
- `beb2f78` — editable per-business trial threshold. Superseded by the protected 10,000 policy.
- `fcbbc70` — older manual lifecycle model. Management verification remains, but its states and audit behavior must be rebuilt around the current rule.
