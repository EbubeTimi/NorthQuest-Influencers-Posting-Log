# Smithstem — Project Bible

## Current prototype authority — 28 August 2026

Recruitment revision 5 supersedes the Settings/template location below: Settings is application form + brands only. The person's assigned-business Pipeline owns the WhatsApp draft and collapsed business-default editor; type is derived from outreach vs started trial. No Settings redirect, cross-business selector or live send. Named Pipelines now allow name search with business-wide stage counts and preserve filters on back. Required introduction-video upload is visible in the editor; its in-tab file preview appears on the applicant review record. Private permanent media storage is planned, not connected. Compact accessible icon back controls and borderless secondary actions replace the large repeated controls. Evidence: `../evidence/flows/Recruitment_Prototype/REVISION_5.md`. Keyboard activation and real video decoding/upload remain unverified; no launch-readiness claim.

Recruitment revision 4 refines Settings into separate option fields and Outreach/Invitation tabs. Pipeline starts at a business index; opening a business removes the business switcher and scopes its list. Automatic trial dates use the preview clock in Africa/Lagos, and invitations include the assigned business plus recipient-bound token. Trial length is NOT confirmed: the prior seven-elapsed-day example remains review-only. Evidence/bonus date checks now consistently use Lagos at midnight. See `../evidence/flows/Recruitment_Prototype/REVISION_4.md`.

Recruitment revision 3 supersedes the combined inbox: Applicants does first-stage video review and distributes accepted people to one business's Pipeline. Rejected records are separate. Later work never duplicates the identity or reassigns the trial brand. Uyi is the correct admin spelling. Business-specific WhatsApp templates are editable, versioned mock settings. UGC No ends before later questions/video; full applications require every shown question except the final message. Drafts recover within the open prototype tab only; durable autosave remains future implementation. Evidence: `../evidence/flows/Recruitment_Prototype/REVISION_3.md`.

The historical implementation description below is not a current product contract or security proof. Current decisions live in `../audit/tdt-unified-creator-ops/00_Flow_Contracts.md` and `RECRUITMENT_FLOW_CONTRACT.md`. Trial revision 7 visuals were approved; active creator and GrowthCooks recruitment prototypes are separate unapproved additions. Reuse the approved phone-first system-font/green/neutral style. Production UI and deployment remain gated.

GrowthCooks Marketing Agency is the operational agency workspace; TDT is the parent organization, without an asserted legal subsidiary classification. Canonical brand: Aura. Personal Google login and assigned memberships replace older OTP/public-join assumptions. The recruitment funnel uses immutable applications, separate screening/outreach, one trial per person, one-video link + ≥10,000 screenshot, authorized management verification, retained evidence and an idempotent brand onboarding case. Onboarding completion is not a statement that contracts, bank or employment work is complete.

September 1, 2026 is the target. A legacy recruitment import is only planned; no production or source-sheet mutation is authorized. Older source code and the claims below must be checked against current contracts before reuse.

This document exists so that anyone — a new engineer, a business partner, Smith
herself six months from now — can read it start to finish and understand the
whole system: what it is, why it's built the way it is, and where the real
risk and complexity live. It is not a promotional document. Where something is
unfinished or fragile, it says so.

Live: https://smithstem.vercel.app
Code: this repository, `smithstem/` directory
Owner: Smith Onyekwereh

---

## 1. What this is

Smithstem is the operations platform Smith runs her creator businesses on.
She manages UGC (user-generated content) creators — people who post TikTok
and Instagram videos promoting her businesses — across three brands:

- **NorthQuest Finance** — the first business on the platform, fully active.
- **CashDrive** — a second, active tenant with a different pay structure.
- **Aura by Antroph** — a third business, joining the platform; flat pay, no
  performance bonuses, same analytics tracking as the others.

Before Smithstem, this ran on spreadsheets and manually screenshotting each
creator's TikTok/Instagram profile to check their view counts. Smithstem
replaces that: creators log their own videos, submit their own bonus claims
with evidence, and see their own pay. Smith approves claims and pays out —
the system does the arithmetic, not her.

