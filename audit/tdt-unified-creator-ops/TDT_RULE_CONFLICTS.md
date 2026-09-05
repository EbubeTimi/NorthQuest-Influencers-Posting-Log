# Authoritative rule conflict audit

## Brand onboarding revision — 3 September 2026

- The onboarding-ready and completed states remove decorative tick marks and centre the NorthQuest status and primary action. Ready copy is reduced to “Onboarding is ready”, “Click below to start”, and the same-Google-account instruction.
- Creator profiles require separate username and public-link fields for TikTok and Instagram. The user's request to collect passwords conflicts with the locked security objective and the confirmed legacy credential exposure. Smithstem will not collect/store/export passwords; business access must use platform permissions or a separately approved credential vault.
- Replace arbitrary signed-PDF upload with the complete approved agreement rendered in the phone flow, designated name/address/date fields, acknowledgement and drawn signature. Production generates and privately stores the whole signed PDF plus immutable version/hash and signing evidence; legal text is not editable by the creator.
- Management chooses the exact sections needing correction and supplies a note. Only those sections reopen; accepted sections and original submissions remain retained.
- Searchable/free-text Nigerian financial-institution entry replaces the three-option bank dropdown. Current account-number validation is exactly ten digits.
- Paused active creators lose operational write access but retain read-only payment statements, video history and bonus history. Monthly payment transparency on the 10th belongs to the active-dashboard/payment-ledger flow.

## Verification findings — 28 August 2026

See [storage verification](../../evidence/flows/Recruitment_Prototype/STORAGE_VERIFICATION_2026-08-28.md). These are observed integration gaps, not changes to product decisions:

- The new private Drive destination is not used by either application route. Generic apply attempts the legacy global-root Drive/Sheet sync; brand-specific apply does not. Folder existence and tool-based text readback are not website-upload proof.
- The repo-default Supabase project explicitly reports Google sign-in disabled. Deployment overrides and authenticated destination settings remain unverified; public-role empty rows do not prove missing configuration.
- Legacy weekly collation excludes trials, chooses all-time maximum reports and can select an unfinished window; legacy Apify remains monthly-only. These cannot satisfy the approved reporting contracts.
- Legacy onboarding stores only a signature PNG and can append supplied social-account passwords into a brand Doc. Full contract retention and secure credential handling require separate implementation before reuse; no sensitive Doc contents were read.
- Build and local prototype checks pass, but live role isolation, durable video attachment, reviewer playback, failure recovery and retention remain open gates. Source Forms/Sheets and production settings remain untouched.

## Onboarding audit — 29 August 2026

- The legacy production onboarding page asks for brand email, Instagram and
  TikTok passwords and passes them to the Drive synchronization function. This
  directly conflicts with the current security contract. The new flow must
  never request, store, export or log social/email passwords.
- The legacy flow stores a drawn signature PNG and may activate the creator
  before an external Drive copy finishes. Current onboarding requires the
  complete accepted contract version plus complete signed document, durable
  confirmation, and an explicit management completion before one active brand
  membership is created.
- A default NorthQuest fallback for an account with no assigned business is not
  permitted. Onboarding must derive the brand from the verified trial decision
  and onboarding case; unknown or mismatched assignments fail closed.
- This audit authorizes an approval prototype and removal from the future
  design, not a production route change, contract rewrite or live-data cleanup.

## Latest storage decision — Google Drive selected

- User explicitly selected Google Drive; supersedes provider-pending and the private-Supabase recommendation, but does not authorize deployment or real-data deletion.
- Private destination folder is created and owner-only access verified. The Drive connector authorization does not authorize Smithstem's website runtime. Do not mark uploads complete based on folder creation.
- No retention duration is approved. Keep automatic cleanup off; do not conflate temporary introductions with retained trial/bonus evidence. History stays.
- UI/UX polish is deferred until remaining flows are complete, not permission to skip working-flow checks or ship unreviewed production UI.

## Recruitment revision 7 — acceptance and temporary-media boundary

