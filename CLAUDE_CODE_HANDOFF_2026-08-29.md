# Claude Code continuation handoff

Repository state reconstructed from 29 August 2026 evidence; transfer package verified 3 September 2026, Africa/Lagos. The September 1 target has passed and must not be treated as proof of readiness. The operator is a non-engineer. Explain everything plainly, one step at a time, and notify them immediately of every failed command, check, build, test, connection, or migration.

## The quickest way to continue

1. Open `C:\Users\smith\Downloads\NorthQuest-Influencers-Posting-Log` in a terminal.
2. Run `git switch codex/unified-tdt-creator-ops-prototype` and `git status --short --branch`.
3. Start Claude Code with `claude`.
4. Review and trust this repository's `CLAUDE.md`, `.claude/skills/`, and `.mcp.json` when prompted.
5. Run `/mcp`, select `typeui`, authenticate, and confirm it is connected.
6. Paste the starter prompt at the end of this document.

The repository now carries the Flow-by-Flow, Flow Prototype, and TypeUI fundamentals skills under `.claude/skills/`. The TypeUI remote server is declared in `.mcp.json`; it contains no secret. If it does not appear, run the official fallback command from the repository root:

```powershell
claude mcp add --transport http typeui https://mcp.typeui.sh/mcp
```

Then enter Claude Code, run `/mcp`, select `typeui`, and authenticate in the browser. Do not put TypeUI tokens in Git.

### Fresh transfer verification — 3 September 2026

- PASS: `.mcp.json` parses as valid JSON.
- PASS: Claude project skills `flow-by-flow`, `flow-prototype`, and `typeui-fundamentals` are present.
- PASS: Flow-by-Flow and Flow Prototype both report version `2.0.1`.
- PASS: onboarding prototype checks, 9/9.
- PASS: active-creator prototype checks, 26/26.
- PASS: shared trial prototype contract checks, 33/33.
- PASS: Supabase hardening static checks, 8/8.
- PASS: isolated PostgreSQL migration runtime check, 1/1.
- PASS: Next.js 16.3.3 production build and TypeScript/static page generation.
- UNVERIFIED: TypeUI OAuth/tool connection inside Claude Code; the user must approve the project MCP and authenticate once.
- UNVERIFIED: live Supabase RLS, real Vercel variables, production integrations, deployment, and launch readiness.

## Repository and delivery state

- GitHub: `EbubeTimi/NorthQuest-Influencers-Posting-Log`
- Working repository: `C:\Users\smith\Downloads\NorthQuest-Influencers-Posting-Log`
- Current branch: `codex/unified-tdt-creator-ops-prototype`
- Remote branch: `origin/codex/unified-tdt-creator-ops-prototype`
- Draft pull request: https://github.com/EbubeTimi/NorthQuest-Influencers-Posting-Log/pull/1
- Base branch: `main`; never write directly to it.
- Latest verified handoff commit before this package: `75757d8 Map and prototype secure brand onboarding`
- Production deployment: not authorized and not performed.
- Production data mutation: not authorized and not performed.
- Source Google Form/Sheets mutation: not authorized and not performed.

Recent branch commits:

```text
75757d8 Map and prototype secure brand onboarding
5989bc7 Fail closed when deployment secrets are absent
ebbe82f Record hosted staging provider gates
f27103c Prove security migration in isolated database
906117c Harden Supabase queues and privileged routines
f4ecd46 Record private Drive destination and upload integration gate
3d3a516 Record recruitment acceptance and verify onboarding review
463bb46 Simplify recruitment outcomes and applicant experience
```

The `gh` CLI was not installed at handoff, so current PR metadata/checks could not be refreshed from the terminal. The URL and branch are known; verify the PR in GitHub before merging anything.

## Preserve the current working tree

The branch contains unfinished user work. Do not reset, clean, overwrite, or stage it accidentally.

Modified before this continuation package:

