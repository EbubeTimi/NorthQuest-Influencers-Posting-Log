# Affected flow map

August 28 authority: recruitment expands F11 into R01–R06 in `RECRUITMENT_FLOW_CONTRACT.md`. Applications are agency-scoped in GrowthCooks Marketing Agency. Trial revision 7 visuals are approved; the new recruitment flow is not. Existing daily logging/weekly rules remain in force.

## Delivery sequence and current status

This is the dependency order, not a collection of separate applications. Each
person and decision continues into the next phase using the same identity and
audit history.

| Order | Flow | Current status | Completion boundary |
| --- | --- | --- | --- |
| 0 | Platform security and configuration | Branch fix verified; live RLS and Vercel variables pending | Backup, live RLS verification, four Vercel variables, advisor clear |
| 1 | Application → vibe check → business distribution → outreach | Prototype accepted for now; final visual pass deferred | Durable agency-scoped intake, private introduction video, audit history |
| 2 | Trial invitation → logging → weekly views → 10k evidence → review | Revision 7 prototype approved | Real invitation/auth, persistent evidence, management decision |
| 3 | Brand onboarding | Revised prototype ready for review | In-app contract signing, targeted correction, management check, one idempotent active membership |
| 3A | Management business contracts | Revision 2 ready for review | Complete Word/PDF upload, Smith confirmation, immutable signed PDFs, private history and re-signing |
| 4 | Active creator dashboard and business switching | Revision 16 behavior/flow approved; production UI remains blocked | Daily/weekly/bonus/payment flows and membership isolation |
| 5 | Unified management dashboard | Revision 2 ready for review; PC-first and phone-responsive | Businesses, creators, access, evidence, onboarding, lifecycle and audit |
| 6 | CashDrive enquiries | Source fields inspected; not yet prototyped | Creator submission, management stages, CashDrive-only access and history |
| 7 | CashDrive inventory | Not yet prototyped | Vehicle/media/status records linked safely to enquiries and content |
| 8 | Sheets and Apify operations | Historical code conflicts with current rules | Weekly Sheets plus cumulative 1–14, 1–21 and month-end jobs using one isolated Apify account per business |
| 9 | End-to-end staging, scale and security | Local checks only | Real role isolation, uploads, retries, 1,000+ creator performance |
| 10 | Final TypeUI/UI–UX pass and production approval | Deferred by user until flows are complete | Phone-first visual approval, then separate implementation/deploy approval |

### Connected hand-offs

```text
Application
  → management vibe check
  → assigned business pipeline
  → WhatsApp outreach and creator acceptance
  → one TDT trial
  → exact video + 10,000 views + screenshot
  → management verification
  → brand onboarding
  → active business membership
  → active creator dashboard
  → weekly Sheets / scheduled Apify operations
```

CashDrive adds two sibling operational areas after membership: Inventory holds
the cars the business can offer; Enquiries holds buyer leads submitted by
creators and linked to the relevant creator and, when known, vehicle. Neither
area changes trial qualification or weekly reporting.

## F01/F02 — Receive an invitation and sign in

- Management sends a business-specific, expiring invitation to the creator's personal Gmail address.
- The creator opens the link and continues with Google. The verified Google email must match the invitation.
- Claiming a later invitation adds another business membership to the same person/login.
- Failure states: expired, already used, wrong email, deactivated invite, offline, and retry.

## F03/F04 — Choose and switch assigned work

- A creator with one enabled membership goes directly to that dashboard.
- A creator with several enabled memberships chooses after sign-in and can switch later.
- The chooser shows assigned memberships only; it never lists unrelated businesses.
- Server authorization validates the selected membership on every scoped request.

## F05 — Learn the dashboard

- A mandatory first-use spotlight walkthrough highlights controls on the real dashboard. It has no skip action, completes in a few short steps, and can be reopened from Help.
- Creator-facing copy uses plain dates and tasks. It does not explain internal concepts such as shared cycles, tenant isolation, or creator operations.
- The creator completes the first walkthrough and may reopen Help later; there is no skip action.

## F06/F07 — Log videos, use the noon grace, and clear views

