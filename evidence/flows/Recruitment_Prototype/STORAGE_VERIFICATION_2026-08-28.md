# Storage and connection verification — 28 August 2026

## Result

### Latest security remediation result — 29 August 2026

- A read-only live audit found `public._nq_scrape_jobs` exposed with RLS disabled and classified the related table, routine and heartbeat warnings before any change was prepared.
- A branch-only migration now enables RLS and removes app-role table privileges from the three internal scrape queues and `app_settings`, while preserving service-role automation access.
- Sensitive onboarding, trigger, payment, email-rendering and heartbeat routines now have explicit least-privilege grants. The harmless `ping()` routine is changed to security-invoker.
- The scheduled keepalive route now fails closed when `CRON_SECRET` or `SUPABASE_SERVICE_ROLE_KEY` is absent and no longer uses a browser-facing anonymous key for the privileged heartbeat write.
- The obsolete shared migration roster and `/join/business/[slug]` entry point are retired because the approved launch is a fresh start. Individual `/join/[token]` invitations remain.
- Verification passed: security contracts 7/7, trial prototype contracts 33/33, browser-runtime prototype checks 60/60 and the full Next.js production build.
- An independent code review found no remaining blocker or major defect in this patch. It did identify two required pre-production proofs: confirm the two Vercel environment-variable names exist, and replay the migration in an isolated Supabase environment before applying it live.
- No Supabase migration was applied, no production data or permissions were changed, and no deployment was triggered.

### Latest Step 1 result — 28 August, after 22:23 Lagos

- **29 August, post-restart live proof:** Supabase MCP loaded 9 callable tools. Read-only `list_tables` and `list_migrations` calls succeeded against the project-scoped connection, returning the Smithstem schema and migration ledger. Vercel MCP remains available. The three requested connections are now accessible: GitHub and Google were proved earlier, and Vercel plus Supabase are now proved live. This completes the connection-access portion of Step 1 without changing data.
- The live Supabase check found one ERROR-level security issue: `public._nq_scrape_jobs` is in the exposed `public` schema with RLS disabled. It also returned 56 non-error notices: three RLS-enabled tables with no policies, one mutable function search path, numerous SECURITY DEFINER functions callable by anonymous and/or signed-in roles, and leaked-password protection disabled. Many function notices are paired role findings and may include intentionally public entry points; each must be classified against real callers before permissions are revoked. No remediation SQL was executed.
- **29 August follow-up:** the user completed Supabase authorization and the waiting Codex login process exited successfully with `Successfully logged in to MCP server 'supabase'`. A fresh filtered configuration-status check reports Supabase enabled with OAuth, still scoped to project `zuuhlowjqniadtcpdypv`, still carrying `read_only=true`, and still limited to the configured database/docs/debugging/functions feature groups. The already-running task has not dynamically loaded Supabase tools, so an authenticated Supabase read remains pending a full application restart. This is a successful credential renewal, not yet a successful database call.
- The full restart is confirmed: desktop processes started at 22:22 and the backend at 22:22:47. Vercel MCP tools are now exposed, and authenticated `list_teams`, `list_projects` and `get_project` calls succeeded.
- Vercel project `smithstem` is linked to `EbubeTimi/NorthQuest-Influencers-Posting-Log`. Its returned domains include `smithstem.vercel.app`. The latest returned deployment is `READY` with `target: null`; this alone does not prove the current production deployment, its environment variables, or its actual Supabase project. No deployment was triggered.
- Supabase is still unavailable. Fresh read-only startup diagnostics at 21:23:17 UTC / 22:23:17 Lagos explicitly report an OAuth refresh transaction failure for `supabase`, with `refresh_reason="expiry"`. The saved sign-in expired and could not be refreshed. The underlying reason for refresh failure is not yet established.
- Next action is reauthorization of the existing Supabase MCP connection, preserving its project scope and `read_only=true`. Do not uninstall it, create duplicates, extract credentials, or broaden database permissions. Another generic restart is not the next diagnostic step.
- Step 1 remains IN PROGRESS until authenticated Supabase access and the deployment-to-database mapping are verified. No production data, provider configuration, permissions or deployments changed in this follow-up. The older observations below are historical, superseded where noted here.