```text
audit/tdt-unified-creator-ops/RECRUITMENT_STORAGE_ASSESSMENT.md
audit/tdt-unified-creator-ops/TDT_RULE_CONFLICTS.md
evidence/flows/TDT_Prototype/revision7-phone-approved.png
evidence/flows/TDT_Prototype/revision7-phone-dashboard.png
evidence/flows/TDT_Prototype/revision7-phone-expired.png
evidence/flows/TDT_Prototype/revision7-phone-management.png
evidence/flows/TDT_Prototype/revision7-phone-pending.png
evidence/flows/TDT_Prototype/revision7-phone-submission.png
evidence/flows/TDT_Prototype/revision7-phone-walkthrough-views.png
evidence/flows/TDT_Prototype/revision7-phone-weekly-views.png
```

Untracked before this continuation package:

```text
evidence/flows/Recruitment_Prototype/STORAGE_PUBLIC_PROBE_2026-08-28.json
evidence/flows/TDT_Prototype/revision7-runtime-proof.json
prototypes/ACTIVE_CREATOR_BRIEF.md
prototypes/active-creator-dashboard.html
tests/active-prototype.test.js
tests/recruitment-revision2-runtime.test.js
tests/storage-readonly-probe.js
```

Inspect before staging. Stage files by exact path, never `git add .`.

## Authoritative product decisions

These rules override older code, repository history, screenshots, and prose:

- TDT is the parent. The operational recruitment workspace is GrowthCooks Marketing Agency. Do not assert an unconfirmed legal subsidiary relationship.
- The current brand name is Aura, not Ora.
- One person has one personal-Google login and separate NorthQuest, CashDrive, and Aura memberships.
- A creator sees only assigned businesses. Active multi-business creators choose/switch after sign-in. A trial creator has one trial business and no chooser.
- One person may have only one ongoing trial. Passing the trial is TDT-wide; later brand assignments do not repeat trial, but still require brand-specific onboarding.
- Trial accounts are permanent but limited until deactivated by management.
- A qualifying trial result is one already-recorded content link/platform, a self-reported count of at least 10,000, and a screenshot of that exact post. Different videos are never added together.
- Qualification never self-approves. Management is notified, checks the real post and screenshot, then approves onboarding or keeps the creator in trial.
- Weekly reporting is separate from the 10,000-view submission and cannot be bypassed by it.
- Trial creators can submit qualifying evidence at any time and can claim bonuses where available. NorthQuest and CashDrive bonuses start at 100,000 views, but current payout schedules are not confirmed. Aura has no bonus.
- Exactly two video slots per day, each supporting TikTok and Instagram. No Video 3. No Facebook tracking or bonus.
- Today is locked. Yesterday appears only if missed and only until 12:00 PM the next day. Arbitrary dates are not allowed.
- Creators share the business reporting period. Aura is Monday–Sunday. NorthQuest/CashDrive use configured calendar blocks. Joining mid-period creates obligations only for posts logged after joining.
- At midnight after a period ends, new video logging is gated until all exact per-video/per-platform views due for that completed period are submitted. Unused slots require nothing.
- Every success message waits for durable backend confirmation. Retries are idempotent.
- September 1, 2026 is the launch target. Start creator data fresh; do not migrate old creator rows, counts, links, passwords, or reports. A separate planned recruitment-application import is not authorized until mapped, rehearsed, and approved.
- Weekly accepted self-reports collate to designated Google Sheets/Drive destinations.
- Apify runs across all businesses only at cumulative 1–14, 1–21, and 1–month-end. No week-one scrape.
- CashDrive additionally needs Inventory and Enquiries.
- The system must be tenant-isolated, auditable, secure, and scalable beyond 1,000 creators.
- Major UI/UX must be prototyped and approved before production UI implementation. Production deployment always needs separate explicit approval.

## What is complete or accepted so far

### Audit and shared planning

The repository, existing production code, prototypes, legacy conflicts, Supabase surface, and source recruitment materials were audited. Durable truth is in:

- `audit/tdt-unified-creator-ops/00_Flow_Map.md`
- `audit/tdt-unified-creator-ops/00_Flow_Contracts.md`
- `audit/tdt-unified-creator-ops/TDT_RULE_CONFLICTS.md`
- `audit/tdt-unified-creator-ops/RECRUITMENT_FLOW_CONTRACT.md`

Build in the dependency order in the flow map. Do not create disconnected apps or restart the architecture.

### Recruitment prototype

