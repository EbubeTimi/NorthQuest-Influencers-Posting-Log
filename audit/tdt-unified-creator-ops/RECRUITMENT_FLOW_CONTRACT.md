# GrowthCooks recruitment flow contract

## Revision 6 — simpler outcomes, clear people and form identity

Goal: Review a person, contact them inside their assigned business, and find the outcome without extra stages.
Human and feel: Phone-first agency operator/applicant; calm vertical identity block, compact actions, clear required fields.
Entry and exit: Applicants review → accepted business → contact/outcome → business list or trial setup; Declined is distinct from Rejected.
System: Existing isolated HTML and green/system-font tokens, 44px targets; person below back icon, brand above name in Pipeline.
Signature: Exactly five stage filters; a decline visibly arrives in its own queue with reason/recorder; brand renaming changes display name, not identity or history.
Feedback: Existing 150ms/reduced-motion transitions; in-tab automatic draft feedback, save confirmations and retained failed drafts; no haptics.
Rejecting: Example as a surname, repeated navigation titles, misleading Trial accepted stage, scheduled trial end, irreversible activation from a status label, or a claim of real autosave/upload.
Variants: Not yet contacted (All stages, no extra badge), declined/rejected/accepted, optional fields, renamed brand collisions, wrong role/agency, save failure, narrow phone.

| From | Action | Guard/result | Recovery |
| --- | --- | --- | --- |
| Person review | Save accept/reject | Existing valid brand/tier or rejection reason; same record moves | Failure keeps decision; back restores queue |
| Assigned person | Outcome then Text on WhatsApp | Correct person/operator/brand message; mock composer only | Back keeps draft; opening is not recording contact |
| Contact outcome | Save Declined | Reason required; list + confirmation; Applicants Declined shows reason and recorder | Can revisit same business; never team Rejected |
| Contact outcome | Save creator acceptance | Internal consent retained, filter label Contacted; trial setup next | Start trial is explicit, never inferred from contact |
| Trial setup | Start trial | Current Lagos start, no scheduled trial end; one-trial/verification guards remain | Invitation expiry is separately a seven-day review mock, not trial termination |
| Settings Brands | Rename + Save | Unique display name, agency admin, stable internal key and unchanged history/links/policies | Validation/failure keeps draft; no member reassignment |
| Application | Type/change required answer | Required asterisk by label; automatic in-tab draft, no real network save | Navigation retains answers; refresh/reset loses demo data |

Five filters: Contacted, Cannot be reached, Unresponsive, Declined, Trial started (plus All stages). Later evidence/onboarding state remains inside the person's workflow, not additional recruitment stages. The latest no-end-until-fired request supersedes provisional trial duration for new trials; scheduled dates remain supported only for old test records, not newly generated UI cases. No new firing/termination permission is introduced. Permanent uploads and authenticated durable autosave remain planned, not implemented. Required video remains on the final full-application step; the prior UGC-No exception is unchanged.

## Revision 5 — task-local contact, quiet navigation and visible uploads

Goal: Find an accepted person inside their business, contact them without visiting Settings, and make the application/video journey clear.
Human and feel: Agency operator on a phone; compact controls, fewer boxes, clear next action.
Entry and exit: Business list → name/stage filter → person → WhatsApp draft → same person/list. Settings → application/brands only → previous workspace.
System: Existing approval-only HTML, system font/green tokens; unbordered secondary actions, 44px accessible icon-only back buttons, compact stage selector.
Signature: Messages belong to the named person/business; the application editor explicitly shows the fixed required 30-second video question.
Feedback: Status labels plus colour, counted stage choices, retained name/filter/drafts and immediate back; existing reduced motion, no haptics.
Rejecting: Message editing in global Settings, cross-business name results/counts, card-in-card outlines, calling a local object URL permanent storage, or using a back icon to sign someone out.
Variants: Zero results, stage count changes, wrong agency/brand, sender changes, template save failure/retry, long names/messages, phone/keyboard.

| Flow | Action | Result / recovery |
| --- | --- | --- |
| Named business | Search name / choose counted stage | Only authorised records from that business; back from person preserves name and stage |
| Person outreach/invitation | Contact on WhatsApp | Correct recipient, current operator name, business and readable paragraphs; local composer simulation only |
| Same contact page | Edit business default message | Collapsed inline editor for current stage/business; no Settings redirect or cross-business template selector |
| Settings | Edit application | Existing editable questions plus visible fixed required video question and optional final message; no WhatsApp section |
| Completed application | Submit video with answers | In-tab File/object URL attached to that applicant and shown in their vibe review; no upload to a real server |
| Settings/business/detail | Door-arrow back button | Accessible Back label, returns within app, never signs out or deletes drafts |