**The one rule that governs every decision in this codebase: the money has to
be right, and it can never quietly become wrong.** Several real bugs found
this way are documented in section 6.

## 2. Who uses it, and how

Two roles exist: **admin** (Smith, and anyone she promotes) and **creator**.

A creator's day-to-day: open the app, log today's video (a link, a date, a
post number), see what they've earned so far this month, submit a bonus claim
with proof once a video crosses a view threshold, and see their payment
history once Smith has actually paid them — never a running total she hasn't
confirmed yet, since that was a real source of confusion before the current
design (see section 6).

Smith's day-to-day: open the admin dashboard, approve or reject pending bonus
claims, review creators, and manage the monthly payments register per
business. Multiple businesses live under one admin login — she switches
between them, she doesn't sign in separately for each.

## 3. How someone gets in — the identity model

There is no password for ordinary use. Signing in is: enter your email, get
an 8-digit code by email, enter the code. That single mechanism serves both
new signups and returning users — `supabase.auth.signInWithOtp` with
`shouldCreateUser: true`.

Creators can also join **without ever giving an email**, over WhatsApp, via an
invite link an admin generates. That link runs a real signup under the hood
(`auth.signUp()` with a random password the creator never sees), which is why
it depends on Supabase's "Confirm email" setting being off for password
sign-ups — a dashboard setting, not something this code controls (tracked as
an open item, see section 8).

Once signed in, the browser stays signed in — the entry screen checks for an
existing session before ever showing the email form, so nobody re-enters a
code every time they open the app. Every authenticated screen shows the
signed-in email under the Smithstem name, specifically so it's never
ambiguous which account is active on a shared or reused browser.

**Role is never decided by the client.** After sign-in, the app reads
`profiles.role` from the database and routes to `/admin` or `/dashboard`
accordingly. A creator cannot make themselves an admin by editing a request —
see section 5.

## 4. Multi-business, on one account

A real operational fact drove this: some people work for both NorthQuest and
CashDrive at once. `profiles.business_id` means "which business is active
right now," not "which business this person belongs to forever." A separate
`business_memberships` table is the actual record of which businesses a
profile can access; switching business is just moving that pointer, guarded
so it can only move into a business the profile actually has a membership
row for. Every other table (`creators`, `bonus_claims`, `payments`, …) is
scoped by `business_id`, so switching business is switching *all* the data
underneath, the same way changing Slack workspaces is.

The header's business switcher is also how a new business gets created —
admin-only, and it's the same control used to open any business's dashboard.

## 5. Security model

There is no separate backend server. The Next.js app talks to Supabase
directly from the browser using a public anonymous key — by design, not by
accident. **Row Level Security (RLS) is the entire access boundary.** Every
table has policies stating exactly who can read or write which rows, enforced
by Postgres itself, not by application code that could be bypassed.

The one thing RLS cannot express is *column* immutability — a policy can gate
which rows you touch, not which columns of a row you're allowed to change
within an otherwise-permitted update. That gap was a real, since-closed
vulnerability: any signed-in creator could send `update profiles set
role='admin' where id = auth.uid()` and the row-level policy alone wouldn't
stop it, because it was their own row. A `BEFORE UPDATE` trigger
(`guard_profile_privileges`) now rejects any change to `role` or
`business_id` arriving on a normal user's token — only a backend/SQL-editor
session (where `auth.uid()` is null) can promote someone, which is always
Smith acting deliberately, never a client request.

Contracts and bonus-evidence screenshots live in **private** storage buckets.
Nothing is ever served from a public URL — every view opens through a
short-lived signed URL generated at the moment someone actually clicks to
view it.

## 6. Money — the part that has to be exactly right

Three real bugs, found and fixed this year, all changed how a creator's pay
is calculated:

- **The per-post rate was a flat divide-by-62.** 62 is two posts a day across
  31 days. In a 30-day month that divisor is wrong, and every video was
  shorted by design in four months out of twelve. The rate now divides by the
  actual number of posting days in the specific month being paid. (Caught
  before any real payment existed — `payments` was empty at the time — so
  nobody was actually underpaid, but the bug was live and would have been.)