- Prototype: `prototypes/recruitment.html`
- Status: accepted “for now”; final TypeUI/visual polish deferred until complete flows exist.
- Covered: public application, required questions except final optional question, introduction-video preview, vibe check, business distribution, brand pipeline, WhatsApp outreach, outcome/decline branching, trial start, evidence, onboarding handoff, and history.
- Recruitment is a distributor: accept/reject in Applicants, then continue in the chosen business pipeline.
- Smith, Daniel, Ella, and Uyi are agency administrators. Spell `Uyi` exactly.
- Rejection reasons appear only for team rejection. Decline reasons appear only when a creator declines. Contacted, cannot be reached, unresponsive, declined, and trial started remain distinct outcomes.
- Exact WhatsApp link behavior, source video storage, and persistent backend are not yet implemented.
- Do not edit the source Google Form or Sheets.

### Trial prototype

- Prototype: `prototypes/unified-tdt-creator-ops.html`
- Status: revision 7 approved to move on; this is not production approval.
- Covered: invitation/sign-in states, trial dashboard, Today/eligible Yesterday, weekly gate, 10,000-view combined link/count/screenshot submission, management review, onboarding ready, deactivation, errors, expiry, and walkthrough.
- Prior result: 93 prototype checks passed. Re-run rather than trusting the number.
- One historical gap remained: keyboard-only completion was not independently proven at the time of approval.

### Brand onboarding prototype

- Brief: `prototypes/ONBOARDING_BRIEF.md`
- Prototype: `prototypes/onboarding.html`
- Test: `tests/onboarding-prototype.test.js`
- Status: implemented and phone-tested, but not yet explicitly approved by the user.
- Prior automated result: 9/9 contract checks passed.
- Prior phone runtime result: 390×844 happy path, first-save failure/retry, manager correction, and completion passed. A reviewer-menu overlay defect was found and fixed.
- Security boundary: never collect brand email/social passwords; public profile links only; complete signed PDF instead of a signature image; management must complete before active membership.

### Active creator prototype

- Brief: `prototypes/ACTIVE_CREATOR_BRIEF.md`
- Draft: `prototypes/active-creator-dashboard.html`
- Test: `tests/active-prototype.test.js`
- Status: preserved unfinished draft, not approved. Do not recreate it.
- Prior focused result: 26 checks passed, but complete browser/phone/accessibility review remains unfinished. Re-run rather than trusting the number.

## Security and configuration status

### Prepared and locally proven

Migration:

`smithstem/supabase/migrations/20260829010000_harden_public_scrape_jobs_and_routines.sql`

It enables RLS for the public scrape queues and `app_settings`, removes unsafe public/anonymous/authenticated grants, narrows privileged RPC/trigger access, hardens function search paths, makes ping server-only, and retires obsolete migration roster RPCs.

Prior proof:

- Static security checks passed.
- An isolated PGlite runtime migration check passed.
- The Next.js build passed.
- Deployment configuration was changed to fail closed when required environment variables are missing.

Relevant files:

- `smithstem/lib/supabaseClient.js`
- `smithstem/app/api/keepalive/route.js`
- `smithstem/.env.example`
- `smithstem/README.md`
- `tests/supabase-security-hardening.test.js`
- `tests/supabase-security-migration-runtime.test.mjs`

### Still live-blocked

- Supabase project: `zuuhlowjqniadtcpdypv`, project-scoped read-only MCP.
- Live Security Advisor showed RLS disabled on `public._nq_scrape_jobs`.
- The live migration has **not** been applied.
- The free Supabase plan had no branches/backups; preview branches required a paid upgrade. No upgrade or charge was authorized.
- This machine did not have `supabase`, `docker`, or `pg_dump` available at the last check.
- Runbook: `audit/tdt-unified-creator-ops/RLS_LIVE_CHANGE_RUNBOOK.md`.
- The user manually checked the Vercel `smithstem` project and found no environment variables.