Name search is newly authorised within business Pipelines only; the prior no-search rule still applies to Applicants distribution. Stage counts are business totals independent of the name query. Planned production files belong in private, authorised media storage linked to the application; storage, scanning, retention and playback must be implemented/verified after approval. Source Forms/Sheets remain untouched. Trial duration is still unconfirmed.

## Revision 4 — settings and business context

Goal: Configure distinct questions/options, open one business's accepted people, and prepare that person's trial invitation without reselecting the business.
Human and feel: Phone-first agency operator; compact sections and clear context.
Entry and exit: Settings → edit/save/retry; Applicants Accepted or Pipeline index → named business → outreach → automatic trial setup → named invitation.
System: Existing revision-3 standalone HTML and compact green/neutral styling, 44px controls, 16px form text.
Signature: Each answer option is its own field; changing a line break never creates another option. Outreach/Invitation are two small tabs.
Feedback: Preserve drafts, focus new fields/tabs, existing 150ms page transition and reduced-motion override; no haptics.
Rejecting: Business dropdown inside a named business, newline parsing as option structure, manually entered start date, reusable unbound brand invitations.
Variants: Empty business, rejection/decline reasons, tab keyboard switching, option validation/retry, offline, midnight/month boundaries and wrong recipient.

| Entry | Action | Result / recovery |
| --- | --- | --- |
| Application settings | Add question / add or remove option | Independent labelled fields; preserve other drafts; required UGC Yes/No options cannot be removed |
| WhatsApp settings | Outreach / Invitation tab | Correct business/type draft; arrow keys and visible selected state; save version remains scoped |
| Accepted summary / Pipeline index | Open a business | Named business page with only its people/statuses, no business selector; Back to pipelines returns to index |
| Outreach | Text applicant on WhatsApp | Existing local message preview; opening it does not record a sent message |
| Trial setup | Start trial | Start date from current preview clock in Africa/Lagos; automatic end date from a duration policy, not the weekly reporting clock |
| Prepared invitation | View message/link | Assigned business in link path, same recipient-bound token; no global public trial link or production delivery |

Trial duration needs user confirmation. The old prototype used September 6 → 13 (seven elapsed days); retain this as an explicitly labelled review-only example pending the answer. It must not become production policy. Preview clock starts at the current date/time on reset and can be advanced with existing test controls. Start and end are read-only in the product form. All real account, message and persistence behavior remains mocked.

## Revision 3 — distribution-first review, August 28

Authority: latest user message plus pasted operator observations (05846ac2 attachment). New corrections override the revision-2 combined inbox. The earlier observations within the attachment remain context; no conflicting historical instruction grants production authority.

Goal: Review incoming applicants once, then continue accepted cases inside exactly one assigned business.
Human and feel: Agency operators on phones; compact, familiar lists, one task per page.
Entry and exit: Applicants → pending vibe check → reject into Rejected OR accept into selected business Pipeline → next applicant / business work.
System: Same standalone approval prototype, system font and forest green; h1 22px, row title 16px, metadata 14px, 44px minimum touch controls. No repeated agency subtitle or search box.
Signature: Accepting distributes the existing person record to one business; it never copies a person or keeps them in the pending queue.
Feedback: Short status text/chips, confirmed-save message, 150ms entrance with reduced-motion override, focus on destination heading; no browser haptics.
Rejecting: Large decorative applicant cards, one agency-wide screen carrying every stage, preliminary-answer dumps, reassigning a brand at trial start.
Variants: Empty/rejected/accepted distribution lists; separate brand pipelines; wrong agency/brand denial; failed-save retry and retained drafts; phone and desktop; expired invitation stays a review-only recovery example.

| From | Action / guard | To / recovery |
| --- | --- | --- |
| Applicants, pending | Open row | Video + name/email/WhatsApp/location + vibe decision; Back returns to same list |
| Vibe check | Accept with valid brand/tier | Same record moves into that brand's outreach; confirmation offers next applicant or open business pipeline |
| Vibe check | Reject with required reason | Rejected list, no outreach or trial; preserve decision and original record |
| Accepted distribution summary | Choose brand | Only that brand's Pipeline; no mixed-business post-review list |
| Business Pipeline | Open current stage/person | Only current stage task plus compact contact details; no introduction video or screening-answer dump |
| Outreach | WhatsApp draft / record outcome | Editable per-brand message template; accepted trial opens setup; decline reason only when declined |
| Trial setup | Start trial | Brand/tier are fixed from the accepted recommendation; bound WhatsApp invitation, no second assignment |
| Any manager detail | Back / Applicants / Pipeline | Restore correct area, business and list filter without resetting records |