- User accepted the recruitment flow for now, not production implementation/deployment. Final visual polish remains deferred; History is explicitly wanted for audit. Business titles move below Back.
- Introduction videos may be temporary; viewing once is not a reliable deletion trigger. Provider, retention interval, recovery and deletion authority remain undecided. Do not delete anything or apply this temporary-introduction rule to trial/bonus evidence.
- Earlier “storage is not built” language applies to the new prototype integration, not the entire repository. Legacy `applicant-videos` uploads, signed playback and a Drive/Sheets copy function exist. Live access/policies have not been verified in this turn.
- The tracked bucket caps uploads at 100 MiB, whereas the recruitment prototype/spec says 1 GB. Tracked upload/read policies are broader than the intended agency isolation, and the legacy sync also writes Sheets. These are implementation blockers, not permission to change live storage or the source Sheet. See `RECRUITMENT_STORAGE_ASSESSMENT.md`.
- Explicit next-phase review remains the existing one-person trial → qualifying link/screenshot → management verification → brand setup → local membership. It does not restore the superseded automatic self-report onboarding rule.

## Recruitment revision 6 — current operator corrections

- Five visible stage choices replace the larger state filter: Contacted (including awaiting response/accepted consent), Cannot be reached, Unresponsive, Declined, Trial started. All stages also includes not-yet-contacted people without inventing a Contacted event. Evidence, corrections, onboarding and membership guards are still separate internal states.
- Declined applicants have their own Applicants queue, reason and recorder; they remain findable by their assigned business but leave Accepted summaries. They never become Rejected by management. Recontact may update the current outcome without deleting prior contact history.
- New trials have no scheduled end date; remove routine End trial UI. This supersedes the previously unconfirmed seven-elapsed-day trial example. Existing dated test cases remain compatible. The mock invitation still has a separate expiry; no automatic firing or production termination mechanism is introduced.
- Brand names become editable display labels; stable keys, invitation paths, assignments, bonus/reporting policies and immutable past records are not renamed or migrated. Rename is agency-admin scoped, audited in local settings history and collision checked.
- Fictional examples now use realistic surnames, person details sit below Back, and Pipeline brand precedes the name. Contact action follows Outcome; Save replaces long decision captions. Redundant visible Applicants/Pipeline headings are removed, with accessible headings retained.
- Application shows GrowthCooks Marketing Agency / Creator application and required marks by labels. In-tab autosave already exists and remains local; durable authenticated autosave and private media storage are not built or claimed. UGC-No early completion remains the earlier explicit exception to the full form.

## Recruitment revision 5 — latest task-placement corrections

- Global Settings WhatsApp templates and Outreach/Invitation tabs are superseded. Messages belong inside the selected person's assigned-business Pipeline; current stage chooses the message type. A collapsed editor changes only that business/stage default. Drafts are scoped to current operator, person and type.
- Prior removal of search still applies to Applicants distribution, but the user now explicitly requests **name search within each business Pipeline**. Stage counts show business totals independent of the name query. No cross-business results or unauthorized counts.
- Wide back controls are replaced with door-arrow icons with accessible Back labels. These return within the workspace, never sign out; Settings has one heading and returns to the prior context.
- The 30-second introduction upload was already on the final application step but absent from the editor. The editor now shows that fixed required question and the optional final message. UGC-No early completion remains the separately authorized exception.
- Video location is explicit: this prototype keeps a File/object URL in the open tab and shows it on that applicant's vibe-review page. Planned private permanent storage, authorized playback, validation/scanning and retention are not implemented by this revision. No real upload claim or source Form/Sheet edit.
- Reduce nested boxes and bordered secondary actions, preserving visible input boundaries, text status labels, focus styling and 44px controls. Trial duration remains provisional and unrelated to weekly reporting.

## Recruitment revision 4 — latest operator corrections