Required Vercel variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
CRON_SECRET
```

Legacy names remain temporarily supported in code: `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`. Prefer the current names above. Never expose values in chat, screenshots, logs, or commits.

## Storage status

Google Drive was chosen conceptually for temporary private applicant introduction videos because they are normally viewed once. A private owner-only destination was created and checked earlier, but the website upload, server credential handling, reviewer playback, signed/authorized access, retention, deletion, malware-safe handling, and audit trail are not implemented end to end.

Do not claim storage is complete. Do not store the folder ID or credentials in this document or Git. Do not delete uploaded evidence until the operator approves a retention policy.

## Known dangerous legacy conflicts

- Legacy onboarding collects Gmail/Instagram/TikTok passwords and copies them to Drive. Retire this behavior; never reproduce it.
- Legacy onboarding retains only a signature image, not the complete signed contract.
- Legacy weekly collation excludes some required records and uses outdated windows.
- Legacy Apify is monthly-only.
- Legacy creator gate uses join-relative timing, a late-evening rollover, Facebook, or Aura-specific assumptions that conflict with the current contracts.
- An older automatic self-report onboarding rule conflicts with the current management-verification requirement. Management verification is authoritative.
- Live public scrape/job tables have an RLS warning until the reviewed migration is safely applied and proven.

Record any newly discovered conflict in `TDT_RULE_CONFLICTS.md` before planning or implementing around it.

## Verification commands

Run commands from the repository root unless noted. Inspect scripts before executing them.

```powershell
# Repository truth
git status --short --branch
git log -8 --oneline --decorate

# Prototype contracts
node tests/onboarding-prototype.test.js
node tests/active-prototype.test.js
node tests/prototype-contract.test.js

# Security and build
Set-Location smithstem
npm run test:security
npm run build
```

Some runtime prototype tests expect a local server/browser. Start the server from the prototype folder:

```powershell
Set-Location prototypes
python -m http.server 4173
```

Then use the relevant `*-runtime.test.js` file only after inspecting its expected URL, server, and dependencies. A passing static test is not runtime proof. A mocked prototype is not production authorization proof.

## What to do next

Follow `NEXT_STEPS_2026-08-29.md` from top to bottom. Immediate order:

1. Finish Vercel variables and the Supabase RLS live-safety gate.
2. Show and obtain approval for the already-built onboarding prototype.
3. Finish and approve the preserved active-creator prototype.
4. Prototype the unified management dashboard.
5. Prototype CashDrive Enquiries.
6. Prototype CashDrive Inventory.
7. Implement approved flows through real auth/storage/database boundaries.
8. Build Sheets/Apify operations.
9. Run end-to-end staging, security, accessibility, backup/restore, and scale rehearsal.
10. Run the final TypeUI phone-first UI/UX pass, obtain explicit production-UI approval, then request separate deployment approval.

## Starter prompt to paste into Claude Code

```text
Continue the existing unified TDT creator-operations project from the repository state; do not restart it.

First read CLAUDE.md, CLAUDE_CODE_HANDOFF_2026-08-29.md, NEXT_STEPS_2026-08-29.md, audit/tdt-unified-creator-ops/00_Flow_Map.md, audit/tdt-unified-creator-ops/00_Flow_Contracts.md, audit/tdt-unified-creator-ops/TDT_RULE_CONFLICTS.md, and the contract/brief for the next flow. Inspect git status, the current branch, recent commits, tests, migrations, and runtime evidence before changing anything.

Use /flow-by-flow for every coding task, /flow-prototype for major UI/UX work, and the TypeUI MCP for UI/UX. If TypeUI is not connected, stop UI styling, run /mcp, and use /typeui-fundamentals only as the documented fallback. Continue one dependency-ordered flow at a time. Preserve every pre-existing dirty and untracked file, stage only exact files, and use the existing draft pull request. Never write to main.

The operator is a non-engineer. Explain the current step plainly, report every failure immediately with its effect, fix safe failures, and verify again before moving on. Do not deploy, mutate production, apply live Supabase changes, incur paid costs, edit source Google Forms/Sheets, import old creator data, or collect credentials without explicit authority. Ask for approval immediately before the exact live RLS migration and before any production UI/deployment.

Start by reconstructing the current checklist state. If the Vercel variables and live RLS gate are still incomplete, continue the safe preparation and verification in NEXT_STEPS step 1. Otherwise move to the onboarding prototype approval, then the preserved active-creator prototype. Do not recreate completed prototypes.
```

## Honest final status

This package makes continuation portable and reduces context loss. It does not make the platform launch-ready. The main launch blockers are live RLS, missing Vercel variables, unapproved/unfinished flows, incomplete private storage integration, incomplete management/CashDrive/automation work, and missing end-to-end release proof.