Application observations retained: production should autosave verified-user drafts and survive reconnect/reload with versioned consent/retention controls. This prototype only autosaves in the open tab; it must never claim durable or cross-device recovery. UGC-comfort No should finish after required earlier answers, record a distinct early-finish outcome, require no later questions/video, and show "Thank you for applying." Full submission says "If shortlisted, we will contact you on WhatsApp." Neither outcome sends a message. Preliminary answers remain stored for audit but are not shown in normal management review.

Editable outreach/invitation templates belong to settings, with per-business scope, supported tokens, version/audit history and snapshots on generated messages. Opening a WhatsApp composer is shown as a local simulation; no live messages leave the approval prototype. Source Forms/Sheets remain untouched.

Verification: 31 current browser assertions and 43 current recruitment core checks passed; 33 unchanged trial checks also passed. Independent review found four issues, now fixed and rechecked: cross-business template drafts, invitation template context, early/full replay, and UGC-No failure recovery. Detailed proof and unverified downstream paths: `../../evidence/flows/Recruitment_Prototype/REVISION_3.md`.

The older revision sections below are preserved as provenance only. Where they mention a combined inbox, original-answer review, Oyi, trial coach/brief, broad international phone lengths, or no UGC early exit, revision 3 and revision 2 above override them.

## Revision 2 — operator review, August 28, 2026

Current feedback supersedes revision 1 wherever inconsistent. Same isolated branch and draft PR; production UI, live data, real messaging and deployment remain blocked.

- Every application answer is required except the last optional questions/message field. Email starts empty with a placeholder. City and State are separate. WhatsApp is `+` plus exactly thirteen digits (14 characters after harmless spacing is removed), with country-code hint and counter. This is the user's constrained length policy, not a universal international-phone standard.
- Agency admins: Ella, Daniel, **Uyi**, Smith. Show all applicants first. Uploaded introduction video is prominent before vibe check. WhatsApp contact is a link. In the preview uploads stay in the open tab; planned production storage is private, validated, agency-scoped media with authorised access. Retention policy and real storage are not approved or verified.
- Application form editor changes screening labels/options and adds required choice questions; identity, age and introduction fields remain required. New brand names do not grant access or invent bonus rates. Submissions snapshot form version, questions and original answers. Settings edits are scoped to agency admins, recorded, and prospective. All configuration is memory-only in the prototype.
- Accepting a vibe check exposes brand/tier, not rejection reason. Rejecting exposes reason, not brand/tier. Outreach is via WhatsApp; only creator-declined exposes a decline reason. Irrelevant reasons must not enter saved state or events. Contact attempts remain append-only; failed saves retain entries.
- Starting a trial keeps brand, tier, content type and dates, but removes coach and trial-brief URL. It prepares an email-bound invitation and WhatsApp draft. Manager product UI must not impersonate a creator. Separate review controls preview the recipient and return to the manager's saved place.
- Recipient: Google invitation acceptance → at least one public TikTok/Instagram profile → dashboard walkthrough → daily logging, weekly views, and 10k evidence. This trial setup is distinct from brand onboarding after verified success. No passwords, bank details or contract collection during trial setup. Real Google identity, delivery and secure invitation tokens are mocked.
- Trial reporting retains two video slots/day on TikTok and Instagram. Today is locked; Yesterday appears only when entirely missed, after joining and before noon. Actual posted platform links alone need views, with all four boxes visible on each due date. Each report is tied to its own period/video/platform. Trial setup date determines joining; no pre-join obligations. Prototype periods are September-1 anchored for NorthQuest/CashDrive and Monday-August-31 anchored for Aura. Production calendar configuration remains unverified.
- Trial creators can claim bonuses from 100k on NorthQuest and CashDrive; Aura has none. A claim references an exact platform/video, views and screenshot. Bonus review does not approve a trial or satisfy weekly reporting. No money is calculated or paid. Existing CashDrive amounts were explicitly an assumption later removed; confirm current schedules before production payouts. Evidence remains available for review, with no automatic deletion.
- Navigation must preserve applicant, filter and form drafts. Only explicit reset/reload clears the tab's mock state. Phone layout, focus, reduced motion, validation, retries and conditional branches require verification. Browser refresh persistence, real authentication, durable storage and real notifications are not claimed.

