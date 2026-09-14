# Smithstem Codex Guide

This folder is the Smithstem application. It is a Next.js and Supabase application deployed as the `smithstem` Vercel project. Vercel uses this `smithstem` folder as its root directory.

## Start here

Before changing code, read:

1. `../CURRENT_PROJECT_STATE.md`
2. `../docs/flow-contracts.md`
3. `../docs/flow-conflicts.md`
4. `README.md`
5. `CLAUDE.md` for the engineering and design decisions carried over from earlier work

The repository-level `../AGENTS.md` also applies. Preserve the current branch, uncommitted files, prototypes, and evidence.

## Working rules

- Continue the documented flow contracts rather than inventing a new product structure.
- Use a flow-by-flow approach for software work. For interface changes, prepare and validate a prototype before replacing an approved flow.
- Keep the visible product practical, clear, and suitable for a multi-person creator operations team.
- Never collect or store Gmail, Instagram, TikTok, or other account passwords.
- Never expose environment values, service keys, personal data, or production records.
- Do not change production Supabase data, apply production migrations, deploy to Vercel, merge branches, or push commits without Smith's explicit approval.
- Do not discard or overwrite existing local changes.

## Validation

Use the scripts already defined in `package.json`:

- `npm run dev`
- `npm run build`
- `npm run test:prototype`
- `npm run test:security`

Run only the checks relevant to the change, then report what passed and any remaining limitation.