### Step 1 follow-up — 28 August, 21:48 Lagos

**After the user's reopen attempt (28 August, after 22:18 Lagos):** fresh callable-tool discovery still returned no Supabase or Vercel tools. The available desktop diagnostic files were older or empty and did not establish a current provider-authentication failure. Read-only Windows process inspection showed the installed app as `ChatGPT.exe` in the Codex package, with several processes still running from 00:26, 15:24 and 15:25; backend processes also predated this reopen attempt. This suggests closing the window did not fully terminate the app, but does not prove the cause of missing tools. Next action is a user-controlled full quit/relaunch, not another configuration change, duplicate server, permission expansion or credential extraction. No processes were stopped by the agent. Step 1 remains unverified/in progress.

- Fresh Google Drive profile call succeeded for the expected owner account. No Drive writes in this follow-up.
- Read-only inspection of saved connection metadata found both `supabase` and `vercel`. A narrowly filtered `codex mcp list --json` reports each enabled with `auth_status: o_auth`; this is local configuration/auth-status evidence, not a successful provider API call.
- Supabase endpoint is project-scoped to `zuuhlowjqniadtcpdypv` with `read_only=true`, matching the repository's fallback project. Vercel's saved endpoint is `https://mcp.vercel.com/`. Neither service's callable tools are exposed to the current task; resource/template discovery did not expose them either. No explicit tool allow/deny list was found in those two server sections.
- The Supabase browser fallback settled on its sign-in page, so the initial loading placeholders are not project evidence. No credentials were entered. An alternate Chrome connection was unavailable.
- Vercel browser navigation timed out, then a later read was explicitly denied by browser URL policy. No attempt to bypass this restriction was made. Live Vercel project/deployment settings remain unverified.
- Repository documents identify `https://smithstem.vercel.app`, but the deployed environment's actual Supabase URL is still not confirmed. Do not confuse the local prototype or repository fallback with deployment proof.
- Step 1 remains IN PROGRESS. Next user action: inspect Settings → MCP servers and share the displayed connection statuses; restore the existing connections rather than creating duplicates. Official configuration/status guidance: https://learn.chatgpt.com/docs/extend/mcp?surface=cli . No server configuration, production records, permissions, keys or deployments changed.

**Not end-to-end ready.** The private Drive destination works through the connected Drive tool. The website's introduction-video upload, applicant attachment and authorized reviewer playback have not been connected and proved against that destination. Existing Claude work is present, but is not equivalent to the newly approved flow.

Inspected baseline: `codex/unified-tdt-creator-ops-prototype`, commit `f4ecd46`, existing draft PR #1. This pass changes no production application code, configuration, memberships, Forms or Sheets. It does not approve production implementation or deployment.

## Verified now

| Check | Result | What this proves / does not prove |
| --- | --- | --- |
| Full Next.js application build | PASS | `npm run build` exits 0; Next.js 16.3.3 compilation and page generation complete. Not a live integration test; Deno functions and production settings are not verified by this build. |
| Recruitment contract checks | PASS, 24/24 | Local flow guards and transitions only. |
| Trial prototype contract checks | PASS, 33/33 | Local behavior and source contracts only. No new phone/browser E2E run in this pass. |
| New temporary-video folder | PASS | Metadata shows owner-only access, no public/domain permission and personal My Drive placement. |
| Harmless marker upload and readback | PASS | A 486-byte text file reached that folder; fresh metadata confirmed its parent and owner-only permissions; fetching it returned the expected marker. This is not a video or a website upload. |
| Nine legacy brand destinations | PASS for existence and permissions | The tracked contract/analytics folders, two database Docs and Aura database folder exist. Each permits the Smithstem service account as writer. This does not prove runtime credentials or live database configuration. |
| Google sign-in in repo-default Supabase project | FAIL | Public auth settings returned HTTP 200 and explicit `external.google=false` at 20:35 UTC / 21:35 Lagos. This is the project in the repository defaults; the deployed app's environment override has not been verified. |
| Live application/business destination settings | UNVERIFIED | Public-role GETs returned HTTP 200 with zero rows. RLS may hide the settings; this is not evidence that configuration is missing. |
| Cloud console API/credential configuration | UNVERIFIED | Project Smithstem was previously visible, but the APIs screen stayed blank. No API/client/Vault readiness claim. |
| Vercel MCP access | PASS for authenticated project metadata | Full restart restored tools. Correct Smithstem project/repository link verified; production environment-to-database mapping remains unverified. |
| NorthQuest Supabase MCP access | BLOCKED by expired authentication | Fresh startup logs show expiry-triggered OAuth refresh failure. Reauthorization is needed; no authenticated database-policy proof yet. |

