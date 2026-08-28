# GrowthCooks recruitment flow contract

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
