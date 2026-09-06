# Current project state

Last updated: 6 September 2026, Africa/Lagos.

This is the canonical restart point for the unified TDT/Smithstem creator-operations project. Read it before continuing work and update it after every major approved decision, completed flow, failed verification, or change in the next action. Detailed rules remain in `audit/tdt-unified-creator-ops/00_Flow_Contracts.md` and `audit/tdt-unified-creator-ops/TDT_RULE_CONFLICTS.md`.

## Safety and delivery boundary

- Repository: `EbubeTimi/NorthQuest-Influencers-Posting-Log`.
- Working branch: `codex/unified-tdt-creator-ops-prototype`.
- Draft pull request: `https://github.com/EbubeTimi/NorthQuest-Influencers-Posting-Log/pull/1`.
- Never write directly to `main`.
- Production UI implementation and deployment require explicit user approval.
- Do not mutate production data or the source Google Form/Sheets without explicit approval.
- Preserve unrelated and pre-existing working-tree changes. Stage exact paths only.
- Tell the user immediately when any command, build, test, connection, render, migration, or verification fails.

## Product authority

- TDT is the parent. GrowthCooks Marketing Agency is the operational recruitment workspace; do not assert an unconfirmed legal-subsidiary relationship.
- Canonical brands are NorthQuest, CashDrive, and Aura.
- One person uses one personal-Google identity and separate brand memberships. Active multi-brand creators can switch businesses; a trial creator has one trial business and never repeats a passed TDT-wide trial.
- Trial qualification requires one already-recorded content link/platform, a claimed count of at least 10,000, and a screenshot of that exact post. Management verifies and approves onboarding; self-report never self-approves.
- Exactly two daily video slots, each with TikTok and Instagram. No Video 3 and no Facebook tracking/bonus.
- Today is locked. Yesterday appears only when missed and until 12:00 PM the next day.
- Aura uses Monday-Sunday. NorthQuest and CashDrive use managed business periods. New creators join the period in progress and owe reports only for content logged after joining.
- Apify runs per business with a separate business account/credential at cumulative days 1-14, 1-21, and 1-month-end; no week-one run.
- Smithstem never collects or stores Google, TikTok, or Instagram passwords. Each brand controls one management boundary containing many separate creator-operated accounts: for example, roughly 70 distinct NorthQuest TikTok accounts and 70 distinct NorthQuest Instagram accounts, with one account pair assigned to each creator. Creators receive removable least-privilege roles only for their own account pair; management controls the portfolio, recovery factors and reassignment.
- Contracts are brand-specific. Smith currently uploads a complete Word/PDF source and is the sole contract authority; Smith's confirmation makes it live for new onboarding immediately. Replaced sources and signed PDFs remain immutable in private history, and material changes may use a selective or all-creator re-signing case.
- Canonical database/file destinations and the remaining implementation order are recorded in `audit/tdt-unified-creator-ops/DATA_STORAGE_ARCHITECTURE.md`.

## Completed and verified

