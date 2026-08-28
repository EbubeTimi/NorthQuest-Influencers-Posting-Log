# TDT trial creator prototype brief — revision 7

## Current review position — August 28, 2026

Recruitment revision 6 is current: spaced vertical person identity (Amara Okafor/Noah Adeyemi as fictional examples), five Pipeline stage filters, a separate Declined queue with reason/recorder, contact action after Outcome, compact Save, editable brand display names and GrowthCooks application branding/required marks. New trials have no scheduled end; consent remains internal until explicit Start trial. Required video and automatic drafts remain in-tab only, not durable storage. Current proof: `../evidence/flows/Recruitment_Prototype/REVISION_6.md` (40 browser checks and 63 recruitment core checks). Prior descriptions below are historical where they conflict. Production is still blocked; next review continues the same person through trial/onboarding and active dashboard.

Recruitment revision 5 is current. WhatsApp messages/defaults now live on the named person's Pipeline contact page, not Settings. Settings contains application questions and brands only, with one heading and an accessible door-arrow back icon. Business-only name search and counted compact stages preserve the operator's place. The fixed required 30-second introduction upload is visible in the editor and its filename in applicant review. Secondary actions and question groups are borderless. See `../evidence/flows/Recruitment_Prototype/REVISION_5.md` for 34 fresh browser checks, 56 recruitment core checks, and explicit upload/keyboard limits. This is a review revision, not production approval. The revision-4/3 descriptions below are history where they conflict.

Recruitment revision 4 is now the current review: separate option fields and visible Add question, Outreach/Invitation tabs, a Pipeline business index leading to named business-only lists, clearer WhatsApp actions, and automatic start/date derivation. The invitation link contains the assigned business and recipient token. Trial duration remains unconfirmed: the old seven-elapsed-day example is explicitly provisional, separate from weekly views. See `../evidence/flows/Recruitment_Prototype/REVISION_4.md`. The next review is the connected trial → evidence verification → brand onboarding → active-dashboard handoff, not a restart of Applications.

Recruitment is now revision 3, following the latest operator review: **Applicants is a compact distribution queue**, not the whole operations workspace. Review the introduction once; accept into one business or reject into a separate list. The existing person continues in that business's **Pipeline**, with only the current task visible. Brand-specific outreach and invitation templates are editable in Settings. UGC No has an early ending; full applications mention WhatsApp follow-up. Phone rows use 16px names, 14px metadata and minimum 44px controls. The duplicate agency subtitle and search are removed.

Use the same `recruitment.html` URL. See `../evidence/flows/Recruitment_Prototype/REVISION_3.md` for fresh proof and limits. This recruitment revision still needs the user's review; it is not production approval. The prior trial approval below remains unchanged.

The user approved the trial revision-7 visual design with “yes i am happy lets move.” This does not grant production implementation or deployment approval. Its separate keyboard-only check remains unverified.

The new GrowthCooks recruitment approval flow is `recruitment.html`, in this same local prototype host. It covers Application → Vibe Check → Outreach → Trial Evidence → Brand Onboarding and needs its own review. See `../audit/tdt-unified-creator-ops/RECRUITMENT_FLOW_CONTRACT.md` for authority, state transitions, mock boundaries and pending choices, and `../evidence/flows/Recruitment_Prototype/VERIFICATION.md` for test evidence. The trial page remains unchanged. The active-dashboard draft is preserved, not restarted, and awaits its remaining browser review after this recruitment slice.

The sections below preserve the prior trial revision history; their old “next” steps are superseded by this current review position.

## Current visual refinement — TypeUI-guided, 2026-08-27

Goal: Refine the already-reviewed trial flow, without restarting discovery or changing product rules.
Human and feel: Phone-first creators and management; quiet utility, clear hierarchy, compact forms.
Entry and exit: Same revision-6 entry, guards, recovery, review, and onboarding-ready boundary below.
System: Project-local TypeUI fundamentals; system font, 28/20/18/16/14px roles, 400–600 weights, forest-green primary action, neutral borders, 8/12px radii.
Signature: Daily form first; two soft platform colours within four visible weekly boxes per date.
Feedback: Clear focus, pressed day state, native form semantics, unchanged simulated saves/errors/uploads.
Rejecting: Decorative statistics, large marketing typography, fake Google icon, new business rules, production implementation.
Variants: 320/360/390px phones, wider host panes, all existing functional states and mandatory tour.

TypeUI account access was verified. Its design calls returned setup guidance rather than usable designs. The installed six-file `typeui-fundamentals` package was read directly and applied; this is NOT claimed to be a remotely generated TypeUI design. Source: bergside/typeui at `2a977f1f6616ae8a5ea84a478ca35601c67f4322`, installed project-locally with no app dependencies.

