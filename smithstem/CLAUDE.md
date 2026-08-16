# Working on Smithstem

Read `README.md` first for what this is and how it runs. This file is standing
rules for whoever (or whichever Claude session) touches this code next.

## UI/UX must look and feel real, not templated

Smith flagged this directly: the app must read as a considered product, not a
generic AI-generated shell. Before shipping any screen, check it against this —
skip items that plainly do not apply to an internal ops tool (pricing tiers,
testimonials), but do not skip the ones about polish and finish:

harsh gradients · lucide icons used indiscriminately · pure white backgrounds ·
rainbow/neon coloring · drop shadows on everything · three feature cards in a
row · emojis in product copy · liquid glass / frosted panels · em dashes in UI
copy · Inter/Geist/Space Grotesk as the default font · a colored left stripe on
every card · fake testimonials · bento grids · a fake terminal window ·
"it's not X, it's Y" copywriting · checkmark bullet lists · basic pastel or
purple-and-black coloring · radial orbs / dot-grid backgrounds · sparkle icons ·
animated arrows and hover animations used decoratively · **no skeleton or
loading state, or a bare/blank one** · missing TOS or privacy policy where one
is actually owed.

Smithstem already avoids most of this by construction — Naira Green (deep
green + gold), IBM Plex Sans/Serif, a six-step type scale, tabular numerals,
no stock icon library. The one this project was actually caught on: **every
screen that waits on a network call before it has anything to show must use
`components/LoadingScreen.js` (or its inline small-spinner variant, see
`app/join/[token]/page.js`) — never a blank page and never bare text with no
visual weight.** Checked and fixed across `/`, `/onboarding`, `/admin`,
`/dashboard`, `/join/[token]` — apply the same component to any new screen
that has an initial loading phase.

## Security checklist to run against real features, not templates

Same source, applied with judgment — this is an internal tool with Supabase
RLS as the access boundary, not a public SaaS with its own auth stack, so a
number of these are already satisfied structurally or don't apply. Check each
new feature against the list; don't build any of these reactively after
something breaks.

- HSTS, secure cookie flags, locked-down CORS — mostly Vercel/Supabase
  platform defaults; worth a one-time confirmation, not per-feature.
- CSRF tokens, session reset on password change — low relevance today: there
  is no ambient-cookie session against a same-origin API; the Supabase client
  attaches a bearer token explicitly. Re-evaluate if that ever changes.
- Expire reset/invite links — **already done**: invites expire in 3 days,
  recovery links in 15 minutes.
- Prevent user enumeration — **already done**: `signInWithOtp` always
  succeeds regardless of whether the address exists.
- Set prices/pay/bonus amounts server-side — **already done**: `bonus_tiers`,
  `bonus_amount_for()`, and the review/approval RPCs are the only source of
  truth; nothing trusts a client-submitted amount.
- Restrict database permissions — **already done**: RLS everywhere, the anon
  key is meant to be public, `guard_profile_privileges` blocks client-side
  role/business_id escalation.
- Whitelist upload types, limit request size — check on every new upload
  surface (bonus screenshots, signatures, and whatever Apify or future
  features add). Not yet formally verified on the buckets in use.
- Sanitize before storing / rendering — React escapes by default; the rule is
  simply: never introduce `dangerouslySetInnerHTML` for anything a creator or
  admin typed.
- Rate limit sensitive actions, lock accounts after failed attempts, log
  security events — partially covered by Supabase's own OTP throttling; no
  app-level audit log exists yet. Worth building once there's a second admin.
- Payment webhooks, AI usage caps, prompt-injection defenses — not applicable
  yet; revisit if a payment provider or an AI-generated feature is added.

A full pass against both lists across every existing screen is tracked as an
open task — this file is the reference to check against, not a promise that
every item has already been verified.