- Pipeline's Business dropdown is replaced with an explicit business index and named business-only pages. Accepted summaries open the same scoped lists. Returning from a creator preview preserves that business and applicant.
- Newline-delimited choice text is replaced with separately labelled option fields. Multiline text remains one option. The UGC branch retains exactly Yes/No because those answers control early completion; other choices and question wording remain editable. Original submissions retain their snapshots.
- WhatsApp message type is two tabs, not a dropdown. Recipient-specific action says Text [name] on WhatsApp; live sending remains mocked.
- Trial start becomes the current Lagos date; end derives automatically. No source authorizes a fixed duration. Seven elapsed days is only the old prototype example, clearly marked pending user confirmation, not the weekly reporting rule. Recipient link includes the assigned business, not a reusable unbound brand URL.
- Switching the preview clock to an ISO timestamp exposed UTC/Lagos disagreement in evidence and bonus validation around midnight. Both now use the same Lagos day; new failing-first regressions pass.

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
| Contract password-sharing language vs secure reassignable brand accounts | Use brand-controlled TikTok Business Center and Meta Business Portfolio ownership/recovery with removable creator roles. Smithstem never stores raw platform passwords. | Existing legal documents must be replaced only through a reviewed, approved new contract version; no silent edits to signed agreements. |
| September 4 request to add social passwords before Business Center setup vs secure credential boundary | Do not add raw TikTok/Instagram password fields to Smithstem. If temporary credential handover is genuinely required, use a separately approved password vault outside the application with restricted access, MFA, rotation and deletion; continue researching platform delegation. | Onboarding prototype and production schema remain credential-free. This boundary can change only through a dedicated security/legal decision, never as an ordinary form-field edit. |
| In-app contract drafting/approval queue vs Smith's upload-and-use workflow | Contract wording is prepared in Microsoft Word and uploaded as a complete brand-scoped DOCX or PDF. Smith is the sole current contract authority; Smith's explicit “Make live” confirmation immediately updates the contract for new onboarding, with no second approver or waiting state. | Keep the backend permission role extensible for future delegation. Existing signed PDFs and their exact source/hash remain immutable and privately retained; a changed contract can create an explicit re-signing request. |
| Supplied contract labels vs document contents (3 September 2026) | `UGC Agreement (2).docx` and `(3).docx` are textually and visually identical NorthQuest agreements; neither is an Aura agreement. The separately named CashDrive upload was unavailable during final inspection, so an older local CashDrive contract was comparison-only. | Do not assign or publish an Aura/CashDrive template from filename alone. Obtain and review the correct distinct source files before implementation. |
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
| 9 | Apify runs 1–14, 1–21, and 1–month-end for all businesses, with a separate Apify account/credential for NorthQuest, CashDrive, and Aura | Code is monthly-only with a day-one-next-month cron and `get_apify_token()` returns one shared Vault secret named `apify_api_token` for every business | Replace with three cumulative monthly windows, per-business job isolation, and server-only business-to-secret resolution. Never fall back to NorthQuest or a global token when another business is unconfigured |
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
| 20 | Management needs one connected operational view | Existing work is split across recruitment, trial, onboarding, creator, bonus and payment surfaces with no single scoped queue | Use one management projection over the same business-scoped records; do not create duplicate creator or payment data |
| 21 | One-business pause differs from whole-person suspension | Older deactivation language can imply that every business is disabled together | Keep membership pause business-scoped; reserve whole-person suspension for an explicit Smith-only action and audit both |
| 22 | Trial evidence approval must retain creator and business context | A prototype transition could display a different sample creator/business after approval | Carry the selected creator, evidence and business through onboarding; tests must reject cross-business or cross-person transitions |

Contract re-signing selection is row-level: management may tap the creator's name or anywhere in that creator row, not only the small checkbox. Select all/Clear all remains available for bulk selection.

Management/admin surfaces are PC-first while creator surfaces remain phone-first. This changes layout priority, not feature or permission scope: every management action must still reflow and remain usable on a phone.

## Historical conflict provenance

- `d14acd9` — Aura Monday–Sunday behavior. Current instruction confirms this Aura-specific rule.
- `b270e50` — weekly/monthly analytics implementation. Current Apify schedule supersedes its monthly-only behavior.
- `3d95613` — CashDrive 5,000-view threshold. Superseded by 10,000 for every business.
- `beb2f78` — editable per-business trial threshold. Superseded by the protected 10,000 policy.
- `fcbbc70` — older manual lifecycle model. Management verification remains, but its states and audit behavior must be rebuilt around the current rule.
