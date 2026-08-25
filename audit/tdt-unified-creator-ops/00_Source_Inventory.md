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
| Vercel MCP configuration | Enabled OAuth MCP registration | Connection registration only | Medium |
| Supabase MCP configuration | Project `zuuhlowjqniadtcpdypv`, `read_only=true` | Connection scope only | High for scope, unverified for live access |
| Root `index.html` / `intake.html` | Legacy Apps Script tracker | Historical/live-adjacent system | High |
| Git history | Older decisions and conflict provenance | Historical evidence only | High |

## Access result

- GitHub: `PASS` — repository read access and admin/push permissions confirmed.
- Vercel MCP: `UNVERIFIED` for project reads — configured, enabled, OAuth; no Vercel tools were exposed to this task.
- NorthQuest Supabase MCP: `UNVERIFIED` for live schema/data — configured, enabled, OAuth, project-scoped, read-only; no Supabase tools were exposed to this task.
- Production mutation: not attempted.

## Important source-quality finding

`supabase/SCHEMA.md` calls itself the current live schema, but it predates later tracked migrations for applicants, gate anchors, Drive analytics, `analytics_runs`, and shared migration invites. It must not be used as the sole migration baseline.
