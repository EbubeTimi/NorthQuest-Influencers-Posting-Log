# TDT trial creator prototype brief — revision 5

## Latest correction pass — 2026-08-27

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
