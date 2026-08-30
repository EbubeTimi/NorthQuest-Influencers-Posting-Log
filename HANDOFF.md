# Handoff — state of play

Last updated: 30 August 2026 (second update, end of session).

Update this file at the end of any session that changes the answers below.
It is the only durable memory across sessions; chat transcripts are not.

---

## What this is

Smithstem is the operations platform Smith runs his creator businesses on.

- **TDT Technologies** — parent organisation. Not a tenant boundary in the
  database; nothing enforces it yet.
- **GrowthCooks Marketing Agency** — the operational workspace. Applications
  are agency-scoped, then assigned to one brand.
- **Three brands**: NorthQuest Finance, CashDrive, Aura by Antroph.
- **Creators** hold memberships. One login can belong to several brands;
  switching brand switches every scoped table underneath it.

Live: https://smithstem.vercel.app · Supabase project `zuuhlowjqniadtcpdypv`

Target launch: **1 September 2026**.

---

## Two branches, and they disagree

Both are alive. Nothing should be built on top of either until these are
settled, or the next piece of work will contradict one side.

| | `main` (deployed) | `codex/unified-tdt-creator-ops-prototype` |
|---|---|---|
| Sign-in | email one-time code | continue with Google, matched to the invitation |
| Apify cadence | one scrape at month end | three cumulative windows: 1–14, 1–21, 1–month end |
| Existing creators | 51 migration invites generated | no migration at all; fresh start |
| Public branding | no brand shown | "GrowthCooks Marketing Agency / Creator application" |

The Codex branch is the **newer and more thorough** thinking. It branched off
current `main`, so it contains everything on `main` plus ~11,500 lines: three
approved prototypes, `smithstem/PROJECT_BIBLE.md`, ten flow-contract documents
under `audit/`, ~20 test files, 147 evidence files including screenshots at
320/390/768/1280, and a security audit.

**Read `audit/tdt-unified-creator-ops/` before proposing architecture.** In
particular `00_Flow_Map.md` (the whole system), `TDT_RULE_CONFLICTS.md`
(every superseded decision, in order), and `SEPTEMBER_1_LAUNCH_CONTRACT.md`.

Smith's stated preference: bring `main` up to the Codex branch, not the
reverse. Not yet executed.

---

## Ground truth in the database

Queried live, not remembered. 58 migrations, all applied and mirrored in git.

- 3 businesses configured. **Trial bar is 10,000 views for all three** — an
  earlier 5,000 for CashDrive was corrected on 30 Aug and is wrong wherever
  it still appears.
- 2 creators, 1 applicant, 2 video logs — all test rows.
- **0 bonus claims, 0 payments.** Nothing has ever travelled the full path
  from applying to being paid. Treat every money path as unproven.
- 51 unused migration invites, now expired or expiring.
- 6 cron jobs registered; only the keep-alive actually runs, because the
  other five call Edge Functions that were never deployed.

---

## Blocked, and why

**Four automations are written, correct, and cannot run**: contract → Drive,
application → Sheet, weekly view collation, monthly Apify scrape. All four
are blocked by the same thing — Edge Function deploys were refused in the
cloud session. One approval clears all four.

Do not apply `20260829010000_harden_public_scrape_jobs_and_routines.sql` from
the Codex branch on its own. It revokes `ping_external` from `authenticated`,
which only works alongside that branch's matching keepalive route change.
Applied alone it lets the free-tier database pause and takes the app down.

---

## Verification standard

Per `references/audit.md` in the flow-by-flow skill: a code diff or a passing
build **does not** turn a flow green. Runtime evidence does.

By that standard, as of this writing:

- **Verified**: schema, RLS policies, RPC grants, cron registration — all
  queried directly against the live database.
- **Unverified**: every screen and every user journey. The cloud sandbox
  could not reach `smithstem.vercel.app`, so nothing was ever driven.
- **Blocked**: the four automations above.

If the environment now allows `smithstem.vercel.app`, driving one real
journey end to end is the highest-value thing available.

---

## Environment and tooling — read this first in a new session

The cloud environment's network allowlist was widened on 30 Aug. Sessions
started after that can reach:

```
smithstem.vercel.app      ebubetimi.github.io
mcp.typeui.sh             api.apify.com
*.frame.claudeusercontent.com   *.frame.staging.claudeusercontent.com
```

Two things follow from that, both learned the hard way:

- **`WebFetch` is still blocked for these hosts; `curl` is not.** WebFetch runs
  its own separate check. To read the live app, use
  `curl -s https://smithstem.vercel.app/<path>` and parse it. Do not conclude
  the site is unreachable because WebFetch refused.
- **TypeUI needs a one-time `/mcp` sign-in** in an interactive session. It is
  configured in `.mcp.json` but will not connect until that happens.

**Check the repo picker before typing.** It must read
`NorthQuest-Influencers-Posting-Log` on branch `main`. A session opened
against a different repository will read that repository's handoff instead —
this happened once already and cost an hour.

---

## First verified live finding

`/apply` was read from production on 30 Aug and matches the real Google Form:
"Creator Application", the ₦1,000,000 headline, five requirements, both yes/no
questions, required video upload, city. Correct.

**But the page renders "Smithstem" at the top.** That is the internal umbrella
name on a public applicant-facing form. Per the Codex branch it should read
GrowthCooks Marketing Agency, or nothing at all. Not yet fixed.

This is the first page ever actually driven rather than inferred from code.
Every other screen in this repo is still unverified. Sweeping them the same
way is the cheapest high-value work available.

---

## Recently closed

- **A real leak.** `list_pending_migration_invites` was granted to `anon`, so
  any unauthenticated caller could read all 51 creators' full names. Found by
  the Codex audit, confirmed live, revoked, pushed. This also disables the
  shared `/join/business/[slug]` page — consistent with the fresh-start
  decision.
- CashDrive trial bar corrected to 10,000.
- `autoUploadSessions` turned on so session history survives a lost machine.
- TypeUI committed as a project MCP server in `.mcp.json`.

---

## Open decisions

1. The four branch disagreements above. **Blocks everything else.**
2. Aura's Monday–Sunday gate is set in the database with no admin toggle.
3. CashDrive inventory and enquiries — never prototyped; the real enquiry
   form has not been supplied yet.
4. A distinct "left the business" date, separate from joined.
5. Scale past 1,000 creators — never tested.
6. Final UI/UX pass — deliberately last, by Smith's own sequencing.

---

## Working with Smith

- He is not a software engineer by trade. Explain in plain terms; never
  assume a menu path or a tool is obvious.
- Voice-to-text. Read for intent. When he corrects something, that correction
  wins over any document, including this one — then update this file.
- He has been burned by lost work and by agents that claim things are done.
  **Never report something as working on the strength of a passing build.**
  Say what was actually verified, and how.
- Tooling split that matters: TypeUI runs locally and produced the approved
  visual work; direct Supabase access is what caught the leak above. Use each
  where it is strong.