User requirements take priority over generic guidelines: compact 8px heading-to-support gaps and 1.2 heading line-height support phone readability; the first-use tour remains mandatory; the prototype keeps memory-only drafts and explicitly mocked authentication/uploads. No optional skip, persistence, or production capability was introduced.

Button contracts: native default/hover/active/focus/disabled styling applies throughout; Google and submit controls use the existing loading model and disable during pending work; save/send outcomes use the existing status toast and destination; validation/offline states keep a retry path; day and preview toggles expose `aria-pressed`. Existing action/guard/recovery map below is unchanged. No new workflow is added.

Production remains untouched and unapproved. Applications, full onboarding, and the active-creator dashboard remain separate future flows. Revision 6 is preserved in commit `bbcd2b8` before this visual pass.

## Preserved functional baseline — revision 6

Goal: Complete the phone-first trial walkthrough, weekly four-slot reporting, and a single qualifying-video submission.
Human and feel: Creator and manager on phones; short words, visible next action, readable 16px inputs.
Entry and exit: Tour → actual weekly form; dashboard → video/count/screenshot together → review → onboarding-ready.
System: Same isolated HTML and green/cream palette; Phone width applies at every host window width.
Signature: Each date always shows Video 1 and Video 2 × TikTok and Instagram; unlogged slots stay visible but disabled.
Feedback: Correct spotlight and scroll; review controls remain reachable; image/count locked during send.
Rejecting: Video 3, Facebook entry/bonuses, standalone screenshot tasks, fabricated reports for empty slots.
Variants: Missing day/platform/video; weekly vs anytime submission; correction/resend; 360/390px phones and narrow browser panes.

| From | Action / guard | Destination / container | Recovery |
| --- | --- | --- | --- |
| Tour step 2 | Next | Actual weekly form, first day's four-slot panel highlighted | Guide stays visible; no data change |
| Weekly form | Save real logged-link counts | Dashboard; qualifying count may prefill combined submission | Empty slots never require numbers; no separate screenshot task |
| Dashboard | Submit for review | One form: logged video/platform, ≥10,000 views, screenshot | Cancel/offline preserve local draft; same form handles correction |
| Complete submission | Valid proof | Manager queue and pending page | No review/notification before full submission; no weekly gate bypass |
| Manager | Keep in trial / approve | Same submission form / onboarding-ready | Screenshot and exact post URL always available for sent review |
| Reviewer | Phone / Tablet / Desktop | Resized preview at any host width | Available even during the walkthrough; active mode indicated |

Exactly two video slots per day; the prototype rejects a third video. Every date from joining (or the period start, whichever is later) through the reporting-period end shows four boxes. Only actually logged links are editable/required. “No video logged” is not a zero-view report. This changes the old sparse-layout decision without creating new reporting obligations.

Sign-in says “Use your personal Google account.” Access remains planned as a manager-issued email-bound invitation followed by enabled membership checks; prototype Google/auth/permissions are mocks. Paused page has no exclamation mark; expired-link message is centred. Screenshots only belong to the 10,000-view submission. Weekly saves do not independently create proof tasks or management reviews. Management opens the recorded post URL, not a profile; sample URLs remain labelled as examples.

Production remains unchanged and unapproved. Next: review this revision, then active-creator dashboard. Application and actual onboarding flows remain separate. Both flow skills are used; plain-language writing fallback applies.

## Historical revision-5 correction pass — 2026-08-27

Goal: Reach weekly reporting and an anytime 10,000-view submission from the trial dashboard.
Human and feel: Phone-first trial creator; obvious next action, short copy, compact number entry.
Entry and exit: Dashboard → weekly views OR qualifying video + screenshot → review → onboarding-ready.
System: Existing isolated HTML, green palette, readable two-column platform inputs within each video/date.
Signature: A visible “Reached 10,000 views?” action independent of the weekly deadline.
Feedback: Inline validation, local confirmation, preserved offline drafts; no real upload/notification.
Rejecting: Hidden screenshot task, milestone submissions clearing weekly obligations, invented empty platform fields.
Variants: Midweek, overdue week, Videos 1–3+, one platform, pending/correction/approval, phone/desktop.

