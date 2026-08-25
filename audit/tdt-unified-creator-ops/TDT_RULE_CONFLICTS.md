# Authoritative rule conflict audit

Current locked instructions override every historical item below.

| # | Locked rule | Conflicting or missing repository behavior | Evidence | Required resolution |
| --- | --- | --- | --- | --- |
| 1 | One login, separate business memberships | Foundation exists and matches | `business_memberships`, switcher | Preserve and harden |
| 2 | Choose/switch business after sign-in | Switcher exists only inside authenticated shell; no immediate chooser | `BusinessSwitcher.js`, routing | Add chooser for multi-business creators |
| 3 | Permanent limited trial; management can deactivate | Trial identity is permanent, but trial roster has no deactivate control; current toggle is active/inactive-oriented | admin trial roster | Add membership-safe trial deactivation/reactivation |
| 4 | One shared weekly cycle | NorthQuest/CashDrive use calendar blocks; Aura is hard-coded Monday–Sunday | migration `20260818213000`, `lib/domain.js` | Remove tenant-specific anchor branch |
| 5 | Gate from midnight after day seven | Current client waits until `joinedDaysAgo >= 7`, a personal clock, and relies on UI gating | dashboard lines 420–435 | Gate at shared boundary and enforce server-side |
| 6 | New joiners owe only post-join videos in current cycle | Personal seven-day exemption delays their first shared-boundary obligation | dashboard `joinedDaysAgo` guard | Filter by membership join time, not account age |
| 7 | Every video needs a report for that week | Any historical report permanently marks a video “fully reported”; reports have no `cycle_id` | `video_view_reports`, dashboard map | Store cycle-specific reports |
| 8 | 10,000 on one trial video automatically unlocks onboarding | CashDrive is 5,000; threshold is editable per business; admin must Approve/Dismiss | migrations `20260817203404`, `20260817054329`; admin crossing queue | Fixed 10,000; automatic idempotent transition; notification only |
| 9 | No manual approval switch | Current admin has Approve and Dismiss buttons and a `trial_approved` state | `approveCrossing`, trial tab | Remove manual qualification decision |
| 10 | Opening August video count, admin-entered | Migration carries pay/socials/join date and explicitly excludes history; no opening count | migration `20260817112706` | Add opening-balance import, not historical video rows |
| 11 | Historical links stay in Sheets | Current migration correctly leaves them out but lacks the opening count | same migration | Preserve non-import of links |
| 12 | Weekly reports auto-collate to designated Sheets folders | Function/folders exist, but schedules inherit conflicting anchors and only include active creators | analytics weekly function/migrations | Align shared cycle and agreed population; keep idempotency |
| 13 | Apify staged after weeks 2/3/4 | Code explicitly says monthly only; cron runs day 1 next month | analytics monthly function and cron migration | Replace with cumulative staged windows across all businesses |
| 14 | CashDrive inventory workflow | Entirely absent | repository search | Design/build after creator-core contracts |
| 15 | CashDrive enquiry-submission workflow | Entirely absent | repository search | Design/build with inventory relation and tenant RLS |
| 16 | Auditable system | Row timestamps exist, but project bible says no app-level audit log | `PROJECT_BIBLE.md` §8 | Add append-only audit events |
| 17 | Scale beyond 1,000 creators | Admin/dashboard perform broad client-side fetch/aggregation; no pagination contract | admin/dashboard queries | Paginate, index, batch, server-aggregate |
| 18 | Secure unified system | Root legacy intake still collects social/email passwords and sends to a visible Apps Script endpoint | root `intake.html`; `SECURITYUPGRADE.md` | Stop password collection; isolate/retire legacy path deliberately |
| 19 | Repository truth supports safe recovery | `SCHEMA.md` is stale and there are no build-state/evidence manifests or migration replay command | schema/package files | Rebuild live schema via read-only MCP, add verification commands/evidence |
| 20 | Production UI only after approval | Existing project bible already declares this gate | `PROJECT_BIBLE.md` §7 | Prototype only in this PR; production UI blocked |

## Historical conflict provenance

- `d14acd9` — “Give Aura its own Monday-Sunday gate…”
- `b270e50` — “Automate weekly/monthly analytics…”
- `3d95613` — CashDrive 5,000-view trial threshold.
- `beb2f78` — live per-business trial threshold.
- `fcbbc70` — manual trial lifecycle/approval model.

These commits remain valuable history, but their conflicting decisions are superseded.