- **Dates defaulted through the browser's UTC clock**, not Lagos time. A
  creator posting at 12:30am WAT — which is 11:30pm the day before in UTC —
  had their video silently filed under the wrong day, which can move it into
  the wrong month's pay entirely. Every date in the app now comes from
  `Africa/Lagos`, including the log-form's default date and the 11:30pm
  posting cutoff rule.
- **Bonus tiers didn't carry an effective date.** Changing the bonus
  structure used to retroactively reprice every past claim the next time
  anything touched that month. Tiers now carry `effective_from`, and a claim
  is always valued against whichever tier set was in force on the day the
  claim's threshold was actually reached — so a past bonus never silently
  changes value because the schedule changed later.

`lib/domain.js` is where this logic lives: `rate()`, `postsExpectedIn()`,
`postingDay()`, `tiersOn()`, `bonusForViews()`. Anyone touching pay math
should start there, and should assume any change to it needs to be checked
against a 28/29/30/31-day month before it ships.

## 7. What's live vs. what's still a prototype

Everything described above is shipped and in production. Two things are
deliberately **not** built yet, on purpose:

- **Weekly self-reported views** (NorthQuest only) — a prototype exists;
  not approved for production.
- **Trial-to-active creator lifecycle** — trial creators log videos and earn
  nothing until they cross 10,000 views and Smith approves the move to the
  paid roster, at which point real onboarding (bank details, contract)
  triggers for the first time. Prototyped, awaiting sign-off. The open
  question flagged and not yet resolved: trial creators currently post real
  content before signing any agreement, since onboarding only happens at
  promotion — worth a short trial-only acknowledgment even before the real
  contract.
- **Standing, reusable per-business onboarding links** — one link per
  business that never expires, shown together on the admin page, replacing
  the current per-person invite as the primary way people join. Prototyped,
  awaiting sign-off. Pairs with a broader move away from hardcoding each
  business's rules (Aura's flat ₦150,000/month with no performance bonus is
  the first business that doesn't fit the pattern already written in code).

This project follows a rule: **a major UI/UX change gets a throwaway,
interactive prototype and explicit approval before it's built into
production.** That's why the two items above exist as prototypes rather than
code — nothing about them ships until Smith has clicked through it and said
yes.

## 8. Known gaps, honestly

- **A lost phone is not actually a gap.** Every creator's account — invited
  by WhatsApp or signed up directly — is tied to a real email they provide
  during signup (`join/[token]/page.js` asks for it explicitly: "Use one you
  actually check — this is how you'd sign in on another phone later"). Plain
  email sign-in already works from any device with no separate mechanism
  needed. The `creator_invites.creator_id` "recovery link" column exists in
  the schema but the redemption screen deliberately marks that path
  unsupported and points back at ordinary sign-in — confirmed correct rather
  than assumed, and the dead code is worth removing rather than finishing.
- **The "Confirm email" setting for password sign-ups** needs to be off in
  the Supabase dashboard for WhatsApp invite links to work — this is a
  dashboard toggle, not something in this repository, and its current state
  has not been independently reconfirmed recently.
- **No app-level security audit log yet** — who approved what, when, is
  visible per-row in the tables involved, but there's no dedicated log.
- **Upload type/size limits on the bonus-evidence and signature buckets**
  have not been explicitly verified.

## 9. Running and deploying it

See `README.md` in this directory for local setup, the keep-alive mechanism
(Supabase's free tier pauses an inactive project — two independent defenses
exist against that), and deploy instructions. In short: Next.js 14 (App
Router), Tailwind, deployed to Vercel from this git repository, backed by a
Supabase project (Postgres + Auth + Storage) in `eu-west-1`.

## 10. Design language

"Naira Green" — deep green (`#0B6B4F`) and gold (`#C99A27`), IBM Plex Sans for
body text and IBM Plex Serif for headings, a defined six-step type scale, and
tabular numerals wherever digits are read as figures (payment columns, view
counts). Full tokens in `tailwind.config.js`. The intent, stated plainly: this
should read as a considered financial product, not a generic dashboard
template — no stock icon packs, no decorative gradients, no interface
element that doesn't correspond to something real a creator or admin needs to
do.