- Repository audit, authoritative rule conflicts, flow map, and flow contracts are recorded.
- Trial creator prototype revision 7 is visually approved.
- Recruitment prototype is accepted for now. A shared TypeUI-guided mobile-first visual pass was applied on 4 September 2026 and awaits the user's visual approval.
- Brand-onboarding prototype behavior was accepted on 4 September 2026 (“I think we're all done here”). It includes the concise entry/status copy, profile placeholders, automatic reload/back draft recovery, every review field shown separately (including the creator's full account number), an in-document signed-agreement preview, exact field-level corrections including signature re-entry, management review with an accessible Select all/Clear all shortcut for its four approval checks, and paused read-only records. The shared TypeUI-guided visual pass is applied and awaits visual approval.
- Onboarding prototype uses a side-by-side review shell on wide screens and an accessible state selector on narrow screens.
- All 25 standalone test files pass after management revision 3, including 16/16 management structural checks, 5/5 headless-Chrome management flow checks, the isolated PostgreSQL/RLS migration replay and 4/4 shared TypeUI checks. The Next.js production build also passes with exit code 0. Chrome verified Home -> Trial results -> evidence -> Back, Approve trial without activation, Home -> Onboarding submissions -> full record/signed agreement -> explicit completion, and 1440px/390px layouts without horizontal overflow. Evidence screenshots were generated; Codex's image viewer could not open them because of the recurring Windows ACL sandbox fault, which is recorded rather than treated as a visual pass.
- Active creator prototype revision 16 is behavior/flow approved as the basis for the next phase. Home is summary-only, the current Lagos date precedes the greeting, a separate centre Track action owns daily entry, and five accessible icon actions cover Home, Track, Videos, Bonuses and Payments. “Your dashboard” switches between This month and All time. Monthly target follows the actual month length; expected pay is separate from settled payments; the zero-bonus state omits a meaningless naira amount; and the Active badge and aggregate “Total so far” were removed. This approval does not authorize production UI implementation or deployment.
- Contract-management prototype revision 2 is ready for review. It uses the compact “Management Business Contracts” list, clear right-aligned Manage actions, complete DOCX/PDF upload, Smith's immediate Make live confirmation, current-contract viewing, private history, selective or all-creator re-signing, creator dashboard notice, upload failure and restricted-access states. A creator can now be selected for re-signing by tapping the name or anywhere in that row, while Select all/Clear all remains available. It removes the clause editor, version badges, archive clutter, second approver and waiting queue. TypeUI phone-first safeguards are applied. It performs no external write.
- Unified management dashboard prototype revision 3 is ready for review. Management/admin remains PC-first and phone-responsive. Home now separates Trial results, Onboarding submissions, Bonus claims and Payments. Trial review shows the screenshot, recorded platform/video, reported views and inline post link; Approve trial only unlocks onboarding, while Keep in trial preserves the evidence. Onboarding review is a later queue with every submitted field and the generated signed agreement; completion and exact correction have explicit result states. Back returns through the operator's actual navigation path. The prototype is local/read-only and performs no external write.
- A browser-cache mismatch briefly reopened the older onboarding copy during verification. The live file response was confirmed current and the reviewer URL was refreshed with `v=8`; the corrected Ready screen and complete state list then rendered successfully.
- RLS hardening migration is prepared and locally proven but not applied to production.
- Contract review on 3 September found `UGC Agreement (2).docx` and `(3).docx` textually and visually identical NorthQuest agreements. Neither is Aura. Their credential-sharing and termination-control clauses conflict with secure account reassignment and require a legally approved new version.

## Still open or blocked

- Correct distinct Aura agreement is not available.
- `Cashdrive Creator Contract.docx` is available and was inspected read-only as the current CashDrive prototype source. It is not published or changed by this work.
- Smith is the sole current contract authority. The production permission remains a dedicated role so Smith can explicitly delegate it later.
- Vercel project currently has no environment variables configured. Required production secret names and values remain unconfigured and unverified.
- TypeUI OAuth is connected and TypeUI MCP tools are exposed in this task. The six project-local TypeUI fundamentals guardrails are installed and were read before the shared mobile-first visual pass.
- Live Supabase RLS remains pending a backup, explicit live-change approval, migration, permission tests, and a clean security-advisor rerun.
- Recruitment uploads, Drive destination, signed-PDF generation/storage, platform role invitations, notifications, Sheets collation, Apify jobs, CashDrive enquiries/inventory, and end-to-end staging are not production-ready.
- No production deployment has been authorized or performed.

## Current next actions

1. Review and approve or revise unified management dashboard prototype revision 3 and contract-management prototype revision 2; provide the correct Aura contract when ready.
2. Prototype CashDrive enquiries and inventory after the unified management flow.
3. Design the separate approved password-vault handover procedure if platform delegation remains unavailable; raw social passwords remain excluded from Smithstem.
4. Connect the management dashboard to the durable video-log, weekly-report, bonus, payment, onboarding, contract and audit stores during the later approved implementation phase.
5. Implement and verify private uploads, signed PDFs, audit history, notifications, Sheets, and per-business Apify connections in a non-production environment.
6. Complete live-safety preparation and request explicit approval immediately before any production RLS change.
7. Run complete phone-first, role-isolation, retry, security, scale, and end-to-end tests.
8. Repeat the TypeUI/UI-UX pass for each new flow, obtain explicit production approval for the complete system, and only then deploy.

## Restart protocol

When resuming this task, do not restart discovery and do not ask the user to repeat already recorded observations. Read, in order:

1. `CURRENT_PROJECT_STATE.md`
2. `audit/tdt-unified-creator-ops/00_Flow_Map.md`
3. `audit/tdt-unified-creator-ops/00_Flow_Contracts.md`
4. `audit/tdt-unified-creator-ops/TDT_RULE_CONFLICTS.md`
5. The brief for the flow being changed under `prototypes/`

Then inspect the current branch and working tree before changing anything. New explicit user instructions override this checkpoint and must be recorded here and in the relevant flow contract.
