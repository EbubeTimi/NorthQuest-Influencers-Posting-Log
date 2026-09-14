# Project continuity instructions

Before doing any work in this repository, read `CURRENT_PROJECT_STATE.md` and the authoritative flow files it links. Treat newer explicit user instructions as authoritative, but do not ask the user to repeat decisions already recorded there.

After every major approved decision, completed flow, failed verification, or change in the next action, update `CURRENT_PROJECT_STATE.md` in the same turn. Keep detailed product rules in `audit/tdt-unified-creator-ops/00_Flow_Contracts.md` and conflicts in `audit/tdt-unified-creator-ops/TDT_RULE_CONFLICTS.md`.

Never write directly to `main`, deploy to production, mutate production data, or modify source Google Forms/Sheets without explicit approval. Preserve unrelated working-tree changes. Notify the user immediately of every failed command, build, test, connection, render, migration, or verification.