| From | Trigger / guard | To / container | Recovery and feedback |
| --- | --- | --- | --- |
| Dashboard | Log your views; completed reporting week | Weekly form / page; always reset Yesterday selection | Focus heading; back only when all obligations saved |
| Dashboard or weekly gate | Reached 10,000 views? | Milestone form / page | Select a previously logged video/platform; cancel returns to dashboard/gate |
| Milestone form | ≥10,000 on one posted link + valid screenshot | Pending review / page | Invalid count/image inline; offline retains draft; does not save weekly views |
| Weekly form | All actual posted-link counts saved; qualifying count found | Screenshot form / page | Screenshot task also remains visible on dashboard |
| Pending review | Return to dashboard | Trial logging or due weekly form | Continue normal weekly obligations; no duplicate review |
| Manager review | Approve screenshot/link | Onboarding-ready / page and next dashboard visit | Only Start onboarding; actual onboarding not implemented |

Review pending copy: “Your video is being checked.” and “After approval, Start onboarding will appear on your dashboard.” No tick or Under review badge on that page. Approved: “Onboarding is ready.” + Start onboarding, no management explanation or dashboard return.

The user will provide application-sheet sorting screenshots. Next review surfaces: TDT application form and application-review results, actual onboarding, active-creator dashboard; build/review separately, not silently added to this trial revision. Production UI approval remains outstanding. Writing uses the portable plain-language fallback because humanizing-writing is not installed.

The historical revision-4 checks below are baseline evidence, not revision-5 proof.

## Preserved revision-4 foundation (historical baseline)

The user's observations are complete. This is permission to revise the prototype, NOT approval for production UI. Visual redesign follows separately.

Goal: One assigned trial → daily links → views on actual posts → screenshot proof → management approval → onboarding-ready.
Human and feel: Phone-first, one clear task, no technical rule lectures or discouraging totals.
Entry and exit: Welcome / Google sign-in directly into the assigned trial; no chooser or switching.
System: Reuse the existing single HTML, one-column layout, type and green palette.
Signature: Today and genuinely eligible Yesterday, derived from mock time and submitted records.
Feedback: Inline saving, preserved drafts, focused errors, reduced motion; no real uploads or notifications.
Rejecting: Repeated trials across businesses, fabricated view fields, public screenshots, or fake completed onboarding.
Variants: Missing day/platform, noon/join boundaries, screenshot validation/retry, approval and paused access.

- Invitation: “Welcome to your NorthQuest Creator dashboard.” TDT only; Continue with Google; no invented recipient or invitation/one-use copy.
- One ongoing trial per person. Passing it is TDT-wide; later recommended memberships do not require another trial or grant automatic access.
- Yesterday exists only if missed, before 12:00 PM Africa/Lagos, and not before joining. Success requires mock confirmation; no duplicate clicks.
- Views are required only for recorded video/platform pairs in the completed shared period after joining. Unposted days and unused platforms create no fields. Zero remains valid for a posted link.
- Date text derives from actual due records. Remove the creator-facing 10,000 lecture and old paused-form banner, but preserve the individual-video threshold and manager approval internally.
- Add image proof and qualifying video URL; show the same screenshot and exact submitted link to management. Image previews are local memory only, PNG/JPEG/WebP up to 5 MB, cleared on reset/reload. Production deletion/retention is undecided, not silently chosen.
- Paused screen: “Your access has been paused.” No other business, account choice or sign-out button.
- First use is the normal empty logging form. No totals/recent videos.
- Actual onboarding, active creator dashboard and full management dashboard remain explicitly outside this revision.

### Revised transition map

| From | Trigger | To | Recovery |
| --- | --- | --- | --- |
| Welcome/sign-in | Mock Google success | Mandatory help / assigned dashboard | Loading/error/retry |
| Dashboard | Eligible day + valid links | Confirmed saved record | Draft preserved; duplicate prevention |
| Dashboard | Due reports | Views for actual posts | Eligible previous-day catch-up adds its own obligation |
| Views | All actual entries saved | Dashboard / screenshot task | Invalid count focused; offline draft retained |
| Screenshot | Valid image + exact video link | Under review | Preview, replace, remove and retry |
| Management | Verify proof and approve | Onboarding-ready; TDT trial passed | Keep in trial; one mock notification |
| Any creator route | Deactivate | Access paused | No alternate business route |

## Proof and scope

- 22 contract/logic checks and 54 in-app-browser checks passed for revision 4, plus 13 existing bonus regression checks.
- Screenshots and the dated result are in evidence/flows/TDT_Prototype/revision4-*.
- Revision 3's brief is retained in Git history (02b12b0), not repeated here as conflicting current instructions.
- All Google login, uploads, saves, manager identity, notifications and approval effects are simulated. Browser image previews and link hrefs are real local interactions; external social-video validity is not verified.
- Prototype is NOT production-ready implementation. No backend changes, production deployment or actual onboarding were performed.
- Review assurance: self-reviewed, lower assurance. Full visual design refinement follows this functional correction pass.