- The dashboard shows a locked Today choice. Yesterday appears only when it was not already logged and the current time is before 12:00 PM.
- Aura follows Monday–Sunday; other business date blocks come from their configured rules.
- New creators enter the current business period immediately and owe only videos logged after joining.
- Yesterday's missed video remains available until 12:00 PM the next day.
- At midnight after a period ends, required view entry blocks the next normal video submission until all due video/platform views are saved.
- Reports remain tied to their exact video/platform, with idempotent retry behavior; the due query is bounded to the completed date period.
- A submission is shown as successful only after the backend confirms the durable record. Validation, offline retry, duplicate submission, and wrong-business denial preserve data and focus recovery.

## F08/F09 — Review a 10,000-view video and unlock onboarding

- A complete submission for one eligible recorded video/platform, claimed views ≥10,000 and screenshot creates one management notification and review item. A high weekly report alone does not.
- The creator sees “Your video is being checked.” and remains a trial creator.
- Management sees the creator photo, business, join date, video links, self-reported value, and audit context; management checks the actual platform.
- Management approval unlocks onboarding. Keeping the creator in trial does not erase the report.
- Different videos are never summed. Retries never duplicate the notification or decision.

## F10 — Deactivate access

- Management may deactivate one business membership without deleting the person, other memberships, or history.
- A whole-person suspension is a separate, higher-impact action.
- Joined, deactivated, reactivated dates, reason, and acting manager are audited.
- For an active creator, operational writes stop while payment statements, video history and bonus history remain available read-only.

## F09A — Complete brand onboarding

- The approved trial creator enters with the same Google identity, confirms personal details, and supplies separate TikTok/Instagram usernames and public profile links.
- Bank entry supports search and free text; the account number is exactly ten digits in the current Nigerian payment contract.
- The complete approved contract is read and signed in-app. The system generates an immutable signed PDF rather than accepting an arbitrary uploaded document as the contract.
- Management reviews the generated agreement and every section. Corrections name exact sections and reopen only those fields; completion creates one active business membership.
- Social account passwords are never collected by Smithstem. Account control uses official platform roles/permissions or a separately approved credential-vault handover.

## F11 — Applications

- Applicants submit an agency-scoped GrowthCooks application, separate from brand membership, using stable field IDs and all questions in the August 28 source specification.
- Management reviews immutable answers, records vibe check, recommendation and outreach independently, then starts the configured trial after creator acceptance.
- Verified evidence creates brand onboarding exactly once; completed onboarding connects to the existing creator membership model. Details, states, recovery and provenance are in `RECRUITMENT_FLOW_CONTRACT.md`.

## F12/F13 — CashDrive inventory and enquiries

- Inventory is a separate CashDrive administration area for vehicle identity, availability, price, media, publication, and change history.
- Creators submit enquiries using referrer, buyer name/contact, requested vehicle, inquiry date, source, budget, urgency, lead status, and notes.
- CashDrive management filters and updates structured enquiry records; every record remains CashDrive-scoped.

## F15/F16 — Sheets and Apify automation

- Accepted self-reported views collate to each business's designated Sheet/Drive location.
- Across every business, Apify runs three cumulative windows: 1–14, 1–21, and 1–month-end.
- NorthQuest, CashDrive, and Aura each supply a separate server-only Apify credential/account. Central scheduling never means shared credentials.
- Jobs use business-scoped configuration, idempotency, leases, bounded retries, reconciliation, cost guards, credential rotation, and one-business failure isolation.

## Regression impact map

Retest Google sign-in and callback, invitation redemption, chooser, switcher, mandatory spotlight walkthrough, creator and trial dashboards, Today/Yesterday/noon boundaries, Aura Monday–Sunday boundaries, NorthQuest/CashDrive calendar blocks, join dates, midnight gate, period-specific reports, confirmed persistence, management review/approval, onboarding, deactivation, applicants, private uploads, CashDrive enquiry/inventory, RLS helpers and policies, Sheets, Apify schedules, notifications, payments/bonuses, offline/retry, phone keyboard behavior, and 1,000+ creator administration. There is no creator-data migration path in the September 1 launch.
