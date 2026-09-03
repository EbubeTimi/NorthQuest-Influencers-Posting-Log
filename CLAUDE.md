# Claude Code working agreement

Read `CLAUDE_CODE_HANDOFF_2026-08-29.md` and `NEXT_STEPS_2026-08-29.md` before changing anything. Reconstruct the current state from Git, the working tree, tests, migrations, and runtime evidence; do not restart the project or trust a narrative summary over repository truth.

## Required working method

- Use the project skill `/flow-by-flow` for every software task.
- Use `/flow-prototype` for complete UI/UX flows and obtain explicit prototype approval before production UI implementation.
- Use the TypeUI MCP for UI/UX work. If it is unavailable, read `/typeui-fundamentals` and its referenced modules as the documented fallback. Keep one visual direction.
- Explain work plainly to the non-engineer operator, one step at a time. Report every failed command or check immediately, explain the effect, fix it when safe, and re-run it.
- Inspect before asking. Continue through safe, reversible work without repeatedly asking permission.

## Safety and authority

- Current user instructions override historical repository rules. Record every conflict in `audit/tdt-unified-creator-ops/TDT_RULE_CONFLICTS.md` before relying on old behavior.
- Work only on `codex/unified-tdt-creator-ops-prototype` or a new branch from it. Never write directly to `main`.
- Existing draft pull request: https://github.com/EbubeTimi/NorthQuest-Influencers-Posting-Log/pull/1
- Do not deploy to production without explicit approval.
- Do not apply a live Supabase migration, change DNS, incur paid costs, or mutate production data without explicit approval for that exact action.
- NorthQuest Supabase MCP is project-scoped and read-only. Do not treat admin/owner queries as proof that RLS works for real callers.
- Do not edit the source Google Form or source Google Sheets. Do not import old creator data. September 1 is a target, not evidence of readiness.
- Preserve all pre-existing modified and untracked files. Stage only files intentionally changed for the current task.
- Never collect Gmail, Instagram, or TikTok passwords. Never commit secrets, tokens, OTPs, private Drive identifiers, or environment-variable values.

## Product boundary

This is one connected GrowthCooks Marketing Agency creator-operations platform under TDT, serving NorthQuest, CashDrive, and Aura. It is not separate apps. Recruitment distributes accepted applicants into business pipelines; one TDT-wide trial leads to business onboarding and active memberships. CashDrive additionally has Inventory and Enquiries.

Build in the dependency order recorded in `audit/tdt-unified-creator-ops/00_Flow_Map.md`. Keep prototypes read-only and deterministic. Production UI remains blocked until each representative prototype is explicitly approved.