The test file is named `SMITHSTEM-STORAGE-VERIFICATION-2026-08-28.txt`, marker `smithstem-drive-placement-20260828-f4ecd46`. It remains in the new private folder. It contains no applicant data. Folder identifiers remain in the private local setup handoff outside the repository; no new folder ID is hardcoded into application code.

## Where things currently go

These are tracked code paths, not claims that live jobs have run successfully.

| Item | Current tracked path | Gap |
| --- | --- | --- |
| General application answers | `applicants` with `content_file_path` | Direct client submission is not the approved durable, identity-bound recruitment workflow. |
| General introduction video | Supabase `applicant-videos/unassigned/...`; then `apply-sync` attempts a Drive copy under global root → Applicant Videos | Tracked root is the older **1 TDT TECH** area, not the new temporary folder. Upload-before-record can leave an orphan. |
| Brand-specific application video | Supabase `applicant-videos/<businessId>/...` | This route does not invoke `apply-sync`; the two application paths differ. |
| Application Sheet row | Existing `app_settings.applicants_sheet_id`, or a newly created Creator Applicants Sheet under the global root | Changing the root alone would not redirect an already configured Sheet. Do not invoke the legacy function during this audit. |
| Manager introduction playback | Legacy admin uses a short-lived Supabase signed URL | No real applicant-to-Drive-file link, reviewer playback or wrong-agency denial proved for the new flow. |
| Onboarding signature | Supabase `contracts/<creatorId>/signature.png`; best-effort copy to assigned brand's signed-contract folder | The saved artifact is a signature image, not a complete versioned contract containing the displayed terms. Drive copy can fail after account onboarding succeeds. |
| Creator contact/bank/social details | Supabase profile/creator rows; legacy sync appends to the brand database Doc | Legacy code can also append supplied social-account passwords to that Doc. This needs security redesign before reuse; no actual passwords or Doc contents were read. |
| Daily links and weekly views | `video_logs` and `video_view_reports`; separate weekly collation creates a Sheet in the brand analytics folder/month | Not a synchronous export receipt. Legacy collation excludes trial creators and takes each platform's all-time maximum report without a reporting-period cutoff. |
| Apify outputs | `analytics_runs` plus monthly Sheet under the brand analytics folder | Legacy monthly-only implementation does not implement the approved cumulative 1–14, 1–21 and 1–month-end runs. No paid run invoked. |
| Bonus screenshots | Supabase `bonus-evidence`, linked from `bonus_claims` | Not introduction-video storage. Real trial-claim permissions, evidence delivery and payment rules remain unverified. |
| New recruitment prototype files/history | In-memory browser state and object URLs | Not durable application storage. Refresh persistence, actual media upload and server audit enforcement are not proved by prototype tests. |

### Existing brand destinations

| Brand | Contract destination | Analytics destination | Creator database destination |
| --- | --- | --- | --- |
| NorthQuest | NQ / SIGNED CONTRACTS | NQ / NQ ANALYTICS | NQ UGC DATABASE (Doc) |
| CashDrive | CASH DRIVE / CASH DRIVE SIGNED CONTRACTS | CASH DRIVE / ANALYTICS | CashDrive Creator Database (Doc) |
| Aura | AURA / SIGNED CONTRACTS | AURA / ANALYTICS | AURA / DATABASE (folder; code creates a Doc when none is configured) |

