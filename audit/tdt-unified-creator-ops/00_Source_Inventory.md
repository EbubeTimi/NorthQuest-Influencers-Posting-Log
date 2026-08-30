# TDT unified creator operations — source inventory

Audit date: 2026-08-25
Audited revision: `94e8d1aef44a97b873273c0f8b3a667f896b323c` (`main`)
Authority order: current locked user decisions → safety and access limits → repository rules → current code/runtime → older documents and history.

| Source | Evidence | Authority | Confidence |
| --- | --- | --- | --- |
| Current locked product decisions | This task | Desired product truth | High |
| GitHub connector | Repository metadata and permissions | Repository access | High |
| Local fresh clone | Code, migrations, history, tracked files | Current repository truth | High |
| `smithstem/CLAUDE.md` | Repository working rules | Repository constitution | High |
| `smithstem/PROJECT_BIBLE.md` | Product/architecture narrative | Durable but partly stale | Medium |
| `smithstem/supabase/migrations/` | Intended database change history | Code truth; live application unverified | High for intent, medium for live state |
| `smithstem/supabase/SCHEMA.md` | Generated schema snapshot | Stale: omits later migrations/tables | Low for current state |
| `smithstem/app/` and `components/` | Next.js production implementation | Current code truth | High |
| `smithstem.vercel.app` public homepage | Read-only browser inspection | Live public runtime | High for sign-in entry only |
| Vercel MCP | Team/project reads on 2026-08-25 | Live connection and project visibility | High |
| Supabase MCP | Project-scoped tables, migrations, and advisors read on 2026-08-25 | Live project truth; read-only use | High |
| Root `index.html` / `intake.html` | Legacy Apps Script tracker | Historical/live-adjacent system | High |
| Supplied `index.html` (`33BD36C…F7A20`) | 3,448-line legacy posting/admin frontend | Current-system code evidence supplied by user; not desired-product instruction | High |
| Supplied `intake.html` (`76470C7…55B2`) | 561-line onboarding frontend | Current-system code evidence supplied by user; not desired-product instruction | High |
| Supplied `Untitled document.txt` (`982BF2D…2913`) | 2,502-line Google Apps Script backend | Current-system backend evidence supplied by user; not desired-product instruction | High |
| Git history | Older decisions and conflict provenance | Historical evidence only | High |

## Access result

- GitHub: `PASS` — repository read access and admin/push permissions confirmed.
- Vercel MCP: `PASS` — team and the `smithstem` project linked to `EbubeTimi/NorthQuest-Influencers-Posting-Log` are visible.
- NorthQuest Supabase MCP: `PASS` — project-scoped read access confirmed through live public-table summaries, the migration ledger, and security advisors. No write was attempted.
- Production mutation: not attempted.

## Important source-quality finding

`supabase/SCHEMA.md` calls itself the current live schema, but it predates later tracked migrations for applicants, gate anchors, Drive analytics, `analytics_runs`, and shared migration invites. It must not be used as the sole migration baseline.

## Supplied legacy-system audit

The supplied files are sufficient to reverse-map the main legacy paths: public name selection, daily video logging, read-back confirmation, recent-video view entry, onboarding/intake, contract upload, admin password login, creator management, payments, and Google Sheets/Drive persistence.

Critical findings:

- `STORE_PASSWORDS = true` stores Gmail, Instagram, and TikTok passwords in both a Sheet and a Google Doc. The new system must never collect or migrate these credentials. If real credentials were collected, owners should change them.
- Public unauthenticated actions expose the full posting log (`get`) and the creator roster (`getCreators`). Creator submissions, view reports, and lookups trust a supplied name instead of an authenticated identity.
- Contract upload is unauthenticated, lacks meaningful file-size/type enforcement, and the intake page treats any completed HTTP request as upload success without checking the backend result.
- The administrator uses one shared password exchanged for a deterministic bearer key with no expiry or per-manager identity. This cannot provide the required individual audit trail.
- The Apps Script implementation uses one global script lock and broad Sheet scans/writes. It contains useful duplicate-submit/read-back ideas, but it is not a safe or proven foundation for tenant isolation or 1,000+ creators.

## Live Supabase security finding

- `CRITICAL`: `public._nq_scrape_jobs` has 75 rows and RLS disabled. Supabase reports that it is exposed through the public API roles. Do not enable RLS directly without the scraper's required service/policy design; fix through a reviewed migration and prove intended service access plus anon/authenticated denial.
- `WARN`: numerous `SECURITY DEFINER` functions are executable by `anon` or broad `authenticated` roles. Each needs an intentional-callers review and explicit grants/revokes.
- `WARN`: `public.email_shell` has a mutable search path.
- `WARN`: leaked-password protection is disabled. The planned Google-only creator login reduces password use for creators, but management/auth settings still require review.
- `INFO`: `_aura_scrape_jobs`, `_cd_scrape_jobs`, and `app_settings` have RLS enabled with no policies. This may be intentional service-only denial, but must be tested.

## Live migration-ledger drift

- Live ledger: 58 migrations. Repository folder: 55 SQL files.
- Live-only by migration name: `smithstem_core_schema`, `add_missing_self_insert_policies`, `allow_authed_users_to_read_business_by_slug`, and `bonus_claims_add_video_url`.
- Repository-only by migration name: `enforce_upload_limits_contracts_bonus_evidence`; it is not recorded as applied live.
- Nineteen same-named migrations use different version timestamps locally and live.

Do not rename, replay, or reconstruct these migrations from memory. Recover the canonical applied files/hashes, compare the real schema, then create forward-only repairs and prove a blank bootstrap twice in an isolated project.