TypeUI fundamentals guide phone-first spacing, native controls, clear actions and conditional sections. Keep the approved trial's green/neutral visual language; no production UI changes.

Required verification: application and form configuration; video-first vibe check and all outreach outcomes; invitation/wrong account/expiry; trial setup; max-two logging and Yesterday/noon; weekly gate; separate 10k and 100k evidence; return/retry; phone/tablet/desktop, keyboard/focus and reduced motion. Actual results belong in the evidence addendum.

Authority: August 28, 2026 handoff and detailed inspected-artifact specification supplied by the user. Both read in full. Existing shared contracts continue except the explicit conflicts registered in `TDT_RULE_CONFLICTS.md`. No source Form/Sheet, live schema, membership or data is changed by this work.

## Prototype design brief

Goal: Review one application through vibe check, outreach, a trial, verified evidence and brand onboarding using the same person record.
Human and feel: Applicants, creators and agency operators on phones; calm task-first pages, short copy, visible next step.
Entry and exit: Public application → receipt; management inbox → person detail; invited creator → trial/onboarding → assigned brand membership.
System: Approved trial revision-7 green/neutral/system-font design; self-contained `prototypes/recruitment.html` because production routes call real services.
Signature: One person detail with original answers and an append-only timeline; counts open the same filtered records.
Feedback: Explicit simulated saving, inline errors, safe retry, retained drafts, irreversible-decision confirmation and clear permission states.
Rejecting: One mixed status dropdown, copied people per stage, unconfirmed subsidiary/legal claims, self-report auto-approval, source mutations.
Variants: Missing/invalid fields, duplicate flagged for human review, rejection vs decline, all contact outcomes, failed/expired trial, evidence correction, onboarding cancellation, role/tenant denial, offline, phone/desktop.

## Source and reuse boundary

Source handoff: `CODEX_CLAUDE_SMITHSTEM_RECRUITMENT_HANDOFF.md`; detailed source: `smithstem-recruitment-workflow-spec.md`, both under the supplied August 28 outputs directory. Aggregate legacy counts are the source inspector's reported observations (526 applications; 20 started trials; 14 email-duplicate groups; 16 phone-duplicate groups), not data loaded into this prototype.

Reuse candidates: existing profiles/auth user, business memberships, creators, video logs and per-platform views, private media concept, source applicant IDs, existing onboarding transition. Introduce agency/organization memberships and agency-brand engagements; split stage events instead of proliferating person tables. Existing `applicants.business_id = null` visibility to any admin and applicant-video blanket admin reads cannot serve the new agency boundary. Current direct client apply insertion and best-effort sheet sync are not immutable/durable recruitment orchestration. Existing `approve_applicant` sends trial email immediately and must be separated from outreach acceptance in future implementation.

## Record and authorization contract

ApplicantProfile is agency-scoped until verified invitation acceptance attaches a platform person. ApplicationSubmission/Answer use stable IDs and an immutable snapshot. ScreeningDecision, BrandRecommendation, OutreachCase/ContactAttempt, Trial, TrialContentSubmission, PerformanceEvidenceSubmission, TrialDecision, BrandOnboardingCase, CreatorBrandMembership, FileAsset and AuditEvent reference that identity. Versioned configuration supplies campaign fields/reasons/tiers, enabled modules and brand engagements.

Permission matrix for prototype: GrowthCooks administrators Smith, Daniel, Ella and Oyi can do daily recruitment, evidence verification and onboarding. Creator can read/update only their own allowed tasks. Brand staff see only explicitly assigned engagement records; no unassigned applicant inbox. A different agency sees none of GrowthCooks' records. These are local simulated guards, not Supabase authorization proof. Smith-only admin appointment, full export, tenant destruction and bulk deletion remain proposed policy and are not exposed as operations.

Every committed event records agency, record/person, actor, role, action, before/after, reason, brand/tier, source, time and evidence reference. Snapshot corrections are new records. Original evidence remains visible after verification. Do not log credentials or financial account details. Files are private in production; prototype object URLs remain in-memory and are disposed on reset.

## State and transition map