The contract/analytics folder parent names were verified separately. The database Docs' own parent folder identities were returned but not traversed further. Shared legacy destinations have owner, two human writer permissions and the named Smithstem service-account writer; no public/domain permission was returned. That permission list does not establish all intended agency/brand role boundaries.

## Failures and safety gates before reuse

1. **Sign-in:** verify the intended deployment/project, then configure/test Google sign-in in an approved test environment. Do not enable signup or change callbacks by guesswork.
2. **Upload destination and authorization:** connect the website to the new folder using a suitable authorized runtime identity. Connector consent is not website consent. The old service account is not on the new folder's permissions. Do not simply share the folder and assume personal-Drive upload ownership/quota works.
3. **Unsafe legacy synchronization:** `apply-sync` accepts a client storage path and performs a privileged download without binding it to an authenticated application owner. It lacks durable file receipts/idempotency and can return success despite a failed external append. Do not invoke it to “check”.
4. **Onboarding export:** retain the complete accepted contract/version; do not treat a signature PNG as the whole agreement. Remove the plaintext-password export pattern before reuse. Bind every downloaded object to the authorized creator and make partial failures visible/recoverable.
5. **Weekly reporting:** repair period selection, trial inclusion, reporting snapshots and failed-run retry before claiming correct Sheets. The tracked cron/period pairing can select an unfinished reporting window.
6. **Apify:** implement the approved three cumulative monthly windows across all brands, with idempotent jobs and cost safeguards. Aura's Monday–Sunday self-report gate does not change those Apify windows.
7. **Upload limit and retention:** resolve prototype 1 GB versus tracked 100 MiB storage limit. No automatic deletion until duration/recovery is approved. Trial/bonus evidence must not inherit temporary-introduction cleanup.

## Next verification sequence — not executed yet

1. Restore authorized read access to the intended Supabase project and Vercel configuration; compare live destinations/provider settings with the tracked values without exposing secrets.
2. Establish the separate test-environment/runtime authorization boundary. Do not test the legacy apply/onboarding jobs on real data: they can write existing Sheets/Docs or activate a membership.
3. Send one synthetic video through the actual application → private file → saved application attachment → authorized reviewer playback. Confirm the same file/record IDs at each step.
4. Test interrupted upload/retry, duplicate submission, failed database save, unavailable Drive and permission denial. No success screen before durable attachment confirmation.
5. Test anonymous, wrong applicant and wrong agency access; confirm the intended manager sees the file and another brand cannot.
6. After the reporting fixes, use synthetic rows to prove weekly Sheet placement and each cumulative analytics window. Keep paid scraping off until separately authorized.
7. Verify actual invitations, notifications, evidence review/onboarding, active-creator flows, deactivation, CashDrive inventory/enquiries and scale/security separately. These were not certified by this storage-focused pass.

## Evidence and reproduction

- `tests/storage-readonly-probe.js`: validates the exact repo-default host/public anon identity; only three fixed metadata GETs, no uploads, sync functions, secrets or mutations.
- `STORAGE_PUBLIC_PROBE_2026-08-28.json`: sanitized latest live results.
- Local checks: `node tests/recruitment-prototype.test.js`, `node tests/prototype-contract.test.js`, `node --check tests/storage-readonly-probe.js`; application: `npm run build` within `smithstem`.
- Source paths: `smithstem/app/apply/page.js`, `app/apply/[slug]/page.js`, `app/onboarding/page.js`, `app/dashboard/page.js`, `supabase/functions/{apply-sync,drive-sync,analytics-weekly,analytics-monthly}/index.ts` and the existing storage assessment.
- A separate reviewer independently traced these paths read-only. No credentials/customer records were inspected by that review.

No source Form/Sheet, production data, permission, credential, deployment or retention setting was changed. One clearly labelled non-production text marker was added to the newly approved private Drive folder. No files were deleted. No end-to-end readiness or launch approval is claimed.
