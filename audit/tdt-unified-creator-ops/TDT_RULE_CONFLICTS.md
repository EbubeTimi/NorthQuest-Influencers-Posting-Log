# Authoritative rule conflict audit

Current instructions through 2026-08-27 override the earlier request and every historical repository decision.

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