| Flow | State / actor / action | Guard | Result and recovery |
| --- | --- | --- | --- |
| R01 Application | Applicant completes About you → Creation → Introduction/review | Required fields, age confirmation, valid email/international WhatsApp, validated video | Immutable local submission; receipt. Offline/failed save preserves draft, no inbox row until success. |
| R02 Vibe Check | Agency reviewer reads original answers and introduction; accepts/rejects | Pending review, engaged recommended brand, tier; rejection requires team reason | Separate decision; acceptance opens outreach. Other reason needs note. Cancel leaves record unchanged. |
| R03 Outreach | Record a contact attempt/outcome | Accepted screening; actor/channel/result; declined has its own reason | Append contact event; update outreach projection. Cannot be reached and unresponsive remain distinct. Opening WhatsApp does not log a sent message. |
| R04 Trial | Start trial after creator accepted | Agency/person/brand/tier/content type/start/due/brief/coach; no second ongoing trial; not already passed | Trial Started + invitation handoff, not active membership. End trial requires outcome/reason. Expiry never implies failure without recorded outcome. |
| R04 Creator trial | Invited creator submits a recorded content link and proof | Own current trial, date within trial; exact platform link; count ≥10,000; PNG/JPG/WebP screenshot | Awaiting verification, one evidence snapshot, notification event. Invalid/offline drafts retained; weekly reporting remains independent. |
| R05 Verify | Agency operator examines link and screenshot; verifies or requests correction | Eligible immutable evidence; explicit link/screenshot confirmation | Success → one TrialDecision + one OnboardingCase. Correction preserves original evidence and awaits new submission. Retry cannot duplicate onboarding. |
| R06 Onboarding | Start → creator completes proposed brand tasks → manager completes | Verified success, assigned brand; creator tasks complete; explicit management confirmation | One enabled membership, same identity. Bank/contract/employment work remains separate. Cancellation records reason, no membership. |
| R07 Detail/timeline | Allowed actor opens any count/list/person | Agency, engagement or self scope | Read shared record and append-only history; no duplicate tables. Unknown/unauthorized targets show generic access denial. |

## Application field IDs and prototype assumptions

`email`, `fullName`, `whatsappRaw`, `whatsappE164`, `ageConfirmed`, `city`, `phoneQuality`, `editingSkills`, `cameraComfort`, `experience`, `ugcComfort`, `briefComfort`, `dailyCapacity`, `availability`, `introVideo`, `additionalInfo`.

Core answers are required, additional information optional. Experience retains the stated regular/occasional/willing-to-learn choices. Camera comfort: Yes / Sometimes / Prefer faceless content. Daily capacity: Yes / No / Wants schedule details. Start: Immediately / In three days / In one week / More than one week. Four brief-comfort levels are described, but their exact labels were not supplied: demonstrate clearly marked provisional labels pending source-copy confirmation. Age is a checkbox confirming the stated 18–30 requirement, not unnecessary full DOB collection. No automatic rejection solely for negative or alternative answers; management screens them.

WhatsApp requires an explicit international prefix, preserves raw text and normalizes punctuation into E.164 shape. Full country-number validity will need a tested phone parser before production. Prototype does not place a WhatsApp call or send a message. Upload limit from the source introduction form is one video up to 1 GB; the prototype validates format/size and previews locally, never uploads. Practical production limits, transcode/scan and retention must be confirmed before storage implementation.

A brief URL and brand-task checklist use marked examples. Onboarding tasks (read brand brief, provide public platform profile link, management review) are a proposed MVP handoff for approval; they do not replace actual contracts or employment requirements. There is no production contract acceptance in the prototype.

## Unchanged seams

Exactly two TikTok/Instagram videos/day; shared business weeks; Aura Monday–Sunday; Today locked, eligible Yesterday until noon; actual post-only weekly report obligations. A trial proof submitted midweek does not clear weekly views. One globally passed trial is reused for future explicit brand assignments, never automatic access. Recruitment interface does not call or replace the approved trial logger; its review panel links to that existing preview.

## Deferred and unverified

Migration: prepare mappings and source-provenance rules only; no legacy rows, identities, passwords, counts or assets imported. Frozen source export, mapping approval, duplicate review, missing-brand/date/tier quarantine and 526-record reconciliation are required before rehearsal/cutover. Full importer and real caller isolation tests belong to post-approval implementation, not a mocked-browser claim.

Real Google sign-in, email-bound invitation redemption, storage durability/virus checks, notifications, append-only database enforcement, concurrent transactions, RLS, exact phone validation and production scale remain UNVERIFIED. Cross-tenant tests in this prototype prove only local guards. Full launch readiness still requires the existing September contract plus approved recruitment scope.

Review UI must expose approve/revise/reject + notes as a local response aid, not an automatic production approval. No native haptics used; reduced-motion preferences remove transitions. Keyboard/screen-reader/device proof is reported separately from mouse-driven browser tests.
