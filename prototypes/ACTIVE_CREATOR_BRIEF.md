# Active-creator dashboard — prototype 1

## Approval and continuity — 27 August 2026

The user said “yes i am happy lets move” after reviewing trial revision 7. This approves the trial design and moving to the next prototype, not production implementation or deployment. Keep the approved trial HTML unchanged. The remaining trial keyboard-only browser check is still unverified; approval is not test evidence.

Goal: An onboarded creator logs daily posts, completes weekly views, and switches assigned dashboards without repeating a trial.
Human and feel: Phone-first working creators; quiet, concise, task-first.
Entry and exit: Existing approved sign-in → assigned dashboard or chooser → task → confirmed result; sign out exits.
System: Reuse revision-7 typography, green/neutral colours, 48px actions, compact platform pairs, 8/12px radii.
Signature: Today/eligible Yesterday beside a clear next video slot; four view boxes for every reporting date.
Feedback: Pending saves lock actions; failure keeps drafts; success appears only after mock confirmation.
Rejecting: Trial banners, repeat qualification, public business directory, unscoped or hard-coded earnings, production data or external uploads.
Variants: One/two memberships, no videos, weekly gate, noon grace, paused membership, expired session, offline/save failure, phone/tablet/desktop.

## Bounded scope

Preserve the existing active dashboard's video logging, bonus entry and settled payment history. The 4 September review makes Home a summary-only screen and moves daily entry into a separate Track tab between Home and Videos. The current Lagos date appears before the greeting. “Your dashboard” switches between This month and All time. The monthly view shows videos logged, the month-length target at two slots per day, rate per video, expected video amount, and approved bonus count/amount. The all-time view shows cumulative videos, video amount, approved bonuses, and settled payments. A meaningless zero-naira bonus amount, the Active badge, and aggregate “Total so far” are excluded. The values are explicit demo data and are not a promise or production calculation. Bonus submission here is a mock creator-side request for review, not the trial qualification flow. Bonus review, tier calculation, approved-claim growth revisions, content guides, CashDrive Inventory/Enquiries, application management and actual onboarding remain separate flow work. No production route, schema, package or integration is changed.

The main demo is September 6 at 10 AM Lagos; September dates and all names, posts, money and records are examples, not a migration. NorthQuest uses configured 1–7/8–14/15–21/22–month-end blocks; Aura uses Monday–Sunday. A due-week scenario advances to September 8. Only assigned memberships appear; the demo person has NorthQuest and Aura, not CashDrive. A single-membership scenario has no switch button. Trial status has already passed globally.

## Flow contract

| Entry | Action / guard | Result | Recovery |
| --- | --- | --- | --- |
| Home | Open selected business | Current date, name and This month/All time summary only; a missed-Yesterday warning appears when applicable | Summary is business/period scoped and updates after a confirmed save |
| Track | Open the centre Track navigation action | Today or eligible Yesterday and two daily video slots maximum | Yesterday never appears after noon or once already logged |
| Daily form | Submit ≥1 valid TikTok/Instagram post link | Confirmed mock row, next slot or complete | Offline/failure preserves current business draft; retry cannot duplicate |
| Home | Log your views | Earliest incomplete, completed business week | No reports due shows next date, not fabricated inputs |
| Weekly form | Whole-number views for actual links only | Week complete; next overdue week or daily form | Four visible slots/date, unused slots disabled; zero allowed |
| Gated home | Earliest weekly report is due | Daily controls and summary are replaced by the single reporting task | Completing all required actual-link views reopens daily work |
| Header / sign-in | Choose assigned enabled membership | Its own dashboard and due state | No video, draft, report, claim or payment crosses business |
| Bonuses | Choose logged platform + views + screenshot | Pending mock claim | No payment amount inferred; screenshot stays memory-only |
| Payments | Open | Settled payments only, or empty state | Pending/approved claims are not paid money |
| Access failure | Paused membership / expired session | Plain message or Google sign-in | Active creators may switch to another enabled assigned membership |

Source inspected: `smithstem/app/dashboard/page.js`, shared flow contracts and revision-7 trial prototype. TypeUI MCP access was authenticated and called again on 4 September; its installed project-local fundamentals supplied the visual guardrails. The bottom navigation is a compact five-action icon bar with accessible names: Home, Track videos, Videos, Bonuses using a money-bag icon, and Payments. Creator record screens show the creator name and current date. Weekly-report rows use compact separators rather than large cards. Prototype-only risk tier: local presentation plus simulated multi-business state; this does not prove backend authorization.
